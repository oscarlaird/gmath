import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import 'mathlive';
import questionTemplates from '../data/questionTemplates.json';

function MathQuestions({ studentId, ipAddress }) {
  // Generate different problems based on student ID
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [secondChance, setSecondChance] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate questions based on student ID
  useEffect(() => {
    // Simple algorithm to generate different questions based on student ID
    const lastDigit = parseInt(studentId.slice(-1)) || 3;
    const secondLastDigit = parseInt(studentId.slice(-2, -1)) || 2;
    
    // Generate questions from templates
    const generatedQuestions = questionTemplates.map(template => {
      // Create variable substitutions
      const variables = {
        a: lastDigit + 2,
        b: secondLastDigit,
        c: lastDigit * 5
      };
      
      // Replace variables in template
      const text = template.template.replace(/\{([a-z])\}/g, (match, variable) => {
        if (variable === 'a' && template.id === 3) {
          return (variables[variable] / 10).toFixed(1); // Format probability values
        }
        if (variable === 'b' && template.id === 3) {
          return (variables[variable] / 10).toFixed(1); // Format probability values
        }
        if (variable === 'b' && template.id === 2) {
          return variables[variable] + 1; // For exponent in calculus problem
        }
        return variables[variable];
      });
      
      // Calculate correct answer based on formula
      let correctAnswer;
      const formula = template.correctAnswerFormula.replace(/\{([a-z])\}/g, (match, variable) => {
        if (variable === 'a' && template.id === 3) {
          return variables[variable] / 10; // Use decimal for calculation
        }
        if (variable === 'b' && template.id === 3) {
          return variables[variable] / 10; // Use decimal for calculation
        }
        if (variable === 'b' && template.id === 2) {
          return variables[variable] + 1; // For exponent in calculus problem
        }
        return variables[variable];
      });
      
      try {
        // For calculus problems, we return the formula as a string
        if (template.id === 2) {
          correctAnswer = `${lastDigit * (secondLastDigit + 1)}x^${secondLastDigit} + ${secondLastDigit}`;
        } else {
          // For other problems, evaluate the formula
          correctAnswer = eval(formula);
        }
      } catch (error) {
        console.error("Error evaluating formula:", error);
        correctAnswer = "Error";
      }
      
      return {
        id: template.id,
        text,
        correctAnswer,
        type: template.type
      };
    });
    
    setQuestions(generatedQuestions);
    
    // Initialize answers object
    const initialAnswers = {};
    generatedQuestions.forEach(q => {
      initialAnswers[q.id] = '';
    });
    setAnswers(initialAnswers);
    
  }, [studentId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const checkFuzzyMatch = (userAnswer, correctAnswer) => {
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

  const logResponseToSupabase = async (responseData) => {
    try {
      const { data, error } = await supabase
        .from('hw_responses')
        .insert([responseData]);
      
      if (error) {
        console.error('Error logging response to Supabase:', error);
        return false;
      }
      
      console.log('Response logged successfully:', data);
      return true;
    } catch (err) {
      console.error('Exception when logging to Supabase:', err);
      return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const newFeedback = {};
    let allCorrect = true;
    
    // Prepare results for each question
    const questionResults = questions.map(question => {
      const userAnswer = answers[question.id];
      const isCorrect = checkFuzzyMatch(userAnswer, question.correctAnswer);
      
      if (!isCorrect && !secondChance[question.id]) {
        // First incorrect attempt
        newFeedback[question.id] = {
          status: 'warning',
          message: 'Your answer may not be correct. Please check and try again.'
        };
        setSecondChance(prev => ({...prev, [question.id]: true}));
        allCorrect = false;
      } else if (!isCorrect) {
        // Second incorrect attempt
        newFeedback[question.id] = {
          status: 'error',
          message: `Incorrect. The correct answer is ${question.correctAnswer}.`
        };
        allCorrect = false;
      } else {
        // Correct answer
        newFeedback[question.id] = {
          status: 'success',
          message: 'Correct! Well done.'
        };
      }
      
      return {
        question_id: question.id,
        question_text: question.text,
        user_answer: userAnswer,
        correct_answer: question.correctAnswer.toString(),
        is_correct: isCorrect,
        attempt: secondChance[question.id] ? 2 : 1
      };
    });
    
    // Log to Supabase
    const timestamp = new Date().toISOString();
    const responseData = {
      stud_id: studentId,
      created_at: timestamp,
      ip: ipAddress || window.clientInformation?.userAgentData?.platform || navigator.userAgent,
      answers: questionResults,
    };
    
    await logResponseToSupabase(responseData);
    
    setFeedback(newFeedback);
    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Your Math Homework</h2>
      
      {questions.map(question => (
        <div key={question.id} className="mb-8 p-4 border rounded-lg bg-gray-50">
          <p className="mb-2 font-medium">{question.id}. {question.text}</p>
          
          <div className="mb-4">
            <math-field
              value={answers[question.id]}
              onInput={(evt) => handleAnswerChange(question.id, evt.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minHeight: '40px' }}
            ></math-field>
          </div>
          
          {feedback[question.id] && (
            <div className={`mt-2 text-sm ${
              feedback[question.id].status === 'success' ? 'text-green-600' : 
              feedback[question.id].status === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {feedback[question.id].message}
            </div>
          )}
        </div>
      ))}
      
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answers'}
      </button>
      
      {submitted && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800">Homework Feedback</h3>
          <p className="text-sm text-blue-700 mt-1">
            Remember to practice these concepts daily. If you're struggling with any problems, 
            please review the relevant sections in your textbook.
          </p>
        </div>
      )}
    </div>
  );
}

export default MathQuestions; 