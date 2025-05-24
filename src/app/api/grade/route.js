import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Add a response cache to avoid repeated API calls
const responseCache = new Map();

// Helper function to normalize answers for comparison
const normalizeAnswer = (answer) => {
  if (!answer) return '';
  return answer
    .toString()
    .trim()
    .toLowerCase()
    // Remove spaces around operators
    .replace(/\s*([+\-*\/=(){}\[\],])\s*/g, '$1')
    // Normalize multiplication notation
    .replace(/([0-9a-z])\s*\*\s*([0-9a-z])/g, '$1$2')
    .replace(/([0-9a-z])\s*\cdot\s*([0-9a-z])/g, '$1$2')
    // Remove unnecessary parentheses in simple cases
    .replace(/\(([0-9a-z])\)/g, '$1');
};

// Check if answers match using simple string comparison
const exactMatch = (userAnswer, correctAnswer) => {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
};

// Check if the user's answer matches any acceptable answer
const matchesAcceptableAnswer = (userAnswer, acceptableAnswers) => {
  if (!acceptableAnswers || !Array.isArray(acceptableAnswers) || acceptableAnswers.length === 0) {
    return false;
  }
  
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  return acceptableAnswers.some(answer => normalizeAnswer(answer) === normalizedUserAnswer);
};

// Use OpenAI to check if answers are mathematically equivalent
const checkWithOpenAI = async (userAnswer, correctAnswer) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",  // Using gpt-4o-mini for faster and cheaper responses
      messages: [
        {
          role: "system",
          content: "You are a precise mathematical answer validator. You only respond with 'CORRECT' or 'INCORRECT'."
        },
        { 
          role: "user", 
          content: `You are a math teacher grading a student's answer. Your task is to determine if the student's answer is mathematically equivalent to the correct answer.

Student's answer: ${userAnswer}
Correct answer: ${correctAnswer}

Consider the following:
VERY IMPORTANT: Different but equivalent set ordering (e.g., "{1, 2, 3}" and "{3, 1, 2}" ARE BOTH CORRECT)
1. Different but equivalent mathematical expressions (e.g., "2x" and "x + x")
2. Different but equivalent typesetting (e.g., "2x" and "2*x")
3. Accept any reasonable mathematical notation, including LaTeX.

Respond with ONLY "CORRECT" or "INCORRECT". Do not include any explanation or additional text.`
        }
      ],
      temperature: 0,
      max_tokens: 10
    });
    
    return response.choices[0].message.content.trim().toUpperCase() === "CORRECT";
  } catch (error) {
    console.error('Error in OpenAI grading:', error);
    return false;
  }
};

export async function POST(request) {
  try {
    const { userAnswer, correctAnswer, acceptableAnswers = [] } = await request.json();

    // Log grading attempt for debugging
    console.log(`Grading attempt - User answer: ${userAnswer}, Correct answer: ${correctAnswer}`);
    if (acceptableAnswers && acceptableAnswers.length > 0) {
      console.log(`Acceptable answers provided: ${JSON.stringify(acceptableAnswers)}`);
    }

    // Check cache first
    const cacheKey = `${userAnswer}:${correctAnswer}`;
    if (responseCache.has(cacheKey)) {
      const cachedResult = responseCache.get(cacheKey);
      console.log(`Using cached result: ${cachedResult ? 'Correct' : 'Incorrect'}`);
      return NextResponse.json({ isCorrect: cachedResult });
    }
    
    // Step 1: Check for exact match with correct answer
    if (exactMatch(userAnswer, correctAnswer)) {
      console.log('Exact match found');
      responseCache.set(cacheKey, true);
      return NextResponse.json({ isCorrect: true });
    }
    
    // Step 2: Check against acceptable answers
    if (matchesAcceptableAnswer(userAnswer, acceptableAnswers)) {
      console.log('Match found in acceptable answers');
      responseCache.set(cacheKey, true);
      return NextResponse.json({ isCorrect: true });
    }
    
    // Step 3: Fallback to OpenAI API
    console.log('No exact matches, checking with OpenAI...');
    const isCorrect = await checkWithOpenAI(userAnswer, correctAnswer);
    console.log(`OpenAI result: ${isCorrect ? 'Correct' : 'Incorrect'}`);
    responseCache.set(cacheKey, isCorrect);
    return NextResponse.json({ isCorrect });
  } catch (error) {
    console.error('Error in grade API:', error);
    return NextResponse.json({ error: 'Grading failed' }, { status: 500 });
  }
} 