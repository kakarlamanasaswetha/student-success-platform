import { Doughnut } from 'react-chartjs-2';

const colorFor = (level) => ({ high: '#ef4444', medium: '#f59e0b', low: '#10b981' }[level] || '#10b981');

export default function RiskGauge({ score = 0, level = 'low' }) {
  const chartData = {
    labels: ['Risk', 'Remaining'],
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [colorFor(level), '#e2e8f0'],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  return (
    <div className="relative h-40 w-40 mx-auto">
      {/* Decorative: the visible text overlay below already conveys the score/level to screen readers */}
      <Doughnut data={chartData} options={options} aria-hidden="true" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-800">
          {score}
          <span className="sr-only"> out of 100</span>
        </span>
        <span className="text-xs text-slate-500 capitalize">{level} risk</span>
      </div>
    </div>
  );
}
