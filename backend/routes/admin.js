const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to verify admin secret
const verifyAdminSecret = (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'] || req.body.adminSecret;
  const requiredAdminSecret = process.env.ADMIN_SECRET;

  if (!requiredAdminSecret) {
    return res.status(500).json({ 
      error: 'Admin secret not configured. Please set ADMIN_SECRET environment variable.' 
    });
  }

  if (!adminSecret || adminSecret !== requiredAdminSecret) {
    return res.status(401).json({ error: 'Invalid admin secret' });
  }

  next();
};

// POST /api/admin/verify-secret - Verify admin secret
router.post('/verify-secret', (req, res) => {
  const { adminSecret } = req.body;
  const requiredAdminSecret = process.env.ADMIN_SECRET;

  if (!requiredAdminSecret) {
    return res.status(500).json({ 
      error: 'Admin secret not configured. Please set ADMIN_SECRET environment variable.' 
    });
  }

  if (!adminSecret || adminSecret !== requiredAdminSecret) {
    return res.status(401).json({ error: 'Invalid admin secret' });
  }

  res.json({ success: true, message: 'Admin secret verified' });
});

// GET /api/admin/users - Get all users (protected by admin secret)
router.get('/users', verifyAdminSecret, async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name email _id role createdAt')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/set-admin/:userId - Set a user as admin
router.post('/set-admin/:userId', verifyAdminSecret, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'User is already an admin' });
    }

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

// POST /api/admin/remove-admin/:userId - Remove admin role from user
router.post('/remove-admin/:userId', verifyAdminSecret, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }

    user.role = 'user';
    await user.save();
    
    res.json({
      success: true,
      message: `Admin role removed from ${user.name} (${user.email})`,
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

