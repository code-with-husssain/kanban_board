require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const connectDB = require('../config/db');

// Helper function to extract domain from email
const extractDomain = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
  const match = email.match(emailRegex);
  if (!match) {
    return null;
  }
  return match[1].toLowerCase();
};

// Helper function to generate company name from domain
const generateCompanyName = (domain) => {
  return domain.split('.')[0]
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ' Company';
};

const migrateDomainBasedAdmin = async () => {
  await connectDB();

  console.log('🚀 Starting domain-based admin migration...\n');

  try {
    // Get all users
    const users = await User.find();
    console.log(`📊 Found ${users.length} users to process\n`);

    if (users.length === 0) {
      console.log('✅ No users to migrate. Exiting.');
      process.exit(0);
    }

    // Group users by domain
    const usersByDomain = new Map();

    for (const user of users) {
      const domain = extractDomain(user.email);
      if (!domain) {
        console.log(`⚠️  Skipping user ${user.email} - invalid email format`);
        continue;
      }

      if (!usersByDomain.has(domain)) {
        usersByDomain.set(domain, []);
      }
      usersByDomain.get(domain).push(user);
    }

    console.log(`📧 Found ${usersByDomain.size} unique domains\n`);

    let companiesCreated = 0;
    let companiesUpdated = 0;
    let usersUpdated = 0;
    let adminsAssigned = 0;

    // Process each domain
    for (const [domain, domainUsers] of usersByDomain.entries()) {
      console.log(`\n🔍 Processing domain: ${domain}`);
      console.log(`   Users: ${domainUsers.length}`);

      // Find or create company for this domain
      let company = await Company.findOne({ domain });

      if (!company) {
        // Check if any user has a companyId - we might need to update an existing company
        const userWithCompany = domainUsers.find(u => u.companyId);
        
        if (userWithCompany) {
          // Get the existing company
          company = await Company.findById(userWithCompany.companyId);
          if (company) {
            // Update existing company with domain
            if (!company.domain) {
              company.domain = domain;
              await company.save();
              companiesUpdated++;
              console.log(`   ✅ Updated existing company "${company.name}" with domain ${domain}`);
            } else {
              console.log(`   ℹ️  Company "${company.name}" already has domain ${company.domain}`);
            }
          }
        }

        // If still no company, create a new one
        if (!company) {
          const companyName = generateCompanyName(domain);
          company = await Company.create({
            name: companyName,
            domain
          });
          companiesCreated++;
          console.log(`   ✅ Created new company: "${companyName}" (${domain})`);
        }
      } else {
        console.log(`   ℹ️  Company "${company.name}" already exists for this domain`);
      }

      // Assign all users of this domain to the company
      let firstUser = null;
      let firstUserTime = null;

      for (const user of domainUsers) {
        let userUpdated = false;

        // Assign company if user doesn't have one
        if (!user.companyId || user.companyId.toString() !== company._id.toString()) {
          user.companyId = company._id;
          userUpdated = true;
        }

        // Track the first user (by creation date) for admin assignment
        if (!firstUser || (user.createdAt && (!firstUserTime || user.createdAt < firstUserTime))) {
          firstUser = user;
          firstUserTime = user.createdAt || new Date(0);
        }

        if (userUpdated) {
          await user.save();
          usersUpdated++;
        }
      }

      // Assign admin role to first user if no admin exists for this company
      const existingAdmins = await User.countDocuments({
        companyId: company._id,
        role: 'admin'
      });

      if (existingAdmins === 0 && firstUser) {
        if (firstUser.role !== 'admin') {
          firstUser.role = 'admin';
          await firstUser.save();
          adminsAssigned++;
          console.log(`   👑 Assigned admin role to first user: ${firstUser.name} (${firstUser.email})`);
        }
      } else if (existingAdmins > 0) {
        console.log(`   ℹ️  Company already has ${existingAdmins} admin(s)`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Companies created: ${companiesCreated}`);
    console.log(`🔄 Companies updated: ${companiesUpdated}`);
    console.log(`👥 Users updated: ${usersUpdated}`);
    console.log(`👑 Admins assigned: ${adminsAssigned}`);
    console.log('='.repeat(50));
    console.log('\n✅ Migration completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    process.exit(1);
  }
};

migrateDomainBasedAdmin();

