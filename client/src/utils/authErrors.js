// src/utils/authErrors.js
// Maps known backend error strings (see server/routes/auth.js) to
// translation keys so the UI stays bilingual even though the API
// itself returns fixed English messages. Falls back to the raw
// message for anything unmapped (e.g. an unreachable API).

const KNOWN_MESSAGES = {
  'Invalid email or password': 'auth.invalidCredentials',
  'Email is already registered': 'auth.emailTaken',
};

export function translateAuthError(t, error) {
  const raw = error?.response?.data?.error;
  if (!raw) return t('common.error');

  if (KNOWN_MESSAGES[raw]) return t(KNOWN_MESSAGES[raw]);
  if (raw.includes('Password must be at least 8 characters')) return t('auth.passwordTooShort');
  if (raw.includes('valid email')) return t('common.error');

  return raw;
}
