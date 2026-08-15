import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStudentList } from '../api/endpoints';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'high', label: 'High risk' },
  { key: 'medium', label: 'Medium risk' },
  { key: 'low', label: 'Low risk' },
];

export default function AdvisorDashboard() {
  const [students, setStudents] = useState(null);
  const [summary, setSummary] = useState(null);
  const [risk, setRisk] = useState('');
  const [search, setSearch] = useState('');

  const load = async (params) => {
    const { data } = await fetchStudentList(params);
    setStudents(data.students);
    setSummary(data.summary);
  };

  useEffect(() => {
    load({ risk: risk || undefined, search: search || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risk]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    load({ risk: risk || undefined, search: search || undefined });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">At-Risk Students</h1>
        <p className="text-slate-500 text-sm mt-1">Early-warning overview across your advisee caseload</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard label="Total students" value={summary.total} />
          <SummaryCard label="High risk" value={summary.high} accent="text-red-600" />
          <SummaryCard label="Medium risk" value={summary.medium} accent="text-amber-600" />
          <SummaryCard label="Low risk" value={summary.low} accent="text-emerald-600" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1" role="group" aria-label="Filter by risk level">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRisk(f.key)}
              aria-pressed={risk === f.key}
              className={risk === f.key ? 'toggle-btn-active' : 'toggle-btn-inactive'}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearchSubmit} role="search" className="flex gap-2 ml-auto">
          <label htmlFor="student-search" className="sr-only">
            Search students by name or email
          </label>
          <input
            id="student-search"
            type="search"
            className="input max-w-xs"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>
      </div>

      {!students ? (
        <LoadingSpinner />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                <th className="pb-2 pr-4">Student</th>
                <th className="pb-2 pr-4">Major / Year</th>
                <th className="pb-2 pr-4">GPA</th>
                <th className="pb-2 pr-4">Risk</th>
                <th className="pb-2 pr-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {s.studentInfo?.major || '—'} · {s.studentInfo?.year || '—'}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{s.studentInfo?.gpa?.toFixed(2) || '—'}</td>
                  <td className="py-3 pr-4">
                    <RiskBadge level={s.studentInfo?.riskLevel} score={s.studentInfo?.riskScore} />
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <Link to={`/students/${s._id}`} className="text-brand-600 font-medium hover:underline" aria-label={`View profile for ${s.name}`}>
                      View profile <span aria-hidden="true">→</span>
                    </Link>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No students match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent = 'text-slate-800' }) {
  return (
    <div className="card">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}
