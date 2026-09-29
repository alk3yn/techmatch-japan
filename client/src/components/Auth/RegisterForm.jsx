// src/components/Auth/RegisterForm.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { translateAuthError } from '../../utils/authErrors';
import './AuthForm.css';

function RegisterForm() {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const preferredLanguage = i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'ja';
      await register({ email, password, displayName, preferredLanguage });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(translateAuthError(t, err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="auth-form__error">{error}</div>}

      <label className="auth-form__field">
        <span>{t('auth.displayName')}</span>
        <input
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </label>

      <label className="auth-form__field">
        <span>{t('auth.email')}</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="auth-form__field">
        <span>{t('auth.password')}</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <label className="auth-form__field">
        <span>{t('auth.confirmPassword')}</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </label>

      <button type="submit" className="auth-form__submit" disabled={submitting}>
        {submitting ? t('auth.submitting') : t('auth.register')}
      </button>

      <p className="auth-form__switch">
        {t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
      </p>
    </form>
  );
}

export default RegisterForm;
