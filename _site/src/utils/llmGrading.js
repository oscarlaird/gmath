import { checkFuzzyMatch } from './mathUtils.js';
import { measureTime } from './performance.js';
import { OpenAI } from 'openai';


const openai = new OpenAI({
  baseURL:"https://mhiwwusrwyzmppnmcjzm.supabase.co/functions/v1/proxy_openai/v1", 
  apiKey: "sk-proj-0123456789abcdef0123456789abcdef",
  dangerouslyAllowBrowser: true
});

// Add a response cache to avoid repeated API calls
const responseCache = new Map();

const systemprompt = `You are a precise mathematical answer validator. You only respond with 'CORRECT' or 'INCORRECT'. You are a math teacher grading a student's answer. Your task is to determine if the student's answer is mathematically equivalent to the correct answer.

Consider the following:
VERY IMPORTANT: Different but equivalent set ordering (e.g., '{1, 2, 3}' and '{3, 1, 2}' ARE BOTH CORRECT)
1. Different but equivalent mathematical expressions (e.g., '2x' and 'x + x')
2. Different but equivalent typesetting (e.g., '2x' and '2*x')
3. Accept any reasonable mathematical notation, including LaTeX.

Respond with ONLY 'CORRECT' or 'INCORRECT'. Do not include any explanation or additional text.`

const checkWithLLM = async (userAnswer, correctAnswer) => {
  const userprompt = `Student's answer: ${userAnswer}\nCorrect answer: ${correctAnswer}`

  const messages = [
    {
      role: "system",
      content: systemprompt
    },
    { role: "user", content: userprompt }
  ]
  console.log(messages)

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    temperature: 0,
    max_tokens: 10
  });
  
  const result = response.choices[0].message.content.trim().toUpperCase() === "CORRECT";
  console.log(`OpenAI API response: ${result ? 'CORRECT' : 'INCORRECT'}`);
  return result;
}

export const gradeAnswer = async (userAnswer, correctAnswer, questionId) => {
  const startTimer = measureTime('gradeAnswer');
  
  try {
    console.log('Starting gradeAnswer with:', { userAnswer, correctAnswer, questionId });
    
    // First try fuzzy matching
    const fuzzyResult = checkFuzzyMatch(userAnswer, correctAnswer);
    console.log('Fuzzy match result:', fuzzyResult);
    
    if (fuzzyResult) {
      return true;
    }
    
    // Finally, try LLM
    console.log('Attempting LLM check...');
    const llmResult = await checkWithLLM(userAnswer, correctAnswer);
    console.log('LLM check result:', llmResult);
    
    
    return llmResult;
  } catch (error) {
    console.error('Error in gradeAnswer:', error);
    // Fall back to fuzzy matching if everything fails
    return checkFuzzyMatch(userAnswer, correctAnswer);
  } finally {
    startTimer();
  }
};