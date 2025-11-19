require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const listUsers = async () => {
  await connectDB();

  try {
    const users = await User.find().select('name email role createdAt').sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      process.exit(0);
    }

    console.log('\n📋 All Users:\n');
    console.log('─'.repeat(80));
    console.log(`${'Email'.padEnd(30)} ${'Name'.padEnd(20)} ${'Role'.padEnd(10)} ${'Created'}`);
    console.log('─'.repeat(80));
    
    users.forEach((user) => {
      const role = (user.role || 'user').padEnd(10);
      const email = user.email.padEnd(30);
      const name = (user.name || '').padEnd(20);
      const created = new Date(user.createdAt).toLocaleDateString();
      console.log(`${email} ${name} ${role} ${created}`);
    });
    
    console.log('─'.repeat(80));
    console.log(`\nTotal users: ${users.length}`);
    console.log(`Admins: ${users.filter(u => u.role === 'admin').length}`);
    console.log(`Regular users: ${users.filter(u => (u.role || 'user') === 'user').length}`);
    console.log('\n💡 To set a user as admin, run:');
    console.log('   node scripts/setAdmin.js <email>\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
};

listUsers();

