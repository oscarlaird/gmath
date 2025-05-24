import { gradeWithLLM } from '../llmGrading';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAnswer, correctAnswer, acceptableAnswers = [] } = req.body;
    
    if (!userAnswer || !correctAnswer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Log grading attempt for debugging
    console.log(`Grading attempt - User answer: ${userAnswer}, Correct answer: ${correctAnswer}`);
    if (acceptableAnswers && acceptableAnswers.length > 0) {
      console.log(`Acceptable answers provided: ${JSON.stringify(acceptableAnswers)}`);
    }

    // Pass the acceptable answers to the grading function
    const isCorrect = await gradeWithLLM(userAnswer, correctAnswer, acceptableAnswers);
    
    // Log the result
    console.log(`Grading result: ${isCorrect ? 'Correct' : 'Incorrect'}`);
    
    return res.status(200).json({ isCorrect });
  } catch (error) {
    console.error('Error in grade endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 