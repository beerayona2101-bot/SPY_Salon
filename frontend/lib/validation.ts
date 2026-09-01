/**
 * SPY Salon Centralized Frontend Validation Library
 * Complete, consistent, and reusable field validation utilities across all forms.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export type FieldValidator<T = any> = (value: T, formData?: any) => ValidationResult;

export type ValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]?: FieldValidator<T[K]>[];
};

/**
 * Helper to safely trim string input
 */
export const trimValue = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

/**
 * Validate Required Field
 */
export const validateRequired = (fieldName: string): FieldValidator => (value) => {
  const trimmed = trimValue(value);
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  return { isValid: true };
};

/**
 * Validate Name (Full Name, Service Name, Customer Name, etc.)
 */
export const validateName = (fieldName: string = 'Name', minLen: number = 2, maxLen: number = 60): FieldValidator => (value) => {
  const trimmed = trimValue(value);
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  if (trimmed.length < minLen) {
    return { isValid: false, error: `${fieldName} must be at least ${minLen} characters.` };
  }
  if (trimmed.length > maxLen) {
    return { isValid: false, error: `${fieldName} cannot exceed ${maxLen} characters.` };
  }
  // Allow normal letters, spaces, dots, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z0-9\s\-'.&()]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldName} contains invalid special characters.` };
  }
  return { isValid: true };
};

/**
 * Validate Email Address
 */
export const validateEmail = (isRequired: boolean = true): FieldValidator => (value) => {
  const trimmed = trimValue(value);
  if (!trimmed) {
    if (isRequired) return { isValid: false, error: 'Email address is required.' };
    return { isValid: true };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }
  return { isValid: true };
};

/**
 * Validate Mobile Phone Number
 * Must start with 6, 7, 8, or 9 and be 10 digits (supporting optional +91 or 0 prefix).
 */
export const validatePhone = (isRequired: boolean = true): FieldValidator => (value) => {
  const trimmed = trimValue(value);
  if (!trimmed) {
    if (isRequired) return { isValid: false, error: 'Phone number is required.' };
    return { isValid: true };
  }

  // Strip spaces, hyphens, and country code prefix +91 / 91 / leading 0
  let cleanDigits = trimmed.replace(/[\s-]/g, '');
  if (cleanDigits.startsWith('+91')) {
    cleanDigits = cleanDigits.slice(3);
  } else if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
    cleanDigits = cleanDigits.slice(2);
  } else if (cleanDigits.startsWith('0') && cleanDigits.length === 11) {
    cleanDigits = cleanDigits.slice(1);
  }

  if (!/^\d+$/.test(cleanDigits)) {
    return { isValid: false, error: 'Phone number must contain numeric digits only.' };
  }

  if (cleanDigits.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits.' };
  }

  const firstDigit = cleanDigits.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return { isValid: false, error: 'Mobile number must start with 6, 7, 8, or 9.' };
  }

  return { isValid: true };
};

/**
 * Validate Password
 */
export const validatePassword = (minLen: number = 6): FieldValidator => (value) => {
  const password = String(value || '');
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }
  if (password.length < minLen) {
    return { isValid: false, error: `Password must be at least ${minLen} characters long.` };
  }
  return { isValid: true };
};

/**
 * Validate Confirm Password
 */
export const validateConfirmPassword = (passwordFieldName: string = 'newPassword'): FieldValidator => (value, formData) => {
  const confirmPassword = String(value || '');
  const originalPassword = formData ? String(formData[passwordFieldName] || '') : '';

  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password.' };
  }
  if (confirmPassword !== originalPassword) {
    return { isValid: false, error: 'New password and confirm password do not match.' };
  }
  return { isValid: true };
};

/**
 * Validate Numeric Amount / Price / Salary / Percentage
 */
export interface NumberValidationOptions {
  min?: number;
  max?: number;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  isRequired?: boolean;
}

export const validateNumber = (fieldName: string, options: NumberValidationOptions = {}): FieldValidator => (value) => {
  const { min, max, allowNegative = false, allowDecimal = true, isRequired = true } = options;
  const trimmed = trimValue(value);

  if (!trimmed) {
    if (isRequired) return { isValid: false, error: `${fieldName} is required.` };
    return { isValid: true };
  }

  const num = Number(trimmed);
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number.` };
  }

  if (!allowNegative && num < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative.` };
  }

  if (!allowDecimal && !Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} must be a whole integer.` };
  }

  if (min !== undefined && num < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}.` };
  }

  if (max !== undefined && num > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max}.` };
  }

  return { isValid: true };
};

/**
 * Validate Date
 */
export interface DateValidationOptions {
  isRequired?: boolean;
  allowPast?: boolean;
  minDate?: string;
  maxDate?: string;
}

export const validateDate = (fieldName: string = 'Date', options: DateValidationOptions = {}): FieldValidator => (value) => {
  const { isRequired = true, allowPast = true, minDate, maxDate } = options;
  const trimmed = trimValue(value);

  if (!trimmed) {
    if (isRequired) return { isValid: false, error: `${fieldName} is required.` };
    return { isValid: true };
  }

  const dateObj = new Date(trimmed);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: `Please enter a valid ${fieldName.toLowerCase()}.` };
  }

  if (!allowPast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      return { isValid: false, error: `${fieldName} cannot be in the past.` };
    }
  }

  if (minDate && new Date(trimmed) < new Date(minDate)) {
    return { isValid: false, error: `${fieldName} cannot be before ${minDate}.` };
  }

  if (maxDate && new Date(trimmed) > new Date(maxDate)) {
    return { isValid: false, error: `${fieldName} cannot be after ${maxDate}.` };
  }

  return { isValid: true };
};

/**
 * Validate Dropdown Select
 */
export const validateSelect = (fieldName: string, placeholderValues: string[] = ['', 'select', 'none']): FieldValidator => (value) => {
  const trimmed = trimValue(value).toLowerCase();
  if (!trimmed || placeholderValues.includes(trimmed)) {
    return { isValid: false, error: `Please select a ${fieldName.toLowerCase()}.` };
  }
  return { isValid: true };
};

/**
 * Validate IFSC Code (Indian Financial System Code)
 */
export const validateIFSC = (isRequired: boolean = true): FieldValidator => (value) => {
  const trimmed = trimValue(value).toUpperCase();
  if (!trimmed) {
    if (isRequired) return { isValid: false, error: 'IFSC code is required.' };
    return { isValid: true };
  }
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid 11-digit IFSC code (e.g. SBIN0001234).' };
  }
  return { isValid: true };
};

/**
 * Validate UPI ID
 */
export const validateUPI = (isRequired: boolean = true): FieldValidator => (value) => {
  const trimmed = trimValue(value);
  if (!trimmed) {
    if (isRequired) return { isValid: false, error: 'UPI ID is required.' };
    return { isValid: true };
  }
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!upiRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid UPI ID (e.g. name@upi or mobile@ybl).' };
  }
  return { isValid: true };
};

/**
 * Form Validation Runner
 */
export function validateForm<T extends Record<string, any>>(
  formData: T,
  schema: ValidationSchema<T>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const fieldKey in schema) {
    const validators = schema[fieldKey];
    if (validators) {
      for (const validator of validators) {
        const result = validator(formData[fieldKey], formData);
        if (!result.isValid && result.error) {
          errors[fieldKey] = result.error;
          isValid = false;
          break; // Stop at first failing validator for this field
        }
      }
    }
  }

  return { isValid, errors };
}
