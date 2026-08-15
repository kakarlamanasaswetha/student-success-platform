import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchStudentDashboard,
  fetchStudentProgress,
  fetchStudentRecommendations,
} from '../api/endpoints';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RiskBadge from '../components/common/RiskBadge';
import RiskGauge from '../components/charts/RiskGauge';
import GradeTrendChart from '../components/charts/GradeTrendChart';
import AttendanceChart from '../components/charts/AttendanceChart';
import ChatWidget from '../components/chat/ChatWidget';

export default function StudentDashboard() {
  const { id } = useParams(); // present when an advisor/instructor is viewing a student
  const [dashboard, setDashboard] = useState(null);
  const [progress, setProgress] = useState(null);
  const [recs, setRecs] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [dashRes, progRes, recRes] = await Promise.all([
        fetchStudentDashboard(id),
        fetchStudentProgress(id),
        fetchStudentRecommendations(id),
      ]);
      setDashboard(dashRes.data);
      setProgress(progRes.data);
      setRecs(recRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const refreshRecommendation = async () => {
    setRecsLoading(true);
    try {
      const { data } = await fetchStudentRecommendations(id, true);
      setRecs(data);
    } finally {
      setRecsLoading(false);
    }
  };

  if (error)
    return (
      <div role="alert" className="max-w-3xl mx-auto mt-10 text-red-600">
        {error}
      </div>
    );
  if (!dashboard || !progress) return <LoadingSpinner full />;

  const { student, enrollments, risk, stats } = dashboard;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {student.name.split(' ')[0]}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {student.studentInfo?.major || 'Undeclared'} · {student.studentInfo?.year || 'N/A'}
          </p>
        </div>
        <RiskBadge level={risk.riskLevel} score={risk.riskScore} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h2 className="font-semibold text-slate-800 mb-3">Risk Overview</h2>
          <RiskGauge score={risk.riskScore} level={risk.riskLevel} />
          <ul className="mt-4 space-y-1.5">
            {risk.riskFactors.map((f, i) => (
              <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                <span className="text-slate-400" aria-hidden="true">
                  •
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="card lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Courses" value={stats.totalCourses} />
          <Stat label="Avg grade" value={`${risk.breakdown.avgGrade}%`} />
          <Stat label="Attendance" value={`${risk.breakdown.attendanceRate}%`} />
          <Stat label="Completion" value={`${risk.breakdown.completionRate}%`} />

          <div className="col-span-2 sm:col-span-4 mt-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Enrolled courses</h3>
            <div className="space-y-2">
              {enrollments.map((e) => (
                <div key={e._id} className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {e.course.code} · {e.course.title}
                    </p>
                    <p className="text-xs text-slate-500">{e.course.credits} credits</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {e.currentGrade !== null ? `${e.currentGrade}% (${e.letterGrade})` : 'No grade yet'}
                  </span>
                </div>
              ))}
              {enrollments.length === 0 && <p className="text-sm text-slate-500">No active enrollments.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-3">Grade Trend</h2>
          <GradeTrendChart data={progress.gradeTrend} />
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-3">Attendance Trend</h2>
          <AttendanceChart data={progress.attendanceTrend} />
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${id ? '' : 'lg:grid-cols-2'}`}>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">AI Study Recommendations</h2>
            <button
              className="btn-secondary text-xs py-1.5"
              onClick={refreshRecommendation}
              disabled={recsLoading}
              aria-busy={recsLoading}
            >
              {recsLoading ? 'Generating…' : 'Regenerate'}
            </button>
          </div>
          {recs?.latest && (
            <>
              <p className="text-sm text-slate-700 mb-3">{recs.latest.content}</p>
              <ul className="space-y-2">
                {recs.latest.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="text-brand-600 mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
              <span className={`badge mt-3 ${recs.latest.source === 'openai' ? 'badge-low' : 'badge-medium'}`}>
                {recs.latest.source === 'openai' ? 'Live AI' : 'Demo mode'}
              </span>
            </>
          )}
        </div>

        {!id && <ChatWidget />}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}
