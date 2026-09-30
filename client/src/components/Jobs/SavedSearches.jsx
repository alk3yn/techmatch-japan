// src/components/Jobs/SavedSearches.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './SavedSearches.css';

function SavedSearches({ currentFilters, onLoad }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  function loadSearches() {
    if (!isAuthenticated) return;
    setLoading(true);
    apiClient
      .get('/user/saved-searches')
      .then((res) => setSearches(res.data.data.searches))
      .catch(() => setSearches([]))
      .finally(() => setLoading(false));
  }

  useEffect(loadSearches, [isAuthenticated]);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await apiClient.post('/user/saved-searches', {
        searchName: name.trim(),
        filters: currentFilters,
      });
      setName('');
      setAdding(false);
      loadSearches();
    } catch {
      // Keep the form open so the person can retry.
    }
  }

  async function handleDelete(id) {
    setSearches((prev) => prev.filter((s) => s.id !== id)); // optimistic
    try {
      await apiClient.delete(`/user/saved-searches/${id}`);
    } catch {
      loadSearches(); // roll back on failure
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="saved-searches saved-searches--locked">
        <h3 className="saved-searches__title">{t('jobs.savedSearches')}</h3>
        <p className="saved-searches__hint">
          {t('jobs.loginToSave')} — <Link to="/login">{t('auth.login')}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="saved-searches">
      <div className="saved-searches__header">
        <h3 className="saved-searches__title">{t('jobs.savedSearches')}</h3>
        {!adding && (
          <button type="button" className="saved-searches__add-btn" onClick={() => setAdding(true)}>
            + {t('jobs.saveSearch')}
          </button>
        )}
      </div>

      {adding && (
        <form className="saved-searches__form" onSubmit={handleSave}>
          <input
            type="text"
            autoFocus
            placeholder={t('jobs.searchNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="saved-searches__form-actions">
            <button type="submit" className="saved-searches__save-btn">
              {t('jobs.save')}
            </button>
            <button
              type="button"
              className="saved-searches__cancel-btn"
              onClick={() => {
                setAdding(false);
                setName('');
              }}
            >
              {t('jobs.cancel')}
            </button>
          </div>
        </form>
      )}

      {!loading && searches.length === 0 && !adding && (
        <p className="saved-searches__empty">{t('jobs.noSavedSearches')}</p>
      )}

      {searches.length > 0 && (
        <ul className="saved-searches__list">
          {searches.map((search) => (
            <li key={search.id} className="saved-search-row">
              <button
                type="button"
                className="saved-search-row__name"
                onClick={() => onLoad(search.filters)}
                title={t('jobs.loadSearch')}
              >
                {search.search_name}
              </button>
              <button
                type="button"
                className="saved-search-row__delete"
                aria-label={t('jobs.deleteSearch')}
                onClick={() => handleDelete(search.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SavedSearches;
