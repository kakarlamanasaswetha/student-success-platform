import { Line } from 'react-chartjs-2';

export default function GradeTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500">No graded assignments yet.</p>;
  }

  const percents = data.map((d) => d.percent);
  const summary = `Line chart of grade trend across ${data.length} graded assignment${
    data.length === 1 ? '' : 's'
  }, from ${data[0].label} at ${percents[0]}% to ${data[data.length - 1].label} at ${percents[percents.length - 1]}%. Lowest score ${Math.min(
    ...percents
  )}%, highest ${Math.max(...percents)}%.`;

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Score (%)',
        data: data.map((d) => d.percent),
        borderColor: '#2745e4',
        backgroundColor: 'rgba(39, 69, 228, 0.12)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#2745e4',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } },
      x: { ticks: { maxRotation: 40, minRotation: 0 } },
    },
  };

  return (
    <div className="h-64" role="img" aria-label={summary}>
      <Line data={chartData} options={options} aria-hidden="true" />
    </div>
  );
}
