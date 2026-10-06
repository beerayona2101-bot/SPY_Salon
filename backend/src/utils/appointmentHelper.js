/**
 * SPY Salon - Production Appointment & Slot Availability Helper
 * Handles duration-aware slot overlap calculation, approved leave blocking, and race-condition validation.
 */
const Appointment = require('../models/Appointment');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { parseKolkataDateTime, isPastDateTimeKolkata, getKolkataCurrentDateStr } = require('./timezoneHelper');

const STANDARD_SALON_TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
];

/**
 * Clean specialist name by removing parenthetical roles e.g. "Alex Rivera (Specialist)" -> "Alex Rivera"
 */
function cleanSpecialistName(rawName) {
  if (!rawName) return '';
  return String(rawName).split('(')[0].replace(/\s+/g, ' ').trim();
}

/**
 * Generates array of unique slot lock keys for a specialist, date, start time, and duration
 * e.g. ["alex rivera#2026-11-20#10:00 am", "alex rivera#2026-11-20#10:30 am"]
 */
function generateSlotKeys(specialistIdentifier, dateStr, timeStr, durationMinutes = 30) {
  if (!dateStr || !timeStr) return [];
  const cleanName = cleanSpecialistName(specialistIdentifier).toLowerCase();
  if (!cleanName || cleanName === 'any available specialist' || cleanName === 'all') return [];
  const coveredSlots = getSlotsCoveredByAppointment(timeStr, durationMinutes);
  return coveredSlots.map(s => `${cleanName}#${dateStr}#${s.toLowerCase()}`);
}

/**
 * Converts "10:30 AM" or "02:00 PM" or "14:00" to minutes from midnight
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const cleanTime = String(timeStr).trim();
  const match12 = cleanTime.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const match24 = cleanTime.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = match24[2] ? parseInt(match24[2], 10) : 0;
    return hours * 60 + minutes;
  }
  return 0;
}

/**
 * Converts minutes from midnight back to 12-hour formatted string e.g. 630 -> "10:30 AM"
 */
function minutesToTime12(totalMinutes) {
  const normalized = Math.max(0, totalMinutes % (24 * 60));
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
}

/**
 * Given a start time (e.g. "10:00 AM") and duration (e.g. 60 min), returns all 30-minute slot labels covered
 * e.g. "10:00 AM" with 60 mins covers ["10:00 AM", "10:30 AM"]
 */
function getSlotsCoveredByAppointment(startTimeStr, durationMinutes = 30) {
  const startMins = timeToMinutes(startTimeStr);
  const dur = Math.max(30, Number(durationMinutes) || 30);
  const covered = [];

  for (let m = startMins; m < startMins + dur; m += 30) {
    const slotLabel = minutesToTime12(m);
    if (STANDARD_SALON_TIME_SLOTS.includes(slotLabel)) {
      covered.push(slotLabel);
    }
  }

  // If start slot is standard but loop didn't catch, at least include the start slot
  if (covered.length === 0 && STANDARD_SALON_TIME_SLOTS.includes(startTimeStr)) {
    covered.push(startTimeStr);
  }

  return covered;
}

/**
 * Check if a specialist is on approved leave on the given date
 */
async function isSpecialistOnLeave(dateStr, specialistIdentifier) {
  if (!dateStr || !specialistIdentifier) return null;
  const cleanName = cleanSpecialistName(specialistIdentifier);
  if (!cleanName || cleanName.toLowerCase() === 'any available specialist') return null;

  const firstWord = cleanName.split(/\s+/)[0];

  const leaveQuery = {
    status: 'Approved',
    startDate: { $lte: dateStr },
    endDate: { $gte: dateStr },
    $or: [
      { employeeName: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      { employeeName: new RegExp(firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      ...(specialistIdentifier._id ? [{ employeeId: specialistIdentifier._id.toString() }, { employee: specialistIdentifier._id }] : [])
    ]
  };

  const conflictLeave = await Leave.findOne(leaveQuery);
  return conflictLeave;
}

/**
 * Retrieve all booked/unavailable 30-minute time slots for a given date and specialist.
 * Takes into account:
 * 1. Approved specialist leaves (blocks all slots)
 * 2. Multi-service and package appointment durations (blocks all overlapping slots)
 * 3. Past time slots if date is today in Asia/Kolkata
 */
async function getBookedSlotsForDateAndSpecialist(dateStr, specialistName) {
  const bookedSet = new Set();
  const cleanName = cleanSpecialistName(specialistName);
  const isSpecificSpecialist = cleanName && cleanName.toLowerCase() !== 'any available specialist' && cleanName.toLowerCase() !== 'all';

  // 1. Check Approved Leave for specific specialist
  if (isSpecificSpecialist) {
    const onLeave = await isSpecialistOnLeave(dateStr, cleanName);
    if (onLeave) {
      // If staff is on approved leave, ALL salon slots on that date are blocked
      return [...STANDARD_SALON_TIME_SLOTS];
    }
  }

  // 2. Query active appointments for that date and specialist
  const query = {
    appointmentDate: dateStr,
    status: { $nin: ['Cancelled', 'Staff_Rejected'] }
  };

  if (isSpecificSpecialist) {
    const firstWord = cleanName.split(/\s+/)[0];
    query.$or = [
      { specialistName: new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { specialistName: new RegExp(firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    ];
  }

  const appointments = await Appointment.find(query);

  for (const app of appointments) {
    const startSlot = app.appointmentTime;
    const duration = app.totalDuration || (Array.isArray(app.services) && app.services.length > 0 
      ? app.services.reduce((acc, s) => acc + (s.durationMinutes || 30), 0) 
      : 30);

    const slots = getSlotsCoveredByAppointment(startSlot, duration);
    for (const s of slots) {
      bookedSet.add(s);
    }
    if (startSlot) {
      bookedSet.add(startSlot);
    }
  }

  // 3. Past slots check for today in Asia/Kolkata
  const todayStr = getKolkataCurrentDateStr();
  if (dateStr === todayStr) {
    for (const slot of STANDARD_SALON_TIME_SLOTS) {
      if (isPastDateTimeKolkata(todayStr, slot)) {
        bookedSet.add(slot);
      }
    }
  }

  return Array.from(bookedSet);
}

/**
 * Server-Authoritative Conflict Checker
 * Validates if the requested (date, time, duration, specialist) has any conflict.
 * Returns { hasConflict: boolean, reason?: string }
 */
async function checkSlotConflict({
  appointmentDate,
  appointmentTime,
  durationMinutes = 30,
  specialistName,
  excludeAppointmentId = null
}) {
  const cleanName = cleanSpecialistName(specialistName);
  const isSpecificSpecialist = cleanName && cleanName.toLowerCase() !== 'any available specialist';

  // 1. Check past time
  if (isPastDateTimeKolkata(appointmentDate, appointmentTime)) {
    return {
      hasConflict: true,
      reason: 'Please select a future appointment time. The selected time slot has already passed.'
    };
  }

  // 2. Check Specialist Approved Leave
  if (isSpecificSpecialist) {
    const onLeave = await isSpecialistOnLeave(appointmentDate, cleanName);
    if (onLeave) {
      return {
        hasConflict: true,
        reason: `Specialist ${cleanName} is on approved leave on ${appointmentDate} (${onLeave.startDate} to ${onLeave.endDate}). Please select another specialist or date.`
      };
    }
  }

  // 3. Check Overlapping Appointments
  if (isSpecificSpecialist) {
    const targetSlots = getSlotsCoveredByAppointment(appointmentTime, durationMinutes);
    const firstWord = cleanName.split(/\s+/)[0];

    const query = {
      appointmentDate,
      status: { $nin: ['Cancelled', 'Staff_Rejected', 'No Show'] },
      $or: [
        { specialistName: new RegExp(cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        { specialistName: new RegExp(firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      ]
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    const existingAppointments = await Appointment.find(query);

    for (const app of existingAppointments) {
      const appDuration = app.totalDuration || (Array.isArray(app.services) && app.services.length > 0 
        ? app.services.reduce((acc, s) => acc + (s.durationMinutes || 30), 0) 
        : 30);
      const appCoveredSlots = getSlotsCoveredByAppointment(app.appointmentTime, appDuration);

      const hasOverlap = targetSlots.some(slot => appCoveredSlots.includes(slot) || slot === app.appointmentTime);
      if (hasOverlap) {
        return {
          hasConflict: true,
          reason: `Time slot conflict: Specialist ${cleanName} already has an appointment booked around ${app.appointmentTime} on ${appointmentDate}.`
        };
      }
    }
  }

  return { hasConflict: false };
}

module.exports = {
  STANDARD_SALON_TIME_SLOTS,
  cleanSpecialistName,
  timeToMinutes,
  minutesToTime12,
  getSlotsCoveredByAppointment,
  generateSlotKeys,
  isSpecialistOnLeave,
  getBookedSlotsForDateAndSpecialist,
  checkSlotConflict
};
