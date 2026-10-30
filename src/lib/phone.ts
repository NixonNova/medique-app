export function phoneText(value: string) {
  return value.replace(/\D/g, '').slice(0, 15);
}

export function normalizePhone(value: string) {
  const digits = phoneText(value);
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`.slice(0, 15);
  }
  return digits;
}

export function authPhone(value: string) {
  return normalizePhone(value);
}

export function isPhone(value: string) {
  return /^62\d{8,13}$/.test(normalizePhone(value));
}

export function isSmsPhone(value: string) {
  return /^62\d{8,13}$/.test(value);
}
