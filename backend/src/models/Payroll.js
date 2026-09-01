const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  slipId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  employeeId: { 
    type: String, 
    required: true 
  },
  employeeName: { 
    type: String, 
    required: true 
  },
  empCode: { 
    type: String, 
    required: true 
  },
  month: { 
    type: String, 
    required: true 
  },
  baseSalary: { 
    type: Number, 
    required: true 
  },
  incentives: { 
    type: Number, 
    default: 0 
  },
  deductions: { 
    type: Number, 
    default: 0 
  },
  netPay: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    required: true 
  },
  paymentDate: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Paid', 'Pending', 'Processing'], 
    default: 'Paid' 
  },
  branchId: { 
    type: String, 
    default: null 
  }
}, { timestamps: true });


payrollSchema.index({ employeeId: 1 });
payrollSchema.index({ branchId: 1 });
payrollSchema.index({ month: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
