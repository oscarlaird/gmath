import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import 'mathlive';
import { useNavigate } from 'react-router-dom';
import QuestionItem from './QuestionItem.jsx';
import { gradeAnswer } from '../utils/llmGrading';

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-6 border border-[#d1d1c7]">
      <button 
        className="w-full p-3 bg-[#f0f0e8] flex justify-between items-center hover:bg-[#e5e5dc] transition-colors border-b border-[#d1d1c7]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-normal text-lg text-[#5a7d7c]">{title}</h3>
        <span className="text-[#6b7280]">
          {isOpen ? '▼' : '►'}
        </span>
      </button>
      
      {isOpen && (
        <div className="p-0">
          {children}
        </div>
      )}
    </div>
  );
}

function MathQuestions({ studentId }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [overdueQuestions, setOverdueQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [previousAnswers, setPreviousAnswers] = useState({});
  const [submittingQuestion, setSubmittingQuestion] = useState(null);
  const [submittingAll, setSubmittingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch homework questions and previous answers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch homework questions
        const response = await fetch('/gmath_embed/homework.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load homework: ${response.statusText}`);
        }
        
        const homeworkQuestions = await response.json();
        console.log("Fetched questions:", homeworkQuestions);
        setQuestions(homeworkQuestions);
        
        const sortQuestions = (questions) => {
          return questions.sort((a, b) => {
            // First compare by due date
            const dateA = new Date(a.due_on);
            const dateB = new Date(b.due_on);
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            
            // If dates are equal, sort by bookNumber
            return a.bookNumber.localeCompare(b.bookNumber, undefined, {numeric: true});
          });
        };

        const active = [];
        const overdue = [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset hours to compare just the date
        
        homeworkQuestions.forEach(question => {
          const dueDate = new Date(question.due_on);
          
          if (dueDate < today) {
            overdue.push(question);
          } else {
            active.push(question);
          }
        });
        
        // Sort both arrays
        setActiveQuestions(sortQuestions(active));
        setOverdueQuestions(sortQuestions(overdue));
        
        // Initialize answers object
        const initialAnswers = {};
        homeworkQuestions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setAnswers(initialAnswers);
        
        // Fetch previous answers from Supabase if student is logged in
        if (studentId) {
          await fetchPreviousAnswers(studentId);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load homework data. Please try again later.');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId]);
  
  // Function to fetch previous answers from Supabase
  const fetchPreviousAnswers = async (studId) => {
    try {
      console.log("Fetching previous answers for student ID:", studId);
      
      const { data, error } = await supabase
        .from('hw_responses')
        .select('*')
        .eq('stud_id', studId)
        .order('created_at', { ascending: false }); // Get most recent first
      
      if (error) {
        console.error('Error fetching previous answers:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const prevAnswersMap = {};
        
        data.forEach(response => {
          const answer = response.answer;
          
          if (answer && typeof answer === 'object' && answer.question_id !== undefined) {
            const questionId = answer.question_id;
            
            if (!prevAnswersMap[questionId]) {
              prevAnswersMap[questionId] = [];
            }
            
            // Only add if we don't already have a correct answer for this question
            const hasCorrectAnswer = prevAnswersMap[questionId].some(a => a.is_correct);
            if (!hasCorrectAnswer || answer.is_correct) {
              prevAnswersMap[questionId].unshift({
                user_answer: answer.user_answer,
                is_correct: answer.is_correct,
                created_at: response.created_at
              });
            }
          }
        });
        
        console.log("Processed previous answers by question ID:", prevAnswersMap);
        setPreviousAnswers(prevAnswersMap);
      }
    } catch (err) {
      console.error('Exception fetching previous answers:', err);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Handle individual question submission
  const handleQuestionSubmit = async (questionId) => {
    if (!questionId) {
      console.error("Attempted to submit answer with undefined questionId");
      return;
    }
    
    setSubmittingQuestion(questionId);
    
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        console.error(`Question with ID ${questionId} not found`);
        setSubmittingQuestion(null);
        return;
      }
      
      if (!question.correctAnswer) {
        console.error(`Question ${questionId} missing correctAnswer`);
        setSubmittingQuestion(null);
        return;
      }
      
      const userAnswer = answers[questionId];
      if (!userAnswer) {
        console.error(`No answer provided for question ${questionId}`);
        setSubmittingQuestion(null);
        return;
      }
      
      // Use LLM grading instead of fuzzy matching
      const isCorrect = await gradeAnswer(userAnswer, question.correctAnswer, questionId);
      
      // Update feedback without showing the correct answer
      setFeedback(prev => ({
        ...prev,
        [questionId]: {
          isCorrect,
          status: isCorrect ? 'success' : 'error',
          message: isCorrect ? 'Correct!' : 'Incorrect. Please try again.'
        }
      }));
      
      // Create answer record for Supabase
      const answerRecord = {
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
      };
      
      console.log(`Submitting answer for question ${questionId}:`, answerRecord);
      
      // Log to Supabase - note that we're now storing a single answer per record
      const responseData = {
        stud_id: studentId,
        created_at: new Date().toISOString(),
        ip: window.clientInformation?.userAgentData?.platform || navigator.userAgent,
        answer: answerRecord, // Changed from 'answers' to 'answer'
      };
      
      // Log the full response data to verify the structure
      console.log("Full response data to be sent to Supabase:", JSON.stringify(responseData, null, 2));
      
      const success = await logResponseToSupabase(responseData);
      
      if (success) {
        console.log("Successfully logged answer to Supabase");
        
        // Update the previous answers state with the actual Supabase response
        setPreviousAnswers(prev => {
          const questionAnswers = prev[questionId] || [];
          return {
            ...prev,
            [questionId]: [
              ...questionAnswers,
              {
                user_answer: userAnswer,
                is_correct: isCorrect,
                created_at: responseData.created_at
              }
            ]
          };
        });
      }
    } catch (error) {
      console.error('Error in LLM check:', error);
    } finally {
      setSubmittingQuestion(null);
    }
  };

  const handleSubmitAll = async () => {
    setSubmittingAll(true);
    
    try {
      // Get all questions that have answers
      const questionsToSubmit = questions.filter(q => answers[q.id] && !feedback[q.id]?.isCorrect);
      
      // Submit each question sequentially
      for (const question of questionsToSubmit) {
        await handleQuestionSubmit(question.id);
      }
    } catch (error) {
      console.error('Error submitting all answers:', error);
    } finally {
      setSubmittingAll(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-[#6b7280]">Loading homework questions...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-[#e76f51]">{error}</div>;
  }

  // Render function for question items
  const renderQuestionItems = (questionList) => {
    return questionList.map(question => (
      <QuestionItem
        key={question.id}
        question={question}
        answer={answers[question.id]}
        feedback={feedback[question.id]}
        previousAnswers={previousAnswers[question.id] || []}
        onAnswerChange={(value) => handleAnswerChange(question.id, value)}
        onSubmit={handleQuestionSubmit}
        isSubmitting={submittingQuestion === question.id}
      />
    ));
  };

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-[#e5e5dc] flex justify-between items-center">
        <h2 className="text-xl font-normal text-[#5a7d7c]">Math Problems</h2>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1">
            {Object.entries(
              activeQuestions.reduce((acc, q) => {
                const dueDate = new Date(q.due_on).toISOString().split('T')[0];
                if (!acc[dueDate]) {
                  acc[dueDate] = { total: 0, correct: 0 };
                }
                acc[dueDate].total++;
                if (previousAnswers[q.id]?.some(answer => answer.is_correct)) {
                  acc[dueDate].correct++;
                }
                return acc;
              }, {})
            ).map(([date, { correct, total }]) => (
              <div key={date} className="text-sm text-gray-600">
                {date}: {correct} / {total} correct
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmitAll}
            disabled={submittingAll || questions.every(q => feedback[q.id]?.isCorrect)}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              submittingAll || questions.every(q => feedback[q.id]?.isCorrect)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submittingAll ? 'Submitting...' : 'Submit All'}
          </button>
        </div>
      </div>
      
      {activeQuestions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-normal mb-4 text-[#5a7d7c]">Active Problems</h3>
          {renderQuestionItems(activeQuestions)}
        </div>
      )}
      
      {overdueQuestions.length > 0 && (
        <CollapsibleSection title={`Overdue Problems (${overdueQuestions.length})`} defaultOpen={false}>
          {renderQuestionItems(overdueQuestions)}
        </CollapsibleSection>
      )}
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
    console.log("Sending to Supabase:", responseData);
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
