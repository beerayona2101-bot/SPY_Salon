const mongoose = require('mongoose');

const enquiryTemplateSchema = new mongoose.Schema({
  templateId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  icon: { 
    type: String, 
    default: '✨' 
  },
  category: { 
    type: String, 
    default: 'General' 
  },
  message: { 
    type: String, 
    required: true 
  },
  displayOrder: { 
    type: Number, 
    default: 1 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active' 
  }
}, { timestamps: true });


enquiryTemplateSchema.index({ status: 1 });
enquiryTemplateSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('EnquiryTemplate', enquiryTemplateSchema);
