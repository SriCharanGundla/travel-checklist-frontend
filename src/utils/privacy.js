export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const trimmed = email.trim();
  if (!trimmed) {
    return '';
  }

  const [local, domain] = trimmed.split('@');
  if (!domain) {
    return `${trimmed.slice(0, 2)}${trimmed.length > 2 ? '***' : ''}`;
  }

  const normalizedLocal = local || '';
  const prefix = normalizedLocal.slice(0, 2);
  const maskedLength = Math.max(normalizedLocal.length - 2, 3);
  const maskedSection = '*'.repeat(maskedLength);

  return `${prefix}${maskedSection}@${domain}`;
};

export const buildMaskedSecret = (value) => {
  if (!value || typeof value !== 'string') {
    return '••••••';
  }

  const length = Math.max(value.length, 6);
  return '•'.repeat(length);
};
