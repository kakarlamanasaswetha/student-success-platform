import { Bar } from 'react-chartjs-2';

export default function AttendanceChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500">No attendance records yet.</p>;
  }

  const rates = data.map((d) => d.rate);
  const avgRate = Math.round(rates.reduce((sum, r) => sum + r, 0) / rates.length);
  const summary = `Bar chart of weekly attendance rate across ${data.length} week${
    data.length === 1 ? '' : 's'
  }, averaging ${avgRate}%. Lowest week ${Math.min(...rates)}%, highest ${Math.max(...rates)}%.`;

  const chartData = {
    labels: data.map((d) => new Date(d.week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Weekly attendance rate (%)',
        data: data.map((d) => d.rate),
        backgroundColor: data.map((d) => (d.rate < 70 ? '#f87171' : d.rate < 90 ? '#fbbf24' : '#34d399')),
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } } },
  };

  return (
    <div className="h-64" role="img" aria-label={summary}>
      <Bar data={chartData} options={options} aria-hidden="true" />
    </div>
  );
}
