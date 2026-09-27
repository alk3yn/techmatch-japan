// src/components/Charts/SalaryVsExpChart.jsx
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { getThemeColors } from './chartSetup';

function SalaryVsExpChart({ data }) {
  const { t } = useTranslation();
  const colors = getThemeColors();

  const sorted = [...data].sort((a, b) => a.experience - b.experience);

  const chartData = {
    labels: sorted.map((row) => `${row.experience} ${t('common.years')}`),
    datasets: [
      {
        label: t('dashboard.avgSalary'),
        data: sorted.map((row) => row.avg_salary),
        borderColor: colors.accent,
        backgroundColor: `${colors.accent}33`,
        pointBackgroundColor: colors.accent,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `¥${Number(ctx.parsed.y).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.textSecondary },
        grid: { color: colors.border },
      },
      y: {
        ticks: {
          color: colors.textSecondary,
          callback: (value) => `¥${(value / 1000000).toFixed(1)}M`,
        },
        grid: { color: colors.border },
      },
    },
  };

  return (
    <div style={{ height: 340 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

export default SalaryVsExpChart;
