const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  domain: {
    type: String,
    required: [true, 'Company domain is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/, 'Please provide a valid domain']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index on domain for faster lookups
companySchema.index({ domain: 1 });

module.exports = mongoose.model('Company', companySchema);

