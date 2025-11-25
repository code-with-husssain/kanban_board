const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, protect } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Helper function to extract domain from email
const extractDomain = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
  const match = email.match(emailRegex);
  if (!match) {
    throw new Error('Invalid email format');
  }
  return match[1].toLowerCase();
};

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Extract domain from email
    let domain;
    try {
      domain = extractDomain(email);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find or create company by domain
    let company = await Company.findOne({ domain });
    
    if (!company) {
      // Create new company with domain
      // Use a default name based on domain (e.g., "company.com" -> "Company")
      const companyName = domain.split('.')[0]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + ' Company';
      
      company = await Company.create({
        name: companyName,
        domain
      });
    }

    // Check if this is the first user for this company
    const existingUsersCount = await User.countDocuments({ companyId: company._id });
    const isFirstUser = existingUsersCount === 0;

    // Determine role: first user becomes admin, others become user
    const role = isFirstUser ? 'admin' : 'user';

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      companyId: company._id,
      role
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      },
      company: {
        _id: company._id,
        name: company.name,
        domain: company.domain
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error (email or domain)
      if (error.keyPattern?.email) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }
      if (error.keyPattern?.domain) {
        return res.status(400).json({ error: 'Company with this domain already exists' });
      }
      return res.status(400).json({ error: 'Duplicate entry detected' });
    }
    next(error);
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Extract domain from email
    let emailDomain;
    try {
      emailDomain = extractDomain(email);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get user's company
    let company = await Company.findById(user.companyId);

    // If user doesn't have a companyId (legacy user), create company from domain
    if (!company) {
      // Check if company with this domain exists
      company = await Company.findOne({ domain: emailDomain });
      
      if (!company) {
        // Create new company with domain
        const companyName = emailDomain.split('.')[0]
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') + ' Company';
        
        company = await Company.create({
          name: companyName,
          domain: emailDomain
        });
      }
      
      // Assign company to user
      user.companyId = company._id;
      
      // If this is the first user for this company, make them admin
      const existingUsersCount = await User.countDocuments({ companyId: company._id });
      if (existingUsersCount === 0) {
        user.role = 'admin';
      }
      
      await user.save();
    } else {
      // Verify user's company domain matches their email domain (security check)
      if (company.domain && company.domain !== emailDomain) {
        return res.status(403).json({ 
          error: 'Email domain does not match company domain. Please contact support.' 
        });
      }
      
      // If company doesn't have a domain set (legacy), update it
      if (!company.domain) {
        company.domain = emailDomain;
        await company.save();
      }
    }

    // Generate token
    const token = generateToken(user._id);
      
      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          companyId: user.companyId
        },
        company: company ? {
          _id: company._id,
          name: company.name,
          domain: company.domain
        } : null
      });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user (protected route)
router.get('/me', async (req, res, next) => {
  try {
    // This will be protected by auth middleware
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).populate('companyId');
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
          companyId: user.companyId
        },
        company: user.companyId ? {
          _id: user.companyId._id,
          name: user.companyId.name,
          domain: user.companyId.domain
        } : null
      });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/users - Get all users in the same company (protected route)
router.get('/users', protect, async (req, res, next) => {
  try {
    // Get current user to find their company
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all users in the same company
    const users = await User.find({ companyId: currentUser.companyId })
      .select('name email _id role companyId')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/companies - Get all companies (public route for company selection during registration)
router.get('/companies', async (req, res, next) => {
  try {
    const companies = await Company.find().select('name _id createdAt').sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/promote-user/:userId - Promote a user to admin (admin only, same company)
router.post('/promote-user/:userId', protect, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Verify current user is an admin
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can promote users' });
    }

    // Get current user's full data with company
    const adminUser = await User.findById(currentUser._id);
    if (!adminUser || !adminUser.companyId) {
      return res.status(404).json({ error: 'Admin user not found or has no company' });
    }

    // Find target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify target user is in the same company
    if (targetUser.companyId.toString() !== adminUser.companyId.toString()) {
      return res.status(403).json({ error: 'You can only promote users in your own company' });
    }

    // Prevent promoting yourself (optional, but good practice)
    if (targetUser._id.toString() === adminUser._id.toString()) {
      return res.status(400).json({ error: 'You are already an admin' });
    }

    // Check if user is already an admin
    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'User is already an admin' });
    }

    // Promote user to admin
    targetUser.role = 'admin';
    await targetUser.save();
    
    res.json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.email}) has been promoted to admin`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/demote-user/:userId - Demote an admin to user (admin only, same company)
router.post('/demote-user/:userId', protect, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Verify current user is an admin
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can demote users' });
    }

    // Get current user's full data with company
    const adminUser = await User.findById(currentUser._id);
    if (!adminUser || !adminUser.companyId) {
      return res.status(404).json({ error: 'Admin user not found or has no company' });
    }

    // Find target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify target user is in the same company
    if (targetUser.companyId.toString() !== adminUser.companyId.toString()) {
      return res.status(403).json({ error: 'You can only demote users in your own company' });
    }

    // Prevent demoting yourself
    if (targetUser._id.toString() === adminUser._id.toString()) {
      return res.status(400).json({ error: 'You cannot demote yourself' });
    }

    // Check if user is not an admin
    if (targetUser.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }

    // Check if this is the last admin in the company
    const adminCount = await User.countDocuments({ 
      companyId: adminUser.companyId, 
      role: 'admin' 
    });
    
    if (adminCount <= 1) {
      return res.status(400).json({ 
        error: 'Cannot demote the last admin in the company. At least one admin is required.' 
      });
    }

    // Demote user to regular user
    targetUser.role = 'user';
    await targetUser.save();
    
    res.json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.email}) has been demoted to regular user`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/set-admin - Set a user as admin (protected by admin secret)
router.post('/set-admin', async (req, res, next) => {
  try {
    const { email, adminSecret } = req.body;
    const requiredAdminSecret = process.env.ADMIN_SECRET;

    // Check if admin secret is configured
    if (!requiredAdminSecret) {
      return res.status(500).json({ 
        error: 'Admin secret not configured. Please set ADMIN_SECRET environment variable.' 
      });
    }

    // Verify admin secret
    if (!adminSecret || adminSecret !== requiredAdminSecret) {
      return res.status(401).json({ error: 'Invalid admin secret' });
    }

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Set user as admin
    user.role = 'admin';
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.name} (${user.email}) has been set as admin`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

