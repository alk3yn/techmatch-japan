// src/components/Charts/SkillsDemandChart.jsx
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { getThemeColors } from './chartSetup';

const TOP_N = 15;

function SkillsDemandChart({ data }) {
  const { t } = useTranslation();
  const colors = getThemeColors();

  // Data already arrives sorted desc by count from the API, but re-sort
  // defensively so this component doesn't depend on that ordering.
  const top = [...data].sort((a, b) => b.count - a.count).slice(0, TOP_N);

  const chartData = {
    labels: top.map((row) => row.skill),
    datasets: [
      {
        label: t('jobs.skills'),
        data: top.map((row) => row.count),
        backgroundColor: colors.success,
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
    },
    scales: {
      x: {
        ticks: { color: colors.textSecondary },
        grid: { color: colors.border },
      },
      y: {
        ticks: { color: colors.textSecondary, font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: 420 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default SkillsDemandChart;
