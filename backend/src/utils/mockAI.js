/**
 * Realistic canned AI responses used when OPENAI_API_KEY is not configured.
 * Keeps the app fully demoable (UI, data flow, alerts) without any API cost or key.
 */

const pick = (arr, seed = 0) => arr[seed % arr.length];

const buildMockRecommendation = ({ name, riskLevel, riskFactors = [], breakdown = {} }) => {
  const tipsByFactor = [];

  if (breakdown.attendanceRisk > 20) {
    tipsByFactor.push(
      'Set a recurring calendar reminder 15 minutes before each class and aim for a 2-week streak of on-time attendance.'
    );
  }
  if (breakdown.completionRisk > 20) {
    tipsByFactor.push(
      'Break upcoming assignments into 25-minute focused work blocks (Pomodoro) and submit a rough draft 24 hours before each deadline.'
    );
  }
  if (breakdown.gradeRisk > 20) {
    tipsByFactor.push(
      'Book a session at the campus tutoring/writing center this week and review the two lowest-scoring assignments with a TA.'
    );
  }
  if (breakdown.trendRisk > 30) {
    tipsByFactor.push(
      'Your recent scores are trending down — revisit the last 2 topics covered in lecture before moving on to new material.'
    );
  }
  if (!tipsByFactor.length) {
    tipsByFactor.push(
      'Keep up your current study rhythm — consider joining a study group to deepen mastery of upcoming topics.',
      'Try active-recall flashcards for your next quiz instead of re-reading notes.'
    );
  }

  const opener = {
    high: `${name}, your recent activity shows some warning signs, but they're very fixable with a focused plan this week.`,
    medium: `${name}, you're doing okay overall, with a few areas that could use extra attention before they slip.`,
    low: `${name}, you're on solid footing — here's how to keep the momentum going and push toward even stronger results.`,
  }[riskLevel || 'medium'];

  return {
    content: `${opener} ${riskFactors[0] ? `A key thing to address: ${riskFactors[0]}.` : ''}`.trim(),
    tips: tipsByFactor.slice(0, 4),
  };
};

const buildMockSummary = ({ name, breakdown = {}, riskLevel }) => {
  return (
    `${name} currently has an average grade of ${breakdown.avgGrade ?? 'N/A'}%, ` +
    `an assignment completion rate of ${breakdown.completionRate ?? 'N/A'}%, and ` +
    `an attendance rate of ${breakdown.attendanceRate ?? 'N/A'}%. ` +
    `Overall risk is assessed as ${riskLevel?.toUpperCase() || 'MEDIUM'}. ` +
    (riskLevel === 'high'
      ? 'Recommend proactive advisor outreach this week and a check-in on course load or external stressors.'
      : riskLevel === 'medium'
      ? 'Recommend a light-touch check-in and monitoring over the next 2-3 weeks.'
      : 'No intervention needed at this time; continue routine monitoring.')
  );
};

const CHATBOT_CANNED = [
  {
    match: /(hi|hello|hey)\b/i,
    reply: "Hi! I'm your academic assistant. I can help you understand your grades, attendance, and study plan, or point you to campus resources. What's on your mind?",
  },
  {
    match: /grade|gpa|score/i,
    reply:
      "I can see your current course averages on your dashboard's Academic Progress chart. If a grade seems off, it's best to double-check with your instructor, but generally focusing extra study time on your lowest-scoring course first has the biggest impact on your GPA.",
  },
  {
    match: /attend|absen/i,
    reply:
      'Attendance is one of the strongest early predictors of course outcomes. If you\'ve missed a few sessions, try to get notes from a classmate and attend office hours to catch up — consistent attendance from here on will steadily lower your risk score.',
  },
  {
    match: /study|tips|advice|improve/i,
    reply:
      'A few study habits that consistently help: (1) active recall over re-reading, (2) spaced repetition for memorization-heavy material, (3) breaking large assignments into daily 25-minute sessions, and (4) using office hours proactively instead of only when stuck. Check your Recommendations panel for suggestions tailored to your current data.',
  },
  {
    match: /assignment|homework|missing|deadline/i,
    reply:
      'Missing assignments compound quickly since they usually count as zeros. If you have overdue work, reach out to your instructor about late-submission policy first, then prioritize the highest-weighted upcoming deadlines.',
  },
  {
    match: /advisor|help|talk to someone|counsel/i,
    reply:
      "Your academic advisor can help with course planning, workload concerns, or connecting you to campus support (tutoring, financial aid, wellness). You can request a check-in directly from your dashboard.",
  },
  {
    match: /risk|at.risk/i,
    reply:
      "Your risk score blends grades, assignment completion, attendance, and recent trend. It's designed to catch issues early — a medium or high score isn't a judgment, it's a nudge to make small adjustments now before they snowball near finals.",
  },
];

const buildMockChatReply = (message, context = {}) => {
  const found = CHATBOT_CANNED.find((c) => c.match.test(message));
  if (found) return found.reply;

  const fallback = [
    "That's a great question — while I don't have live AI access in demo mode, here's general guidance: check your dashboard's Academic Progress and Recommendations panels for personalized data-driven suggestions.",
    "I'm running in demo mode right now (no OpenAI API key configured), so my answers are canned examples. In a live deployment, I'd tailor this to your specific courses and recent performance.",
    "Good question! In demo mode I can't reason over live data, but generally the highest-leverage move is to tackle whichever of grades, attendance, or assignment completion has the biggest gap first.",
  ];
  return pick(fallback, message.length);
};

module.exports = { buildMockRecommendation, buildMockSummary, buildMockChatReply };
