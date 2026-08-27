// The 16 fixed questions that every founder answers
export const QUESTIONS = [
  { slug: 'pitch', seg: 'pitch', stage: 'Starting out', q: 'What is it, in thirty seconds?' },
  { slug: 'quit', seg: 'spark', stage: 'Starting out', q: 'What made you finally start?' },
  { slug: 'first-users', seg: 'validation', stage: 'Starting out', q: 'How did you get your first ten users?' },
  { slug: 'audience', seg: 'audience', stage: 'Starting out', q: 'How did you build an audience before you had a product?' },
  { slug: 'wrong', seg: 'proto', stage: 'Building', q: 'What did you build first that turned out to be wrong?' },
  { slug: 'longest', seg: 'build', stage: 'Building', q: 'What took far longer than you expected?' },
  { slug: 'beta', seg: 'beta', stage: 'Building', q: 'What did your first testers break?' },
  { slug: 'gtm', seg: 'gtm', stage: 'Launching', q: 'How did you actually take it to market?' },
  { slug: 'launch-day', seg: 'launch', stage: 'Launching', q: 'What happened on launch day?' },
  { slug: 'first-dollar', seg: 'first', stage: 'Launching', q: 'Tell me about the first time someone paid you.' },
  { slug: 'channel', seg: 'channel', stage: 'Growing', q: 'What was the first thing that worked repeatedly?' },
  { slug: 'lowest', seg: 'trouble', stage: 'Growing', q: 'What was the lowest point, and what got you past it?' },
  { slug: 'money', seg: 'money', stage: 'Growing', q: 'How are you paying rent while you build this?' },
  { slug: 'help', seg: 'team', stage: 'Growing', q: 'Who was the first person you brought in?' },
  { slug: 'scale', seg: 'scale', stage: 'The other side', q: 'What broke when it got bigger?' },
  { slug: 'next', seg: 'next', stage: 'The other side', q: 'What does the next year look like?' },
] as const;

export type QuestionSlug = typeof QUESTIONS[number]['slug'];
export type Stage = typeof QUESTIONS[number]['stage'];

export const STAGES = ['Starting out', 'Building', 'Launching', 'Growing', 'The other side'] as const;

export function getQuestion(slug: string) {
  return QUESTIONS.find((q) => q.slug === slug);
}

export function getQuestionsByStage(stage: Stage) {
  return QUESTIONS.filter((q) => q.stage === stage);
}
