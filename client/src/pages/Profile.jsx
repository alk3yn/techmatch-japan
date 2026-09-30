// src/pages/Profile.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext.jsx';
import SkillInput from '../components/Analyzer/SkillInput.jsx';
import './Profile.css';

function Profile() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, loading: authLoading, setUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('ja');
  const [skills, setSkills] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setPreferredLanguage(user.preferred_language || 'ja');
      setSkills(user.skills || []);
    }
  }, [user]);

  useEffect(() => {
    apiClient
      .get('/jobs/skills')
      .then((res) => setSkillOptions(res.data.data.skills))
      .catch(() => setSkillOptions([]));
  }, []);

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(false);
    setError('');
    try {
      const res = await apiClient.put('/user/profile', {
        displayName,
        preferredLanguage,
        skills,
      });
      setUser(res.data.data.user);
      i18n.changeLanguage(preferredLanguage);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2500);
    } catch {
      // Keep the form as-is so the person can retry.
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-page">
      <h1 className="profile-page__title">{t('profile.title')}</h1>

      <form className="profile-form" onSubmit={handleSubmit}>
        {error && <div className="profile-form__error">{error}</div>}

        <label className="profile-form__field">
          <span>{t('auth.displayName')}</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label className="profile-form__field">
          <span>{t('auth.language')}</span>
          <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </label>

        <div className="profile-form__field">
          <span>{t('profile.yourSkills')}</span>
          <SkillInput skills={skills} skillOptions={skillOptions} onChange={setSkills} />
        </div>

        <div className="profile-form__actions">
          <button type="submit" className="profile-form__submit" disabled={saving}>
            {saving ? t('auth.submitting') : t('profile.save')}
          </button>
          {savedMessage && <span className="profile-form__saved">✓ {t('profile.updateSuccess')}</span>}
        </div>
      </form>
    </div>
  );
}

export default Profile;
