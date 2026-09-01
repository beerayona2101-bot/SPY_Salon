/**
 * SPY Salon Backend Validation Helpers
 */
const ApiError = require('./apiError');

const trimVal = (val) => (val === null || val === undefined ? '' : String(val).trim());

const isValidEmail = (email) => {
  const trimmed = trimVal(email);
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

const isValidPhone = (phone) => {
  const trimmed = trimVal(phone);
  if (!trimmed) return false;

  let cleanDigits = trimmed.replace(/[\s-]/g, '');
  if (cleanDigits.startsWith('+91')) {
    cleanDigits = cleanDigits.slice(3);
  } else if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
    cleanDigits = cleanDigits.slice(2);
  } else if (cleanDigits.startsWith('0') && cleanDigits.length === 11) {
    cleanDigits = cleanDigits.slice(1);
  }

  if (!/^\d{10}$/.test(cleanDigits)) return false;
  const firstChar = cleanDigits.charAt(0);
  return ['6', '7', '8', '9'].includes(firstChar);
};

const isValidName = (name, min = 2, max = 60) => {
  const trimmed = trimVal(name);
  if (!trimmed) return false;
  if (trimmed.length < min || trimmed.length > max) return false;
  return true;
};

const isValidPassword = (password, min = 6) => {
  const str = String(password || '');
  return str.length >= min;
};

const isNonNegativeNumber = (val) => {
  if (val === null || val === undefined || val === '') return false;
  const num = Number(val);
  return !isNaN(num) && num >= 0;
};

const isValidMongoId = (id) => {
  if (!id) return false;
  return /^[0-9a-fA-F]{24}$/.test(String(id));
};

module.exports = {
  trimVal,
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidPassword,
  isNonNegativeNumber,
  isValidMongoId
};
