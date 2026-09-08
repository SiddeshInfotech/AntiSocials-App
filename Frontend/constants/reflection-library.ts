export type EmotionId = 'Happiness' | 'Sadness' | 'Fear' | 'Anger' | 'Disgust';

export type ReflectionSection = {
  title: string;
  lines: string[];
};

export type Reflection = {
  sections: ReflectionSection[];
};

const createReflection = (emotion: EmotionId, theme: string, index: number): Reflection => ({
  sections: [
    {
      title: 'Understanding Your Situation',
      lines: [
        `There is a sense of ${theme} around this moment.`,
        'The details that matter most are the ones that feel alive in your body and mind.',
        'You are not being asked to explain everything perfectly.',
        'You are simply being allowed to notice what is true for you right now.',
        `The feeling of ${emotion.toLowerCase()} can carry important meaning when it is met gently.`,
        'It is enough to let the moment be real and honest.',
      ],
    },
    {
      title: 'Understanding Your Emotion',
      lines: [
        `This ${emotion.toLowerCase()} response makes complete human sense.`,
        'It may be telling you that something touched a nerve, a hope, a boundary, or a longing.',
        'Emotions often arrive to protect, to clarify, or to ask for care.',
        'They are not mistakes, and they do not need to be pushed away immediately.',
        `What you feel around ${theme} is worthy of kindness rather than judgment.`,
        'You can meet it with steadiness and compassion.',
      ],
    },
    {
      title: 'A Different Perspective',
      lines: [
        'Sometimes the most helpful view is not the one that solves the feeling, but the one that softens it.',
        'This moment may be less about finding a perfect answer and more about creating a little space.',
        'That space can help you see your experience more clearly without pressure.',
        `The presence of ${theme} does not erase your inner life; it deepens it.`,
        'You are allowed to hold complexity without needing to reduce it.',
        'A wider perspective can arrive gently when you stop forcing it.',
      ],
    },
    {
      title: 'A Gentle Next Step',
      lines: [
        'Choose one small action that feels manageable and kind.',
        'It might be a slow breath, a quiet pause, or a simple sentence spoken to yourself.',
        'Let the next step be modest enough to carry without strain.',
        'You do not need to fix everything in one moment.',
        `A small, steady response to ${theme} can be more healing than a dramatic one.`,
        'Care that is simple can still be deeply meaningful.',
      ],
    },
    {
      title: 'Final Reflection',
      lines: [
        `This reflection is not here to rush you, but to remind you that ${theme} matters.`,
        'You are allowed to feel what you feel and still remain grounded in your own wisdom.',
        'Your emotions are part of your inner language, and they deserve respect.',
        'The softness you offer yourself now can become the steadiness you carry forward.',
        `Even in ${theme}, there is room for clarity, warmth, and self-trust.`,
        `Reflection ${index + 1} is a quiet companion for this moment.`,
      ],
    },
  ],
});

const themesByEmotion: Record<EmotionId, string[]> = {
  Happiness: [
    'a bright sense of ease',
    'a moment of gratitude',
    'a feeling of warmth',
    'a spark of joy',
    'a meaningful pause',
    'a quiet celebration',
    'a wave of relief',
    'a burst of confidence',
    'a deep sense of peace',
    'a little light in the day',
    'a memory that still glows',
    'a simple reason to smile',
    'a welcome sense of freedom',
    'a gentle feeling of success',
    'a comforting connection',
    'an inner moment of calm',
    'a spark of wonder',
    'a deep appreciation',
    'a moment of shared warmth',
    'a tender sense of delight',
  ],
  Sadness: [
    'a tender ache',
    'a quiet heaviness',
    'a deep sense of loss',
    'a lingering loneliness',
    'a wave of emptiness',
    'a softened grief',
    'a quiet disappointment',
    'a hard truth',
    'a shadowed memory',
    'an ache that lingers',
    'a feeling of withdrawal',
    'a slow sadness',
    'a moment of yearning',
    'a tender disappointment',
    'a hidden hurt',
    'a quiet ache in the chest',
    'a difficult goodbye',
    'a moment of loneliness',
    'a sorrowful pause',
    'a steady sadness',
  ],
  Fear: [
    'a restless uncertainty',
    'a tightening of the body',
    'a fear of the unknown',
    'a sudden alarm',
    'a nervous anticipation',
    'a guarded feeling',
    'a hidden worry',
    'a moment of vulnerability',
    'a rush of caution',
    'a feeling of being on edge',
    'a protective tension',
    'a quiet sense of danger',
    'a worry that feels close',
    'a fear of being exposed',
    'a fear of losing control',
    'a sudden unease',
    'a tender caution',
    'a wave of doubt',
    'an internal warning',
    'a moment of guardedness',
  ],
  Anger: [
    'a sharp frustration',
    'an inner sting',
    'a heated moment',
    'a pressure point',
    'a forceful reaction',
    'a sense of being wronged',
    'a strong pushback',
    'a burst of impatience',
    'a feeling of unfairness',
    'a hot wave of tension',
    'a wound that flared',
    'a deep irritation',
    'a hard edge of anger',
    'a sudden clash',
    'a charged response',
    'a moment of resistance',
    'a clash of needs',
    'a pointed hurt',
    'a burst of frustration',
    'an overload of tension',
  ],
  Disgust: [
    'a strong sense of aversion',
    'a turn away from something',
    'a difficult discomfort',
    'a sharp reaction',
    'a feeling of recoil',
    'a moment of rejection',
    'a deep unease',
    'a strong distaste',
    'a wave of repulsion',
    'a sudden discomfort',
    'a troubling sensory reaction',
    'a deep objection',
    'a discomfort with what is present',
    'a sense of contamination',
    'a strong inner resistance',
    'a recoil from pressure',
    'a clear boundary being felt',
    'a feeling of being unsettled',
    'a reaction against what feels wrong',
    'a strong refusal',
  ],
};

export const REFLECTIONS_BY_EMOTION: Record<EmotionId, Reflection[]> = {
  Happiness: themesByEmotion.Happiness.map((theme, index) => createReflection('Happiness', theme, index)),
  Sadness: themesByEmotion.Sadness.map((theme, index) => createReflection('Sadness', theme, index)),
  Fear: themesByEmotion.Fear.map((theme, index) => createReflection('Fear', theme, index)),
  Anger: themesByEmotion.Anger.map((theme, index) => createReflection('Anger', theme, index)),
  Disgust: themesByEmotion.Disgust.map((theme, index) => createReflection('Disgust', theme, index)),
};

export const getRandomReflection = (emotion: EmotionId, previousIndex?: number): Reflection => {
  const pool = REFLECTIONS_BY_EMOTION[emotion];
  if (!pool.length) {
    return { sections: [] };
  }

  const maxAttempts = 8;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const index = Math.floor(Math.random() * pool.length);
    if (previousIndex === undefined || index !== previousIndex) {
      return pool[index];
    }
  }

  return pool[0];
};
