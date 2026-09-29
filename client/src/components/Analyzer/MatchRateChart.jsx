// src/components/Analyzer/MatchRateChart.jsx
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import '../Charts/chartSetup';
import { getThemeColors } from '../Charts/chartSetup';
import { getLang, pickLocalized } from '../../utils/jobs';

const TOP_N = 10;

function MatchRateChart({ jobs }) {
  const { t, i18n } = useTranslation();
  const lang = getLang(i18n);
  const colors = getThemeColors();

  const top = jobs.slice(0, TOP_N);

  const chartData = {
    labels: top.map((job) => pickLocalized(job, 'title', lang)),
    datasets: [
      {
        label: t('analyzer.matchRate'),
        data: top.map((job) => job.match_rate),
        backgroundColor: top.map((job) =>
          job.match_rate >= 70 ? colors.success : job.match_rate >= 40 ? colors.accent : colors.warning
        ),
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.x}%`,
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { color: colors.textSecondary, callback: (v) => `${v}%` },
        grid: { color: colors.border },
      },
      y: {
        ticks: { color: colors.textSecondary, font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: Math.max(220, top.length * 34) }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default MatchRateChart;
