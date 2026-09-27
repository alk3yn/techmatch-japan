// src/components/Charts/SalaryByTechChart.jsx
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { getThemeColors } from './chartSetup';

const TOP_N = 15;

function SalaryByTechChart({ data }) {
  const { t } = useTranslation();
  const colors = getThemeColors();

  const top = [...data].sort((a, b) => b.avg_salary - a.avg_salary).slice(0, TOP_N);

  const chartData = {
    labels: top.map((row) => row.tech),
    datasets: [
      {
        label: t('dashboard.avgSalary'),
        data: top.map((row) => row.avg_salary),
        backgroundColor: colors.accent,
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
          label: (ctx) => `¥${Number(ctx.parsed.x).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: colors.textSecondary,
          callback: (value) => `¥${(value / 1000000).toFixed(1)}M`,
        },
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

export default SalaryByTechChart;
