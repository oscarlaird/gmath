import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import 'mathlive';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QuestionItem from './QuestionItem.jsx';
import HomeworkNavigation from './HomeworkNavigation.jsx';
import FeedbackPanel from './FeedbackPanel.jsx';

function MathQuestions({ studentId, ipAddress }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [secondChance, setSecondChance] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch homework questions based on slug
  useEffect(() => {
    const fetchHomework = async () => {
      setLoading(true);
      try {
        const homeworkSlug = slug || 'hw1';
        const response = await fetch(`/homeworks/${homeworkSlug}.json`);
        
        if (!response.ok) {
          throw new Error(`Failed to load homework: ${response.statusText}`);
        }
        
        const homeworkQuestions = await response.json();
        setQuestions(homeworkQuestions);
        
        // Initialize answers object
        const initialAnswers = {};
        homeworkQuestions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
        setError(null);
      } catch (err) {
        console.error('Error loading homework:', err);
        setError('Failed to load homework questions. Please try again later.');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomework();
  }, [slug]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
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
        question_text: question.question,
        book_reference: question.bookNumber,
        user_answer: userAnswer,
        correct_answer: question.correctAnswer.toString(),
        is_correct: isCorrect,
        attempt: secondChance[question.id] ? 2 : 1
      };
    });
    
    // Log to Supabase
    const responseData = {
      stud_id: studentId,
      created_at: new Date().toISOString(),
      ip: ipAddress || window.clientInformation?.userAgentData?.platform || navigator.userAgent,
      homework_slug: slug || 'hw1',
      answers: questionResults,
    };
    
    await logResponseToSupabase(responseData);
    
    setFeedback(newFeedback);
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const goToHome = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="text-center py-8">Loading homework questions...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Math Homework</h2>
        <button
          onClick={goToHome}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Home
        </button>
      </div>
      
      <HomeworkNavigation currentSlug={slug} />
      
      {questions.map(question => (
        <QuestionItem
          key={question.id}
          question={question}
          answer={answers[question.id]}
          feedback={feedback[question.id]}
          onAnswerChange={(value) => handleAnswerChange(question.id, value)}
        />
      ))}
      
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || questions.length === 0}
        className={`w-full ${isSubmitting || questions.length === 0 ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answers'}
      </button>
      
      {submitted && <FeedbackPanel />}
    </div>
  );
}

// Helper functions moved to separate utility file
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

export default MathQuestions; 