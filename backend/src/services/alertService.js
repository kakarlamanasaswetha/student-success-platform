const Alert = require('../models/Alert');
const { recalculateAndSaveRisk, MEDIUM_THRESHOLD } = require('./riskScoreService');

/**
 * Recomputes a student's risk score and, if it now sits at medium/high risk,
 * opens a new alert unless an open alert already exists for that student.
 * This is what turns "we noticed a risk signal" into "an advisor gets notified"
 * automatically, instead of waiting for a human to spot it during a review.
 */
const evaluateAndAlert = async (studentId) => {
  const { student, riskScore, riskLevel, riskFactors } = await recalculateAndSaveRisk(studentId);

  if (riskScore < MEDIUM_THRESHOLD()) {
    return { student, riskScore, riskLevel, alertCreated: false };
  }

  const existingOpen = await Alert.findOne({ student: studentId, status: 'open' });
  if (existingOpen) {
    // Keep the existing alert's data fresh instead of spamming duplicates.
    existingOpen.severity = riskLevel;
    existingOpen.riskScore = riskScore;
    existingOpen.reasons = riskFactors;
    existingOpen.message = `${student.name} is at ${riskLevel} risk (score ${riskScore}/100).`;
    await existingOpen.save();
    return { student, riskScore, riskLevel, alertCreated: false, alert: existingOpen };
  }

  const alert = await Alert.create({
    student: studentId,
    severity: riskLevel,
    riskScore,
    reasons: riskFactors,
    message: `${student.name} is at ${riskLevel} risk (score ${riskScore}/100). Key factors: ${riskFactors.join('; ')}.`,
  });

  return { student, riskScore, riskLevel, alertCreated: true, alert };
};

module.exports = { evaluateAndAlert };
