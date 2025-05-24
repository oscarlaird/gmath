// This is a simple in-memory cache that persists while the server is running
const acceptableAnswersCache = new Map();

// Initialize with any pre-known acceptable answers
export function initializeCache(preloadedAnswers = {}) {
  for (const [questionId, answers] of Object.entries(preloadedAnswers)) {
    acceptableAnswersCache.set(questionId, new Set(answers));
  }
}

export function getAcceptableAnswers(questionId) {
  return Array.from(acceptableAnswersCache.get(questionId) || new Set());
}

export function addAcceptableAnswer(questionId, answer) {
  if (!acceptableAnswersCache.has(questionId)) {
    acceptableAnswersCache.set(questionId, new Set());
  }
  acceptableAnswersCache.get(questionId).add(answer);
  
  // Optional: Log the updated cache for debugging
  console.log(`Added acceptable answer for question ${questionId}: ${answer}`);
  return true;
}

// Optional: Save cache to file to persist between server restarts
export function saveCache() {
  const serializedCache = {};
  for (const [questionId, answers] of acceptableAnswersCache.entries()) {
    serializedCache[questionId] = Array.from(answers);
  }
  return serializedCache;
} 