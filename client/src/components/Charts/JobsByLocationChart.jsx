// src/components/Charts/JobsByLocationChart.jsx
import { Doughnut } from 'react-chartjs-2';
import { getThemeColors, CHART_PALETTE } from './chartSetup';

function JobsByLocationChart({ data }) {
  const colors = getThemeColors();
  const sorted = [...data].sort((a, b) => b.count - a.count);

  const chartData = {
    labels: sorted.map((row) => row.location),
    datasets: [
      {
        data: sorted.map((row) => row.count),
        backgroundColor: CHART_PALETTE,
        borderColor: colors.bgCard || '#21242f',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: colors.textSecondary, boxWidth: 12, padding: 14 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.parsed}`,
        },
      },
    },
  };

  return (
    <div style={{ height: 380 }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

export default JobsByLocationChart;
