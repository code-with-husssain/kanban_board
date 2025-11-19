require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const setAdmin = async () => {
  await connectDB();

  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node scripts/setAdmin.js <email>');
    console.log('Example: node scripts/setAdmin.js admin@example.com');
    process.exit(1);
  }

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();
    
    console.log(`✅ User ${user.name} (${user.email}) has been set as admin`);
    console.log(`You can now login with:`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: [the password you set during registration]`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin:', error);
    process.exit(1);
  }
};

setAdmin();

