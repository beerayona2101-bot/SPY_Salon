/**
 * SPY Salon - Asia/Kolkata Timezone & Date/Time Validation Helpers
 */

/**
 * Parse dateStr (YYYY-MM-DD or ISO string) and timeStr (e.g. "10:30 AM", "05:00 PM", "11:30", "10") in Asia/Kolkata timezone.
 * Returns a JS Date object representing the exact moment in UTC.
 */
function parseKolkataDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;

  const rawDateStr = String(dateStr).trim();
  const cleanTime = String(timeStr).trim();

  // If time is non-standard string like "Immediate Walk-In"
  if (/walk-in|immediate/i.test(cleanTime)) {
    return new Date();
  }

  let ymd = '';
  const dateOnly = rawDateStr.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    ymd = dateOnly;
  } else {
    const dObj = new Date(rawDateStr);
    if (!isNaN(dObj.getTime())) {
      ymd = dObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    } else {
      return null;
    }
  }

  let hours = 0;
  let minutes = 0;

  const match12 = cleanTime.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)$/i);
  if (match12) {
    hours = parseInt(match12[1], 10);
    minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  } else {
    const match24 = cleanTime.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?$/);
    if (match24) {
      hours = parseInt(match24[1], 10);
      minutes = match24[2] ? parseInt(match24[2], 10) : 0;
    } else {
      return null;
    }
  }

  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');

  // Construct ISO 8601 string explicitly specifying Asia/Kolkata (+05:30) offset
  const isoStr = `${ymd}T${paddedHours}:${paddedMinutes}:00+05:30`;
  const dt = new Date(isoStr);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Checks if the given date and time is in the past relative to current server time in Asia/Kolkata.
 * If requested appointment time <= current server time, returns true (is past).
 */
function isPastDateTimeKolkata(dateStr, timeStr) {
  const dt = parseKolkataDateTime(dateStr, timeStr);
  if (!dt) return false;
  
  // Return true if appointment timestamp is <= current timestamp
  return dt.getTime() <= Date.now();
}

/**
 * Returns true if appointment scheduled date + time has arrived or passed (in Asia/Kolkata timezone).
 * Returns false if appointment scheduled date + time is strictly in the future.
 */
function hasAppointmentStarted(dateStr, timeStr) {
  if (!dateStr || !timeStr) return true;
  if (/walk-in|immediate/i.test(String(timeStr))) return true;

  const dt = parseKolkataDateTime(dateStr, timeStr);
  if (!dt) {
    const dateOnly = String(dateStr).trim().split('T')[0];
    const todayYMD = getKolkataCurrentDateStr();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly) && dateOnly > todayYMD) {
      return false;
    }
    return true;
  }

  return Date.now() >= dt.getTime();
}

/**
 * Returns current date string (YYYY-MM-DD) in Asia/Kolkata.
 */
function getKolkataCurrentDateStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

/**
 * Returns current time string (e.g. "10:30 AM") in Asia/Kolkata.
 */
function getKolkataCurrentTimeStr() {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

module.exports = {
  parseKolkataDateTime,
  isPastDateTimeKolkata,
  hasAppointmentStarted,
  getKolkataCurrentDateStr,
  getKolkataCurrentTimeStr
};

