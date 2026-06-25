export function validateFullName(val: string): string | null {
  if (!val) return 'Full name is required';
  if (val.length < 2) return 'Full name must be at least 2 characters';
  if (val.length > 60) return 'Full name must be less than 60 characters';
  if (!/^[a-zA-Z\s'-]+$/.test(val)) return 'Full name can only contain letters, spaces, hyphens and apostrophes';
  return null;
}

export function validateMobile(val: string, countryCode: string = '+91'): string | null {
  if (!val) return 'Mobile number is required';
  if (countryCode === '+91') {
    if (!/^[6-9]\d{9}$/.test(val)) return 'Invalid Indian mobile number';
  } else {
    if (!/^\d{7,15}$/.test(val)) return 'Invalid mobile number';
  }
  return null;
}

export function validateEmail(val: string): string | null {
  if (!val) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Invalid email address';
  return null;
}

export function validatePassword(val: string): string | null {
  if (!val) return 'Password is required';
  if (val.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(val)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(val)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(val)) return 'Password must contain a number';
  if (!/[!@#$%^&*_\-]/.test(val)) return 'Password must contain a special character (!@#$%^&*_-)';
  return null;
}
