import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAlerts, acknowledgeAlert, resolveAlert } from '../api/endpoints';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';

const STATUS_TABS = [
  { key: 'open', label: 'Open' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'resolved', label: 'Resolved' },
];

export default function Alerts() {
  const [status, setStatus] = useState('open');
  const [alerts, setAlerts] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => fetchAlerts(status).then(({ data }) => setAlerts(data.alerts));

  useEffect(() => {
    setAlerts(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleAction = async (id, action) => {
    setBusyId(id);
    try {
      if (action === 'acknowledge') await acknowledgeAlert(id);
      else await resolveAlert(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Automated Alerts</h1>
        <p className="text-slate-500 text-sm mt-1">Early-warning notifications generated from student risk scores</p>
      </div>

      <div className="flex gap-1" role="group" aria-label="Filter alerts by status">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            aria-pressed={status === t.key}
            className={status === t.key ? 'toggle-btn-active' : 'toggle-btn-inactive'}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!alerts ? (
        <LoadingSpinner />
      ) : alerts.length === 0 ? (
        <div className="card text-slate-500 text-sm">No {status} alerts.</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/students/${a.student._id}`} className="font-semibold text-slate-800 hover:underline">
                      {a.student.name}
                    </Link>
                    <RiskBadge level={a.severity} score={a.riskScore} />
                  </div>
                  <p className="text-sm text-slate-600">{a.message}</p>
                  <ul className="mt-2 space-y-1">
                    {a.reasons?.map((r, i) => (
                      <li key={i} className="text-xs text-slate-500 flex gap-1.5">
                        <span className="text-slate-300" aria-hidden="true">
                          •
                        </span>
                        {r}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-400 mt-2">{new Date(a.createdAt).toLocaleString()}</p>
                </div>

                {status !== 'resolved' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    {status === 'open' && (
                      <button
                        className="btn-secondary text-xs py-1.5"
                        disabled={busyId === a._id}
                        aria-busy={busyId === a._id}
                        aria-label={`Acknowledge alert for ${a.student.name}`}
                        onClick={() => handleAction(a._id, 'acknowledge')}
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      className="btn-primary text-xs py-1.5"
                      disabled={busyId === a._id}
                      aria-busy={busyId === a._id}
                      aria-label={`Resolve alert for ${a.student.name}`}
                      onClick={() => handleAction(a._id, 'resolve')}
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
