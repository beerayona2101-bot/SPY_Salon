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

// Standard 9-hour shift duration in minutes (540 minutes)
const STANDARD_SHIFT_MINUTES = 540;

/**
 * Resolves both User and Employee document IDs across the database
 * to ensure 100% data consistency between Employee and Admin queries.
 * @param {string | object} employeeIdentifier
 * @returns {Promise<object>}
 */
const resolveEmployeeFilter = async (employeeIdentifier) => {
  const mongoose = require('mongoose');
  const Employee = require('../models/Employee');
  const User = require('../models/User');

  const allIds = new Set();
  let employeeDoc = null;
  let userDoc = null;

  if (!employeeIdentifier) return { filter: {}, allIds: [], employeeDoc: null, userDoc: null };

  if (typeof employeeIdentifier === 'object' && employeeIdentifier !== null) {
    if (employeeIdentifier._id) allIds.add(String(employeeIdentifier._id));
    if (employeeIdentifier.employeeId) allIds.add(String(employeeIdentifier.employeeId));
    if (employeeIdentifier.email) {
      const email = String(employeeIdentifier.email).toLowerCase().trim();
      employeeDoc = await Employee.findOne({ email });
      userDoc = await User.findOne({ email });
    }
  } else {
    const strId = String(employeeIdentifier).trim();
    allIds.add(strId);

    if (mongoose.Types.ObjectId.isValid(strId)) {
      employeeDoc = await Employee.findById(strId);
      userDoc = await User.findById(strId);

      if (employeeDoc && !userDoc && employeeDoc.email) {
        userDoc = await User.findOne({ email: employeeDoc.email.toLowerCase().trim() });
      } else if (userDoc && !employeeDoc && userDoc.email) {
        employeeDoc = await Employee.findOne({ email: userDoc.email.toLowerCase().trim() });
      }
    } else if (strId.includes('@')) {
      const email = strId.toLowerCase();
      employeeDoc = await Employee.findOne({ email });
      userDoc = await User.findOne({ email });
    } else if (strId.startsWith('EMP-')) {
      employeeDoc = await Employee.findOne({ empCode: new RegExp(`^${strId}$`, 'i') });
      if (employeeDoc?.email) {
        userDoc = await User.findOne({ email: employeeDoc.email.toLowerCase().trim() });
      }
    }
  }

  if (employeeDoc?._id) allIds.add(String(employeeDoc._id));
  if (userDoc?._id) allIds.add(String(userDoc._id));

  const idList = Array.from(allIds).filter(Boolean);
  const orConditions = [];

  idList.forEach(id => {
    orConditions.push({ employeeId: id });
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConditions.push({ employee: id });
    }
  });

  return {
    filter: orConditions.length > 0 ? { $or: orConditions } : {},
    allIds: idList,
    employeeDoc,
    userDoc,
    primaryEmployeeId: userDoc?._id ? String(userDoc._id) : (employeeDoc?._id ? String(employeeDoc._id) : idList[0]),
    employeeName: employeeDoc?.name || userDoc?.name || 'Staff Member',
    branchId: employeeDoc?.branchId || userDoc?.branchId || null
  };
};

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
 * Calculates 9 hours after clock in time
 */
const calculate9HourClockOut = (clockInTimeStr, clockInTimestamp) => {
  if (clockInTimestamp && !isNaN(new Date(clockInTimestamp).getTime())) {
    const dt = new Date(new Date(clockInTimestamp).getTime() + 9 * 60 * 60 * 1000);
    return {
      clockOutTimeStr: dt.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }),
      clockOutTimestamp: dt
    };
  }

  try {
    const [time, modifier] = String(clockInTimeStr || '09:00 AM').trim().split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const totalInMins = hours * 60 + (minutes || 0);
    const totalOutMins = (totalInMins + 540) % 1440; // 9 hours (540 mins)

    let outHours = Math.floor(totalOutMins / 60);
    const outMins = totalOutMins % 60;
    const outModifier = outHours >= 12 ? 'PM' : 'AM';
    outHours = outHours % 12;
    outHours = outHours ? outHours : 12;
    const formattedMins = outMins < 10 ? `0${outMins}` : `${outMins}`;
    const formattedHours = outHours < 10 ? `0${outHours}` : `${outHours}`;

    return {
      clockOutTimeStr: `${formattedHours}:${formattedMins} ${outModifier}`,
      clockOutTimestamp: new Date()
    };
  } catch (e) {
    return {
      clockOutTimeStr: '06:00 PM',
      clockOutTimestamp: new Date()
    };
  }
};

/**
 * Auto check-out past shifts that were not checked out by employees before midnight.
 * Assigns exactly 9 hours working time (540 minutes).
 */
const autoCheckoutPastUnclosedShifts = async (employeeIdentifier = null) => {
  try {
    const todayKolkataStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const query = {
      date: { $lt: todayKolkataStr },
      attendanceState: { $ne: 'CLOCKED_OUT' }
    };

    if (employeeIdentifier) {
      const resolved = await resolveEmployeeFilter(employeeIdentifier);
      if (resolved.filter && resolved.filter.$or) {
        query.$or = resolved.filter.$or;
      }
    }

    const unclosedShifts = await Attendance.find(query);

    for (const log of unclosedShifts) {
      const { clockOutTimeStr, clockOutTimestamp } = calculate9HourClockOut(log.clockIn, log.clockInTimestamp);

      if (log.breaks && log.breaks.length > 0) {
        log.breaks.forEach(b => {
          if (!b.end) {
            b.end = clockOutTimeStr;
            b.endTimestamp = clockOutTimestamp;
            b.duration = 0;
          }
        });
      }

      log.clockOut = clockOutTimeStr;
      log.clockOutTimestamp = clockOutTimestamp;
      log.totalShiftDuration = 540; // 9 hours
      log.totalBreakDuration = log.totalBreakDuration || 0;
      log.effectiveWorkingDuration = 540; // 9 hours
      log.attendanceType = 'FULL_DAY';
      log.status = 'Present';
      log.attendanceState = 'CLOCKED_OUT';

      await log.save();
    }
  } catch (err) {
    console.error('[AutoCheckout] Error performing auto-checkout for past shifts:', err);
  }
};

/**
 * Computes monthly attendance summary and date-by-date breakdown
 * @param {string | object} employeeIdentifier 
 * @param {string} [yearMonthStr] e.g. "2026-09"
 * @returns {Promise<object>}
 */
const aggregateMonthlyAttendance = async (employeeIdentifier, yearMonthStr) => {
  await autoCheckoutPastUnclosedShifts(employeeIdentifier);
  const resolved = await resolveEmployeeFilter(employeeIdentifier);
  const todayKolkataStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  
  let targetYearMonth = yearMonthStr;
  if (!targetYearMonth || !/^\d{4}-\d{2}$/.test(targetYearMonth)) {
    targetYearMonth = todayKolkataStr.slice(0, 7); // e.g. "2026-09"
  }

  const [yearNum, monthNum] = targetYearMonth.split('-').map(Number);
  const totalDaysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const startDateStr = `${targetYearMonth}-01`;
  const endDateStr = `${targetYearMonth}-${totalDaysInMonth < 10 ? '0' + totalDaysInMonth : totalDaysInMonth}`;

  const empFilter = resolved.filter && resolved.filter.$or ? resolved.filter : { employeeId: String(employeeIdentifier) };

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
  let totalOvertimeMinutes = 0;
  let totalOvertimeTimes = 0;
  let lateArrivalCount = 0;

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
    let overtimeMins = 0;

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

        // Calculate dynamic Overtime beyond standard shift (540m / 9h)
        if (effectiveMins > STANDARD_SHIFT_MINUTES) {
          overtimeMins = effectiveMins - STANDARD_SHIFT_MINUTES;
          totalOvertimeMinutes += overtimeMins;
          totalOvertimeTimes++;
        }
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

          if (effectiveMins > STANDARD_SHIFT_MINUTES) {
            overtimeMins = effectiveMins - STANDARD_SHIFT_MINUTES;
            totalOvertimeMinutes += overtimeMins;
            totalOvertimeTimes++;
          }
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
      overtimeMinutes: overtimeMins,
      breaks: attLog ? attLog.breaks : []
    });
  }

  const attendanceEquivalent = Number((fullDaysCount + (halfDaysCount * 0.5)).toFixed(1));
  const workingHoursInt = Math.floor(totalEffectiveWorkingMinutes / 60);
  const workingMinsRem = totalEffectiveWorkingMinutes % 60;
  const breakHoursInt = Math.floor(totalBreakMinutes / 60);
  const breakMinsRem = totalBreakMinutes % 60;
  const overtimeHoursDec = Number((totalOvertimeMinutes / 60).toFixed(1));

  return {
    month: targetYearMonth,
    employeeId: resolved.primaryEmployeeId,
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
      totalBreakHoursFormatted: `${breakHoursInt}h ${breakMinsRem}m`,
      totalOvertimeMinutes,
      totalOvertimeHoursFormatted: `${overtimeHoursDec}h`,
      totalOvertimeTimes
    },
    dailyBreakdown
  };
};

module.exports = {
  FULL_DAY_MINUTES_THRESHOLD,
  STANDARD_SHIFT_MINUTES,
  resolveEmployeeFilter,
  classifyAttendanceType,
  autoCheckoutPastUnclosedShifts,
  aggregateMonthlyAttendance
};
