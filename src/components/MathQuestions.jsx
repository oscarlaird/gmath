import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import 'mathlive';
import { useNavigate } from 'react-router-dom';
import QuestionItem from './QuestionItem.jsx';

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-6 border rounded-lg overflow-hidden">
      <button 
        className="w-full p-3 bg-gray-100 flex justify-between items-center hover:bg-gray-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium text-lg">{title}</h3>
        <span className="text-xl">
          {isOpen ? '▼' : '►'}
        </span>
      </button>
      
      {isOpen && (
        <div className="p-3">
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch homework questions and previous answers
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch homework questions
        const response = await fetch('/homework.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load homework: ${response.statusText}`);
        }
        
        const homeworkQuestions = await response.json();
        console.log("Fetched questions:", homeworkQuestions);
        setQuestions(homeworkQuestions);
        
        // Sort questions into active and overdue
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset hours to compare just the date
        
        const active = [];
        const overdue = [];
        
        homeworkQuestions.forEach(question => {
          const dueDate = new Date(question.due_on);
          
          if (dueDate < today) {
            overdue.push(question);
          } else {
            active.push(question);
          }
        });
        
        console.log("Active questions:", active);
        console.log("Overdue questions:", overdue);
        
        setActiveQuestions(active);
        setOverdueQuestions(overdue);
        
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
        .eq('stud_id', studId);
      
      if (error) {
        console.error('Error fetching previous answers:', error);
        return;
      }
      
      console.log("Raw responses from Supabase:", data);
      
      // Process the response data
      if (data && data.length > 0) {
        const prevAnswersMap = {};
        
        // Each hw_response now contains a single answer for a single question
        data.forEach(response => {
          // The answer column is now "answer" instead of "answers"
          const answer = response.answer;
          
          if (answer && typeof answer === 'object' && answer.question_id !== undefined) {
            const questionId = answer.question_id;
            
            console.log(`Processing answer for question ${questionId}:`, answer);
            
            if (!prevAnswersMap[questionId]) {
              prevAnswersMap[questionId] = [];
            }
            
            prevAnswersMap[questionId].push({
              ...answer,
              created_at: response.created_at
            });
          } else {
            console.warn("Skipping malformed answer record:", response);
          }
        });
        
        // Sort answers by date (newest first)
        Object.keys(prevAnswersMap).forEach(qId => {
          prevAnswersMap[qId].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
        });
        
        console.log("Processed previous answers by question ID:", prevAnswersMap);
        setPreviousAnswers(prevAnswersMap);
      } else {
        console.log("No previous answers found");
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
      
      // Make sure we have a valid question object with all required fields
      if (!question.correctAnswer) {
        console.error(`Question with ID ${questionId} has no correctAnswer field`, question);
        setSubmittingQuestion(null);
        return;
      }
      
      const userAnswer = answers[questionId];
      const isCorrect = checkFuzzyMatch(userAnswer, question.correctAnswer);
      
      // Prepare feedback for this question
      const newFeedback = {
        status: isCorrect ? 'success' : 'error',
        message: isCorrect 
          ? 'Correct! Well done.' 
          : `Incorrect. The correct answer is ${question.correctAnswer}.`
      };
      
      setFeedback(prev => ({
        ...prev,
        [questionId]: newFeedback
      }));
      
      // Prepare the answer record
      const answerRecord = {
        question_id: question.id,
        question_text: question.question,
        book_reference: question.bookNumber,
        user_answer: userAnswer,
        correct_answer: question.correctAnswer.toString(),
        is_correct: isCorrect,
        attempt: 1 // Since we're not tracking second chances per question anymore
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
        
        // Update the previous answers state
        setPreviousAnswers(prev => {
          const updatedPrev = { ...prev };
          
          // Ensure we have a valid question ID
          if (!questionId || questionId === undefined) {
            console.error("Cannot update previous answers: questionId is undefined");
            return prev;
          }
          
          if (!updatedPrev[questionId]) {
            updatedPrev[questionId] = [];
          }
          
          // Add the new answer to the beginning of the array
          updatedPrev[questionId] = [
            {
              ...answerRecord,
              created_at: responseData.created_at
            },
            ...updatedPrev[questionId]
          ];
          
          console.log(`Updated previous answers for question ${questionId}:`, updatedPrev[questionId]);
          return updatedPrev;
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmittingQuestion(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading homework questions...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Math Problems</h2>
      </div>
      
      {activeQuestions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Active Problems</h3>
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