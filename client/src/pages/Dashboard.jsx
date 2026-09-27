// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import '../components/Charts/chartSetup';
import StatCard from '../components/Charts/StatCard.jsx';
import SalaryByTechChart from '../components/Charts/SalaryByTechChart.jsx';
import JobsByLocationChart from '../components/Charts/JobsByLocationChart.jsx';
import SkillsDemandChart from '../components/Charts/SkillsDemandChart.jsx';
import SalaryVsExpChart from '../components/Charts/SalaryVsExpChart.jsx';
import './Dashboard.css';

function formatYen(amount) {
  if (amount === undefined || amount === null) return '—';
  return `¥${Number(amount).toLocaleString()}`;
}

function Dashboard() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(null);
  const [salaryByTech, setSalaryByTech] = useState(null);
  const [jobsByLocation, setJobsByLocation] = useState(null);
  const [skillsDemand, setSkillsDemand] = useState(null);
  const [salaryVsExp, setSalaryVsExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, techRes, locationRes, skillsRes, expRes] = await Promise.all([
          apiClient.get('/analytics/overview'),
          apiClient.get('/analytics/salary-by-tech'),
          apiClient.get('/analytics/jobs-by-location'),
          apiClient.get('/analytics/skills-demand'),
          apiClient.get('/analytics/salary-vs-experience'),
        ]);

        if (cancelled) return;

        setOverview(overviewRes.data.data);
        setSalaryByTech(techRes.data.data);
        setJobsByLocation(locationRes.data.data);
        setSkillsDemand(skillsRes.data.data);
        setSalaryVsExp(expRes.data.data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="dashboard-status">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="dashboard-status dashboard-status--error">{t('common.error')}</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">{t('dashboard.title')}</h1>

      <div className="dashboard-stats">
        <StatCard label={t('dashboard.totalJobs')} value={overview.total_jobs} />
        <StatCard label={t('dashboard.avgSalary')} value={formatYen(overview.avg_salary)} accent="var(--accent)" />
        <StatCard label={t('dashboard.remoteJobs')} value={overview.remote_count} accent="var(--success)" />
        <StatCard
          label={t('dashboard.careerChangerFriendly')}
          value={overview.career_changer_count}
          accent="var(--warning)"
        />
      </div>

      <div className="dashboard-charts">
        <div className="chart-card chart-card--wide">
          <h3 className="chart-card__title">{t('dashboard.salaryByTech')}</h3>
          <SalaryByTechChart data={salaryByTech} />
        </div>

        <div className="chart-card">
          <h3 className="chart-card__title">{t('dashboard.jobsByLocation')}</h3>
          <JobsByLocationChart data={jobsByLocation} />
        </div>

        <div className="chart-card chart-card--wide">
          <h3 className="chart-card__title">{t('dashboard.skillsDemand')}</h3>
          <SkillsDemandChart data={skillsDemand} />
        </div>

        <div className="chart-card">
          <h3 className="chart-card__title">{t('dashboard.salaryVsExp')}</h3>
          <SalaryVsExpChart data={salaryVsExp} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
