// src/components/Analyzer/MatchResult.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StatCard from '../Charts/StatCard.jsx';
import MatchRateChart from './MatchRateChart.jsx';
import { getLang, pickLocalized } from '../../utils/jobs';
import './MatchResult.css';

const LIST_LIMIT = 20;

function MatchResult({ result }) {
  const { t, i18n } = useTranslation();
  const lang = getLang(i18n);
  const { match_rate_by_job: jobs, overall_stats: stats } = result;

  if (jobs.length === 0) {
    return <div className="match-result__empty">{t('analyzer.noMatches')}</div>;
  }

  return (
    <div className="match-result">
      <div className="match-result__stats">
        <StatCard label={t('analyzer.matchedJobs')} value={stats.total_matching_jobs} accent="var(--success)" />
        <StatCard
          label={t('analyzer.matchRate')}
          value={`${stats.avg_match_rate}%`}
          accent="var(--accent)"
        />
      </div>

      <div className="match-result__chart-card">
        <h3 className="match-result__section-title">{t('analyzer.topMatches')}</h3>
        <MatchRateChart jobs={jobs} />
      </div>

      <div className="match-result__list-card">
        <h3 className="match-result__section-title">{t('analyzer.results')}</h3>
        <ul className="match-result__list">
          {jobs.slice(0, LIST_LIMIT).map((job) => (
            <li className="match-row" key={job.job_id}>
              <div className="match-row__top">
                <Link to={`/jobs/${job.job_id}`} className="match-row__title">
                  {pickLocalized(job, 'title', lang)}
                </Link>
                <span className="match-row__rate">{t('analyzer.matchRatePercent', { rate: job.match_rate })}</span>
              </div>
              <div className="match-row__bar-track">
                <div
                  className="match-row__bar-fill"
                  style={{ width: `${job.match_rate}%` }}
                  data-level={job.match_rate >= 70 ? 'high' : job.match_rate >= 40 ? 'mid' : 'low'}
                />
              </div>
              {job.missing.length > 0 && (
                <div className="match-row__missing">
                  <span className="match-row__missing-label">{t('analyzer.missingSkills')}:</span>
                  {job.missing.map((skill) => (
                    <span className="skill-chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MatchResult;
