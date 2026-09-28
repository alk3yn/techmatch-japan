// src/pages/JobDetail.jsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import Loading from '../components/common/Loading.jsx';
import { getLang, pickLocalized, formatSalaryRange } from '../utils/jobs';
import './JobDetail.css';

function JobDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const lang = getLang(i18n);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // 'notFound' | 'error' | null

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStatus(null);

    apiClient
      .get(`/jobs/${id}`)
      .then((res) => {
        if (!cancelled) setJob(res.data.data.job);
      })
      .catch((err) => {
        if (cancelled) return;
        const code = err.response?.status;
        setStatus(code === 404 || code === 400 ? 'notFound' : 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const backLink = (
    <Link to="/jobs" className="job-detail__back">
      ← {t('jobs.backToList')}
    </Link>
  );

  if (loading) return <Loading />;

  if (status || !job) {
    return (
      <div className="job-detail">
        {backLink}
        <div className="job-detail__status">
          {status === 'notFound' ? t('jobs.notFound') : t('common.error')}
        </div>
      </div>
    );
  }

  const experienceLabel =
    job.experience_years === 0
      ? t('jobs.experienceNone')
      : t('jobs.experienceYears', { years: job.experience_years });

  return (
    <div className="job-detail">
      {backLink}

      <article className="job-detail__card">
        <header className="job-detail__header">
          <div>
            <h1 className="job-detail__title">{pickLocalized(job, 'title', lang)}</h1>
            <div className="job-detail__company">{job.company}</div>
          </div>
          <div className="job-detail__salary">
            {formatSalaryRange(job.salary_min, job.salary_max, lang)}
            <span>{t('common.perYear')}</span>
          </div>
        </header>

        <div className="job-detail__badges">
          {job.is_remote && <span className="badge badge--remote">{t('jobs.remote')}</span>}
          {job.career_changer_friendly && (
            <span className="badge badge--career">{t('jobs.careerChanger')}</span>
          )}
        </div>

        <dl className="job-detail__facts">
          <div>
            <dt>{t('jobs.location')}</dt>
            <dd>{t(`jobs.locations.${job.location}`, job.location)}</dd>
          </div>
          <div>
            <dt>{t('jobs.experience')}</dt>
            <dd>{experienceLabel}</dd>
          </div>
          <div>
            <dt>{t('jobs.employmentType')}</dt>
            <dd>{t(`jobs.employmentTypes.${job.employment_type}`, job.employment_type)}</dd>
          </div>
        </dl>

        <section className="job-detail__section">
          <h2>{t('jobs.description')}</h2>
          <p>{pickLocalized(job, 'description', lang)}</p>
        </section>

        <section className="job-detail__section">
          <h2>{t('jobs.requiredSkills')}</h2>
          <div className="job-detail__skills">
            {(job.skills || []).map((skill) => (
              <span className="skill-chip" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </section>

        <footer className="job-detail__footer">
          <button type="button" className="job-detail__apply" disabled>
            {t('jobs.apply')}
          </button>
          <span className="job-detail__sample">{t('jobs.sampleListing')}</span>
        </footer>
      </article>
    </div>
  );
}

export default JobDetail;
