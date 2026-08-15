import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCourses, fetchCourseRoster } from '../api/endpoints';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';

export default function InstructorDashboard() {
  const [courses, setCourses] = useState(null);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [roster, setRoster] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  useEffect(() => {
    fetchCourses().then(({ data }) => {
      setCourses(data.courses);
      if (data.courses.length) setActiveCourseId(data.courses[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!activeCourseId) return;
    setRosterLoading(true);
    fetchCourseRoster(activeCourseId)
      .then(({ data }) => setRoster(data))
      .finally(() => setRosterLoading(false));
  }, [activeCourseId]);

  if (!courses) return <LoadingSpinner full />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
        <p className="text-slate-500 text-sm mt-1">Course rosters with performance, attendance, and risk signals</p>
      </div>

      {courses.length === 0 ? (
        <div className="card text-slate-500 text-sm">You are not assigned as instructor for any courses yet.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select a course">
            {courses.map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveCourseId(c._id)}
                aria-pressed={activeCourseId === c._id}
                aria-label={`${c.code} — ${c.title}`}
                className={activeCourseId === c._id ? 'toggle-btn-active' : 'toggle-btn-inactive'}
              >
                {c.code}
              </button>
            ))}
          </div>

          {rosterLoading || !roster ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              <div className="card">
                <h2 className="font-semibold text-slate-800">
                  {roster.course.code} · {roster.course.title}
                </h2>
                <p className="text-sm text-slate-500">
                  {roster.course.term} · {roster.roster.length} students enrolled
                </p>
              </div>

              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                      <th className="pb-2 pr-4">Student</th>
                      <th className="pb-2 pr-4">Current grade</th>
                      <th className="pb-2 pr-4">Completion</th>
                      <th className="pb-2 pr-4">Attendance</th>
                      <th className="pb-2 pr-4">Risk</th>
                      <th className="pb-2 pr-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.roster.map((r) => (
                      <tr key={r.student._id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-slate-800">{r.student.name}</p>
                          <p className="text-xs text-slate-500">{r.student.email}</p>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{r.currentGrade !== null ? `${r.currentGrade}%` : '—'}</td>
                        <td className="py-3 pr-4 text-slate-600">{r.completionRate}%</td>
                        <td className="py-3 pr-4 text-slate-600">{r.attendanceRate}%</td>
                        <td className="py-3 pr-4">
                          <RiskBadge level={r.riskLevel} score={r.riskScore} />
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Link
                            to={`/students/${r.student._id}`}
                            className="text-brand-600 font-medium hover:underline"
                            aria-label={`View profile for ${r.student.name}`}
                          >
                            View profile <span aria-hidden="true">→</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
