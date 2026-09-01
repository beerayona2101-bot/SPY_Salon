const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, default: null },
  startTimestamp: { type: Date, required: true },
  endTimestamp: { type: Date, default: null },
  duration: { type: Number, default: 0 } // Duration in minutes
}, { _id: true });

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  date: { type: String, required: true, index: true }, // Format YYYY-MM-DD (Asia/Kolkata)
  clockIn: { type: String, default: null },
  clockOut: { type: String, default: null }, // MUST BE NULL while employee is working!
  clockInTimestamp: { type: Date, default: null },
  clockOutTimestamp: { type: Date, default: null },
  status: { type: String, default: 'Present' },
  attendanceState: { 
    type: String, 
    enum: ['NOT_CLOCKED_IN', 'CLOCKED_IN', 'ON_BREAK', 'CLOCKED_OUT'], 
    default: 'CLOCKED_IN' 
  },
  attendanceType: {
    type: String,
    enum: ['NOT_FINALIZED', 'FULL_DAY', 'HALF_DAY', 'LEAVE', 'ABSENT', 'HOLIDAY', 'WEEKLY_OFF'],
    default: 'NOT_FINALIZED'
  },
  breaks: [breakSchema],
  totalBreakDuration: { type: Number, default: 0 }, // Total break time in minutes
  totalShiftDuration: { type: Number, default: 0 }, // Total shift time in minutes
  effectiveWorkingDuration: { type: Number, default: 0 }, // Working time minus breaks in minutes
  branchId: { type: String, default: null }
}, { timestamps: true });

// Prevent duplicate attendance records for the same employee and working date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

