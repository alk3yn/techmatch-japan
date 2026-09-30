// src/pages/Jobs.jsx
// Filters + sort + page live in the URL query string, so the current
// search is shareable and easy to persist as a "saved search" later.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import JobFilters from '../components/Jobs/JobFilters.jsx';
import JobList from '../components/Jobs/JobList.jsx';
import SavedSearches from '../components/Jobs/SavedSearches.jsx';
import Loading from '../components/common/Loading.jsx';
import './Jobs.css';

const PAGE_SIZE = 10;
const SORTS = [
  ['newest', 'sortNewest'],
  ['salary_desc', 'sortSalaryDesc'],
  ['salary_asc', 'sortSalaryAsc'],
  ['experience_asc', 'sortExpAsc'],
  ['experience_desc', 'sortExpDesc'],
];

function Jobs() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [skillOptions, setSkillOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const queryString = searchParams.toString();
  const current = Object.fromEntries(searchParams);

  // Skill chips for the filter panel — loaded once.
  useEffect(() => {
    apiClient
      .get('/jobs/skills')
      .then((res) => setSkillOptions(res.data.data.skills))
      .catch(() => setSkillOptions([]));
  }, []);

  // Jobs — refetched whenever the URL query changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .get('/jobs', { params: { ...Object.fromEntries(new URLSearchParams(queryString)), limit: PAGE_SIZE } })
      .then((res) => {
        if (!cancelled) setResult(res.data.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  function applyFilters(params) {
    const next = { ...params };
    if (current.sort) next.sort = current.sort; // keep the chosen sort
    setSearchParams(next);
    setFiltersOpen(false);
  }

  function resetFilters() {
    setSearchParams({});
    setFiltersOpen(false);
  }

  function changeSort(e) {
    const next = new URLSearchParams(searchParams);
    next.set('sort', e.target.value);
    next.delete('page');
    setSearchParams(next);
  }

  function changePage(page) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function loadSavedSearch(filters) {
    setSearchParams(filters || {});
    setFiltersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="jobs-page">
      <h1 className="jobs-page__title">{t('jobs.title')}</h1>
      <p className="jobs-page__notice">{t('jobs.sampleNotice')}</p>

      <div className="jobs-layout">
        <aside className="jobs-layout__filters">
          <button
            type="button"
            className="jobs-filter-toggle"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {t('jobs.filter')}
          </button>
          <div className={`jobs-layout__panel ${filtersOpen ? 'is-open' : ''}`}>
            <JobFilters
              key={queryString}
              initial={current}
              skillOptions={skillOptions}
              onApply={applyFilters}
              onReset={resetFilters}
            />
            <SavedSearches currentFilters={current} onLoad={loadSavedSearch} />
          </div>
        </aside>

        <section className="jobs-layout__results">
          <div className="jobs-results-header">
            <span className="jobs-results-header__count">
              {result ? t('jobs.resultsCount', { total: result.pagination.total }) : ''}
            </span>
            <label className="jobs-results-header__sort">
              <span>{t('jobs.sort')}</span>
              <select value={current.sort || 'newest'} onChange={changeSort}>
                {SORTS.map(([value, key]) => (
                  <option key={value} value={value}>
                    {t(`jobs.${key}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading && <Loading />}
          {!loading && error && <div className="jobs-error">{t('common.error')}</div>}
          {!loading && !error && result && (
            <JobList jobs={result.jobs} pagination={result.pagination} onPageChange={changePage} />
          )}
        </section>
      </div>
    </div>
  );
}

export default Jobs;
