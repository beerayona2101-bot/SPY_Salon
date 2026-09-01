/**
 * Safe Migration Utility for Historical Attendance Records
 * Clears fake default '06:00 PM' clock-out values for active today shifts
 * and populates attendanceState for existing records.
 */
const Attendance = require('../models/Attendance');

const migrateAttendanceRecords = async () => {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // 1. For records created today where clockOut === '06:00 PM' and clockIn exists:
    // This was created by the old bug. Reset clockOut to null and set attendanceState to 'CLOCKED_IN'
    const updatedToday = await Attendance.updateMany(
      {
        date: todayStr,
        clockOut: '06:00 PM',
        $or: [
          { attendanceState: { $exists: false } },
          { attendanceState: 'CLOCKED_IN' },
          { attendanceState: 'NOT_CLOCKED_IN' }
        ]
      },
      {
        $set: {
          clockOut: null,
          attendanceState: 'CLOCKED_IN',
          status: 'Present'
        }
      }
    );

    if (updatedToday.modifiedCount > 0) {
      console.log(`[Attendance Migration] Cleared fake 06:00 PM clockOut for ${updatedToday.modifiedCount} today records.`);
    }

    // 2. Set attendanceState for historical records that don't have it
    await Attendance.updateMany(
      { attendanceState: { $exists: false }, clockOut: { $ne: null } },
      { $set: { attendanceState: 'CLOCKED_OUT' } }
    );

    await Attendance.updateMany(
      { attendanceState: { $exists: false }, clockOut: null },
      { $set: { attendanceState: 'CLOCKED_IN' } }
    );

  } catch (err) {
    console.error('[Attendance Migration Error]:', err.message);
  }
};

module.exports = migrateAttendanceRecords;
