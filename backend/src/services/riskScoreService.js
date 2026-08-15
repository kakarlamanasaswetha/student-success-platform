const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');

// Calibrated against this formula's actual output range, not an abstract 0-100 scale:
// students with solid standing score ~5-10, moderate-concern students ~15-20, and
// students with multiple simultaneous red flags (near-failing grade + high missing-work
// rate + weak attendance) land ~30-40. A combined-failure case (near-zero grade,
// most work missing, most classes skipped) is needed to approach 55+. Thresholds of
// 40/70 left every one of those "multiple red flags" cases classified as low risk.
const HIGH_THRESHOLD = () => Number(process.env.RISK_HIGH_THRESHOLD || 55);
const MEDIUM_THRESHOLD = () => Number(process.env.RISK_MEDIUM_THRESHOLD || 30);

const levelFromScore = (score) => {
  if (score >= HIGH_THRESHOLD()) return 'high';
  if (score >= MEDIUM_THRESHOLD()) return 'medium';
  return 'low';
};

/**
 * Weighted risk model (0 = safest, 100 = highest risk):
 *  - 35% grade performance (avg current grade across active enrollments)
 *  - 30% assignment completion rate (submitted+late+excused vs missing)
 *  - 25% attendance rate (present+excused vs absent)
 *  - 10% negative grade trend (declining across enrollments' recent submissions)
 * The weighting mirrors why early-warning systems exist: grades alone lag behind
 * behavior signals like attendance/completion, so blending them surfaces risk sooner.
 */
const computeRiskForStudent = async (studentId) => {
  const [enrollments, submissions, attendance] = await Promise.all([
    Enrollment.find({ student: studentId, status: 'active' }).populate('course', 'title code'),
    Submission.find({ student: studentId }).populate('assignment', 'title dueDate maxScore'),
    AttendanceRecord.find({ student: studentId }),
  ]);

  const factors = [];

  // --- Grade component ---
  const gradedEnrollments = enrollments.filter((e) => typeof e.currentGrade === 'number' && e.currentGrade !== null);
  const avgGrade = gradedEnrollments.length
    ? gradedEnrollments.reduce((sum, e) => sum + e.currentGrade, 0) / gradedEnrollments.length
    : 75; // neutral default when no grade data yet
  const gradeRisk = Math.max(0, Math.min(100, 100 - avgGrade));
  if (avgGrade < 70) factors.push(`Average grade is ${avgGrade.toFixed(1)}%, below the 70% healthy threshold`);

  // --- Assignment completion component (only counts work that has actually come due) ---
  const pastDue = submissions.filter((s) => s.assignment && new Date(s.assignment.dueDate) <= new Date());
  const total = pastDue.length;
  const missing = pastDue.filter((s) => s.status === 'missing').length;
  const late = pastDue.filter((s) => s.status === 'late').length;
  const completionRate = total ? ((total - missing) / total) * 100 : 100;
  const completionRisk = Math.max(0, Math.min(100, 100 - completionRate));
  if (missing > 0) factors.push(`${missing} missing assignment${missing > 1 ? 's' : ''} out of ${total}`);
  if (late >= 2) factors.push(`${late} late submissions`);

  // --- Attendance component ---
  const totalDays = attendance.length;
  const absences = attendance.filter((a) => a.status === 'absent').length;
  const attendanceRate = totalDays ? ((totalDays - absences) / totalDays) * 100 : 100;
  const attendanceRisk = Math.max(0, Math.min(100, 100 - attendanceRate));
  if (attendanceRate < 85 && totalDays > 0) {
    factors.push(`Attendance rate is ${attendanceRate.toFixed(0)}%, below the 85% healthy threshold`);
  }

  // --- Trend component: compare grade of most recent scored submissions vs earlier ones ---
  const scored = submissions
    .filter((s) => typeof s.score === 'number' && s.assignment && s.assignment.maxScore)
    .map((s) => ({ pct: (s.score / s.assignment.maxScore) * 100, due: s.assignment.dueDate }))
    .sort((a, b) => new Date(a.due) - new Date(b.due));

  let trendRisk = 20; // neutral default
  if (scored.length >= 4) {
    const mid = Math.floor(scored.length / 2);
    const earlyAvg = scored.slice(0, mid).reduce((s, x) => s + x.pct, 0) / mid;
    const recentAvg = scored.slice(mid).reduce((s, x) => s + x.pct, 0) / (scored.length - mid);
    const delta = earlyAvg - recentAvg; // positive => declining performance
    trendRisk = Math.max(0, Math.min(100, 50 + delta * 1.5));
    if (delta > 8) factors.push(`Recent scores trending downward (${earlyAvg.toFixed(0)}% → ${recentAvg.toFixed(0)}%)`);
  }

  const riskScore = Math.round(
    gradeRisk * 0.35 + completionRisk * 0.3 + attendanceRisk * 0.25 + trendRisk * 0.1
  );

  return {
    riskScore,
    riskLevel: levelFromScore(riskScore),
    riskFactors: factors.length ? factors : ['No significant risk factors detected'],
    breakdown: {
      avgGrade: Number(avgGrade.toFixed(1)),
      completionRate: Number(completionRate.toFixed(1)),
      attendanceRate: Number(attendanceRate.toFixed(1)),
      gradeRisk: Math.round(gradeRisk),
      completionRisk: Math.round(completionRisk),
      attendanceRisk: Math.round(attendanceRisk),
      trendRisk: Math.round(trendRisk),
    },
  };
};

/** Recomputes and persists risk for a single student. Returns the updated User doc. */
const recalculateAndSaveRisk = async (studentId) => {
  const result = await computeRiskForStudent(studentId);
  const student = await User.findByIdAndUpdate(
    studentId,
    {
      $set: {
        'studentInfo.riskScore': result.riskScore,
        'studentInfo.riskLevel': result.riskLevel,
        'studentInfo.riskFactors': result.riskFactors,
        'studentInfo.lastRiskUpdate': new Date(),
      },
    },
    { new: true }
  );
  return { student, ...result };
};

module.exports = { computeRiskForStudent, recalculateAndSaveRisk, levelFromScore, HIGH_THRESHOLD, MEDIUM_THRESHOLD };
