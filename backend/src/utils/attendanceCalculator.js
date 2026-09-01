/**
 * Authoritative Attendance Calculator & Monthly Aggregation Engine
 * Single Source of Truth for SPY Salon Employee Attendance Classification
 */
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

// Official 7-Hour Threshold (420 minutes)
const FULL_DAY_MINUTES_THRESHOLD = 420;

// Salon Holidays List
const SALON_HOLIDAYS = [
  { date: '2026-01-26', title: 'Republic Day' },
  { date: '2026-07-15', title: 'Studio Mid-Summer Maintenance' },
  { date: '2026-08-15', title: 'Independence Day' },
  { date: '2026-10-02', title: 'Gandhi Jayanti' },
  { date: '2026-11-08', title: 'Diwali Gala Festival' }
];

/**
 * Classifies effective working minutes into FULL_DAY or HALF_DAY
 * @param {number} effectiveWorkingMinutes 
 * @returns {'FULL_DAY' | 'HALF_DAY'}
 */
const classifyAttendanceType = (effectiveWorkingMinutes) => {
  const minutes = Number(effectiveWorkingMinutes) || 0;
  return minutes >= FULL_DAY_MINUTES_THRESHOLD ? 'FULL_DAY' : 'HALF_DAY';
};

/**
 * Computes monthly attendance summary and date-by-date breakdown
 * @param {string} employeeId 
 * @param {string} [yearMonthStr] e.g. "2026-09"
 * @returns {Promise<object>}
 */
const aggregateMonthlyAttendance = async (employeeId, yearMonthStr) => {
  const todayKolkataStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  
  let targetYearMonth = yearMonthStr;
  if (!targetYearMonth || !/^\d{4}-\d{2}$/.test(targetYearMonth)) {
    targetYearMonth = todayKolkataStr.slice(0, 7); // e.g. "2026-09"
  }

  const [yearNum, monthNum] = targetYearMonth.split('-').map(Number);
  const totalDaysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const startDateStr = `${targetYearMonth}-01`;
  const endDateStr = `${targetYearMonth}-${totalDaysInMonth < 10 ? '0' + totalDaysInMonth : totalDaysInMonth}`;

  // Fetch database records for this employee & date range
  const mongoose = require('mongoose');
  const queryEmpId = String(employeeId);
  const isObjectId = mongoose.Types.ObjectId.isValid(queryEmpId);

  const empFilter = isObjectId
    ? { $or: [{ employeeId: queryEmpId }, { employee: queryEmpId }] }
    : { employeeId: queryEmpId };

  const attendanceLogs = await Attendance.find({
    ...empFilter,
    date: { $gte: startDateStr, $lte: endDateStr }
  }).sort({ date: 1 });

  const approvedLeaves = await Leave.find({
    ...empFilter,
    status: 'Approved',
    startDate: { $lte: endDateStr },
    endDate: { $gte: startDateStr }
  });

  const dailyBreakdown = [];
  let fullDaysCount = 0;
  let halfDaysCount = 0;
  let leaveDaysCount = 0;
  let weeklyOffDaysCount = 0;
  let holidayDaysCount = 0;
  let absentDaysCount = 0;
  let inProgressDaysCount = 0;
  let totalEffectiveWorkingMinutes = 0;
  let totalBreakMinutes = 0;

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateStr = `${targetYearMonth}-${dayStr}`;

    const isFutureDay = dateStr > todayKolkataStr;
    const isToday = dateStr === todayKolkataStr;

    // Check Sunday weekly off (0 = Sunday)
    const dateObj = new Date(`${dateStr}T12:00:00.000Z`);
    const isWeeklyOff = dateObj.getUTCDay() === 0;

    // Check holiday
    const holidayObj = SALON_HOLIDAYS.find(h => h.date === dateStr);
    const isHoliday = !!holidayObj;

    // Check approved leave
    const isApprovedLeave = approvedLeaves.some(l => dateStr >= l.startDate && dateStr <= l.endDate);

    // Check daily attendance log
    const attLog = attendanceLogs.find(a => a.date === dateStr);

    let dayCategory = 'ABSENT';
    let statusLabel = 'Absent';
    let clockIn = null;
    let clockOut = null;
    let effectiveMins = 0;
    let breakMins = 0;

    if (attLog) {
      clockIn = attLog.clockIn || null;
      clockOut = attLog.clockOut || null;
      breakMins = Number(attLog.totalBreakDuration) || 0;

      if (attLog.clockOut || attLog.attendanceState === 'CLOCKED_OUT') {
        effectiveMins = Number(attLog.effectiveWorkingDuration) || 0;
        dayCategory = classifyAttendanceType(effectiveMins);
        statusLabel = dayCategory === 'FULL_DAY' ? 'Full Day' : 'Half Day';

        if (dayCategory === 'FULL_DAY') fullDaysCount++;
        else halfDaysCount++;

        totalEffectiveWorkingMinutes += effectiveMins;
        totalBreakMinutes += breakMins;
      } else if (isToday && attLog.attendanceState !== 'CLOCKED_OUT') {
        dayCategory = 'IN_PROGRESS';
        statusLabel = attLog.attendanceState === 'ON_BREAK' ? 'On Break' : 'Working Today';
        inProgressDaysCount++;
        totalBreakMinutes += breakMins;
      } else {
        // Log exists without clockOut on past day
        effectiveMins = Number(attLog.effectiveWorkingDuration) || 0;
        if (effectiveMins > 0) {
          dayCategory = classifyAttendanceType(effectiveMins);
          statusLabel = dayCategory === 'FULL_DAY' ? 'Full Day' : 'Half Day';
          if (dayCategory === 'FULL_DAY') fullDaysCount++;
          else halfDaysCount++;
          totalEffectiveWorkingMinutes += effectiveMins;
        } else {
          dayCategory = 'ABSENT';
          statusLabel = 'Absent';
          absentDaysCount++;
        }
      }
    } else {
      if (isApprovedLeave) {
        dayCategory = 'LEAVE';
        statusLabel = 'Leave Approved';
        leaveDaysCount++;
      } else if (isHoliday) {
        dayCategory = 'HOLIDAY';
        statusLabel = holidayObj.title || 'Studio Holiday';
        holidayDaysCount++;
      } else if (isWeeklyOff) {
        dayCategory = 'WEEKLY_OFF';
        statusLabel = 'Weekly Off';
        weeklyOffDaysCount++;
      } else if (isFutureDay) {
        dayCategory = 'FUTURE_DAY';
        statusLabel = 'Scheduled Shift';
      } else if (isToday) {
        dayCategory = 'IN_PROGRESS';
        statusLabel = 'Shift Inactive';
        inProgressDaysCount++;
      } else {
        dayCategory = 'ABSENT';
        statusLabel = 'Absent';
        absentDaysCount++;
      }
    }

    dailyBreakdown.push({
      date: dateStr,
      day: d,
      category: dayCategory,
      statusLabel,
      clockIn,
      clockOut,
      effectiveWorkingMinutes: effectiveMins,
      totalBreakMinutes: breakMins,
      breaks: attLog ? attLog.breaks : []
    });
  }

  const attendanceEquivalent = Number((fullDaysCount + (halfDaysCount * 0.5)).toFixed(1));
  const workingHoursInt = Math.floor(totalEffectiveWorkingMinutes / 60);
  const workingMinsRem = totalEffectiveWorkingMinutes % 60;
  const breakHoursInt = Math.floor(totalBreakMinutes / 60);
  const breakMinsRem = totalBreakMinutes % 60;

  return {
    month: targetYearMonth,
    employeeId: queryEmpId,
    totalDaysInMonth,
    summary: {
      fullDaysCount,
      halfDaysCount,
      attendanceEquivalent,
      leaveDaysCount,
      weeklyOffDaysCount,
      holidayDaysCount,
      absentDaysCount,
      inProgressDaysCount,
      totalEffectiveWorkingMinutes,
      totalEffectiveWorkingHoursFormatted: `${workingHoursInt}h ${workingMinsRem}m`,
      totalBreakMinutes,
      totalBreakHoursFormatted: `${breakHoursInt}h ${breakMinsRem}m`
    },
    dailyBreakdown
  };
};

module.exports = {
  FULL_DAY_MINUTES_THRESHOLD,
  classifyAttendanceType,
  aggregateMonthlyAttendance
};
