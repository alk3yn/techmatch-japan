// src/components/Jobs/JobList.jsx
import { useTranslation } from 'react-i18next';
import JobCard from './JobCard.jsx';
import './JobList.css';

function JobList({ jobs, pagination, onPageChange }) {
  const { t } = useTranslation();

  if (!jobs.length) {
    return <div className="job-list__empty">{t('jobs.noResults')}</div>;
  }

  const { page, totalPages } = pagination;

  return (
    <div>
      <div className="job-list">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="job-pagination" aria-label="pagination">
          <button
            type="button"
            className="job-pagination__btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {t('jobs.prev')}
          </button>
          <span className="job-pagination__info">
            {t('jobs.pageOf', { page, totalPages })}
          </span>
          <button
            type="button"
            className="job-pagination__btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {t('jobs.next')}
          </button>
        </nav>
      )}
    </div>
  );
}

export default JobList;
