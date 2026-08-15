export default function RiskBadge({ level, score }) {
  const cls = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[level] || 'badge-low';
  const label = { high: 'High risk', medium: 'Medium risk', low: 'Low risk' }[level] || 'Low risk';

  return (
    <span className={cls}>
      {label}
      {typeof score === 'number' ? ` · ${score}` : ''}
    </span>
  );
}
