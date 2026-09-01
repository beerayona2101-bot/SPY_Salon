const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  action: { 
    type: String, 
    required: true 
  },
  details: { 
    type: String, 
    required: true 
  },
  user: { 
    type: String, 
    default: 'System Admin' 
  },
  branchId: { 
    type: String, 
    default: null 
  }
}, { timestamps: true });

activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ branchId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
