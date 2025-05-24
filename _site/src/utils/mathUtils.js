// Utility functions for math homework

export const checkFuzzyMatch = (userAnswer, correctAnswer) => {
  if (typeof correctAnswer === 'number') {
    // For numerical answers, check if they're close enough
    const userNum = parseFloat(userAnswer.replace(/\s/g, ''));
    return !isNaN(userNum) && Math.abs(userNum - correctAnswer) < 0.001;
  } else {
    // For string answers, normalize and compare
    const normalizeAnswer = (ans) => ans.replace(/\s+/g, '').toLowerCase();
    return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer.toString());
  }
};

export const formatMathExpression = (expression) => {
  // This could be expanded to handle more complex formatting
  return expression;
}; 