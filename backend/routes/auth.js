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

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, companyName, companyId } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    let company;
    
    // If companyId is provided, use existing company
    if (companyId) {
      company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
    } 
    // If companyName is provided, create new company
    else if (companyName) {
      company = await Company.create({
        name: companyName.trim()
      });
    } 
    // Otherwise, create a default company with user's name
    else {
      company = await Company.create({
        name: `${name}'s Company`
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      companyId: company._id
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        companyId: user.companyId
      },
      company: {
        _id: company._id,
        name: company.name
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User already exists with this email' });
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
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If user doesn't have a companyId (legacy user), create a default company
    if (!user.companyId) {
      const defaultCompany = await Company.create({
        name: `${user.name}'s Company`
      });
      user.companyId = defaultCompany._id;
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

      // Get user's company
      const company = await Company.findById(user.companyId);
      
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
          name: company.name
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
          name: user.companyId.name
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

