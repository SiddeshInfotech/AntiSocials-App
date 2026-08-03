const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const buildFallbackReflection = (emotion, situation) => {
  const context = (situation || '').trim();
  const shortContext = context.length > 90 ? `${context.slice(0, 90)}…` : context;

  return {
    whatIUnderstand: `You shared something important and personal. The details around “${shortContext || 'this moment'}” suggest that this emotion is connected to something real and worth paying attention to.`,
    emotionalReflection: `Feeling ${emotion?.toLowerCase() || 'this way'} in this moment makes sense. Your reaction is not a flaw; it is the mind and body responding to something that matters to you.`,
    differentPerspective: 'Sometimes the kindest way to meet a difficult feeling is to let it be present without forcing it to be solved immediately. This can create a little more room to breathe.',
    gentleNextStep: [
      'Take one slow breath and name the feeling in one sentence.',
      'Choose one small action that feels manageable right now.',
      'Let this moment be a signal, not a verdict.',
    ],
  };
};

router.post('/analyze', async (req, res) => {
  const { emotion, situation } = req.body;

  if (!emotion || !situation || situation.trim().length < 5) {
    return res.status(400).json(buildFallbackReflection(emotion, situation));
  }

  const prompt = `
You are a warm, wise, and deeply empathetic emotional wellness guide. The user is experiencing "${emotion}" and has shared the following:

"${situation}"

Respond in the following exact JSON structure. Make it feel human, specific to their situation, and never generic. Use calm, supportive, insightful language. Do NOT diagnose or provide medical advice.

{
  "whatIUnderstand": "A short, human, and personal reflection of what stands out most from their situation.",
  "emotionalReflection": "A thoughtful explanation of why this feeling makes sense given their situation.",
  "differentPerspective": "A gentle broader way of seeing the situation without dismissing their feeling.",
  "gentleNextStep": ["Action 1", "Action 2", "Action 3"]
}

Return ONLY the raw JSON. No markdown. No explanation outside the JSON.
`;

  try {
    if (!genAI) {
      return res.json(buildFallbackReflection(emotion, situation));
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const clean = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(clean);

    return res.json({
      whatIUnderstand: parsed.whatIUnderstand || parsed.whatINotice || buildFallbackReflection(emotion, situation).whatIUnderstand,
      emotionalReflection: parsed.emotionalReflection || buildFallbackReflection(emotion, situation).emotionalReflection,
      differentPerspective: parsed.differentPerspective || parsed.anotherPerspective || buildFallbackReflection(emotion, situation).differentPerspective,
      gentleNextStep: Array.isArray(parsed.gentleNextStep) && parsed.gentleNextStep.length > 0
        ? parsed.gentleNextStep
        : Array.isArray(parsed.whatYouCanDoNext) && parsed.whatYouCanDoNext.length > 0
          ? parsed.whatYouCanDoNext
          : buildFallbackReflection(emotion, situation).gentleNextStep,
    });
  } catch (err) {
    console.error('Gemini error:', err?.message || err);
    return res.json(buildFallbackReflection(emotion, situation));
  }
});

module.exports = router;
