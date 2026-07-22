const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  employeeName: { type: String, required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  clockIn: { type: String, default: '09:00 AM' },
  clockOut: { type: String, default: '06:00 PM' },
  status: { type: String, enum: ['Present', 'Absent', 'On Leave', 'Late', 'Half Day'], default: 'Present' }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
