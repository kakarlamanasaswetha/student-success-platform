const { buildMockRecommendation, buildMockSummary, buildMockChatReply } = require('../utils/mockAI');

let OpenAI;
try {
  // eslint-disable-next-line global-require
  OpenAI = require('openai');
} catch {
  OpenAI = null;
}

const isLiveMode = () => Boolean(process.env.OPENAI_API_KEY && OpenAI);

let client = null;
const getClient = () => {
  if (!isLiveMode()) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
};

const MODEL = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Generates a personalized study recommendation for a student.
 * riskData = { name, riskLevel, riskScore, riskFactors, breakdown }
 */
const generateStudyRecommendation = async (riskData) => {
  const openai = getClient();

  if (!openai) {
    const mock = buildMockRecommendation(riskData);
    return { ...mock, source: 'mock' };
  }

  try {
    const prompt = `You are an academic success coach for a university student success platform.
Student: ${riskData.name}
Risk level: ${riskData.riskLevel} (score ${riskData.riskScore}/100)
Risk factors: ${riskData.riskFactors.join('; ')}
Performance breakdown: avg grade ${riskData.breakdown?.avgGrade}%, assignment completion ${riskData.breakdown?.completionRate}%, attendance ${riskData.breakdown?.attendanceRate}%.

Write a warm, encouraging, and specific 2-3 sentence message directly to the student, followed by 3-4 concrete, actionable study tips as a JSON array under key "tips". Respond ONLY with JSON: {"content": "...", "tips": ["...", "..."]}`;

    const completion = await openai.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: 'You are a supportive, practical academic success coach. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    return {
      content: parsed.content || buildMockRecommendation(riskData).content,
      tips: Array.isArray(parsed.tips) ? parsed.tips : buildMockRecommendation(riskData).tips,
      source: 'openai',
    };
  } catch (err) {
    console.error('OpenAI recommendation error, falling back to mock:', err.message);
    const mock = buildMockRecommendation(riskData);
    return { ...mock, source: 'mock' };
  }
};

/** Summarizes a student's performance for advisors/instructors. */
const summarizePerformance = async (riskData) => {
  const openai = getClient();

  if (!openai) {
    return { summary: buildMockSummary(riskData), source: 'mock' };
  }

  try {
    const prompt = `Summarize this student's academic performance for an academic advisor in 3-4 sentences. Be factual, concise, and end with a recommended next action.
Student: ${riskData.name}
Risk level: ${riskData.riskLevel} (score ${riskData.riskScore}/100)
Risk factors: ${riskData.riskFactors.join('; ')}
Performance: avg grade ${riskData.breakdown?.avgGrade}%, assignment completion ${riskData.breakdown?.completionRate}%, attendance ${riskData.breakdown?.attendanceRate}%.`;

    const completion = await openai.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: 'You are an academic data analyst producing concise advisor briefings.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    });

    const summary = completion.choices?.[0]?.message?.content?.trim();
    return { summary: summary || buildMockSummary(riskData), source: 'openai' };
  } catch (err) {
    console.error('OpenAI summary error, falling back to mock:', err.message);
    return { summary: buildMockSummary(riskData), source: 'mock' };
  }
};

/** Conversational academic assistant chatbot. history = [{role, content}, ...] */
const chatReply = async (message, history = [], context = {}) => {
  const openai = getClient();

  if (!openai) {
    return { reply: buildMockChatReply(message, context), source: 'mock' };
  }

  try {
    const systemPrompt = `You are an academic assistant chatbot for a university student success platform. You help students understand their grades, attendance, assignments, and study strategies. Be encouraging, concise (under 120 words), and practical. Student context: ${JSON.stringify(
      context
    )}`;

    const completion = await openai.chat.completions.create({
      model: MODEL(),
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ],
      temperature: 0.6,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    return { reply: reply || buildMockChatReply(message, context), source: 'openai' };
  } catch (err) {
    console.error('OpenAI chat error, falling back to mock:', err.message);
    return { reply: buildMockChatReply(message, context), source: 'mock' };
  }
};

module.exports = { isLiveMode, generateStudyRecommendation, summarizePerformance, chatReply };
