const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  enquiryId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  name: { 
    type: String, 
    required: [true, 'Customer name is required'], 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Customer email is required'], 
    trim: true, 
    lowercase: true 
  },
  phone: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  message: { 
    type: String, 
    required: [true, 'Message content is required'], 
    trim: true 
  },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'In Progress', 'Resolved', 'Closed'], 
    default: 'New',
    index: true
  },
  adminNotes: { 
    type: String, 
    default: '' 
  },
  ipAddress: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
