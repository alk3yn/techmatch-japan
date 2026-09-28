// src/components/Jobs/JobCard.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLang, pickLocalized, formatSalaryRange } from '../../utils/jobs';
import './JobCard.css';

const MAX_VISIBLE_SKILLS = 5;

function JobCard({ job }) {
  const { t, i18n } = useTranslation();
  const lang = getLang(i18n);
  const skills = job.skills || [];
  const extra = skills.length - MAX_VISIBLE_SKILLS;

  const experienceLabel =
    job.experience_years === 0
      ? t('jobs.experienceNone')
      : t('jobs.experienceYears', { years: job.experience_years });

  return (
    <Link to={`/jobs/${job.id}`} className="job-card">
      <div className="job-card__top">
        <div>
          <h3 className="job-card__title">{pickLocalized(job, 'title', lang)}</h3>
          <div className="job-card__company">{job.company}</div>
        </div>
        <div className="job-card__salary">{formatSalaryRange(job.salary_min, job.salary_max, lang)}</div>
      </div>

      <div className="job-card__meta">
        <span>{t(`jobs.locations.${job.location}`, job.location)}</span>
        <span>{experienceLabel}</span>
        <span>{t(`jobs.employmentTypes.${job.employment_type}`, job.employment_type)}</span>
      </div>

      <div className="job-card__badges">
        {job.is_remote && <span className="badge badge--remote">{t('jobs.remote')}</span>}
        {job.career_changer_friendly && (
          <span className="badge badge--career">{t('jobs.careerChanger')}</span>
        )}
      </div>

      <div className="job-card__skills">
        {skills.slice(0, MAX_VISIBLE_SKILLS).map((skill) => (
          <span className="skill-chip" key={skill}>
            {skill}
          </span>
        ))}
        {extra > 0 && <span className="skill-chip skill-chip--more">+{extra}</span>}
      </div>
    </Link>
  );
}

export default JobCard;
