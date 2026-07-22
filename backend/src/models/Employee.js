const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  specialties: [{ type: String }], // e.g. ['Hair Stylist', 'Skin Care', 'Nail Artist', 'Massage']
  services: [{ type: String }],    // Names or Slugs of services provided by this employee
  workingHours: {
    start: { type: String, default: '09:00' }, // 24hr format
    end: { type: String, default: '19:00' }
  },
  breakTime: {
    start: { type: String, default: '13:00' },
    end: { type: String, default: '14:00' }
  },
  slotIntervalMinutes: { type: Number, default: 30 },
  status: { type: String, enum: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' }
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
