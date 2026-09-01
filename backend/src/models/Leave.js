const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  employeeEmail: { type: String, default: null },
  employeePhone: { type: String, default: null },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending',
    index: true 
  },
  actionByAdminId: { type: String, default: null },
  actionByAdminName: { type: String, default: null },
  rejectionReason: { type: String, default: null },
  actionTimestamp: { type: Date, default: null },
  branchId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
