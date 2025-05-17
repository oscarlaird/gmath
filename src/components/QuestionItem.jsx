import React from 'react';
import 'mathlive';

function QuestionItem({ question, answer, feedback, onAnswerChange, previousAnswers, onSubmit, isSubmitting }) {
  // Format the due date
  const formatDueDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Check if question is overdue
  const isOverdue = () => {
    if (!question.due_on) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(question.due_on);
    return dueDate < today;
  };
  
  const overdueStatus = isOverdue();
  
  return (
    <div className={`mb-8 p-6 border rounded-lg ${overdueStatus ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium text-lg">{question.bookNumber}</h3>
          {question.due_on && (
            <span className={`text-sm ${overdueStatus ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
              Due: {formatDueDate(question.due_on)}
            </span>
          )}
        </div>
      </div>
      
      <div className="mb-5">
        <math-field
          value={answer}
          onInput={(evt) => onAnswerChange(evt.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ minWidth: '100%', minHeight: '48px' }}
        ></math-field>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <button
          onClick={() => onSubmit(question.id)}
          disabled={isSubmitting}
          className={`px-6 py-3 rounded-lg font-medium text-white shadow-sm transform transition-all duration-200 
            ${isSubmitting 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow active:scale-95'
            }`}
        >
          {isSubmitting 
            ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) 
            : 'Submit Answer'
          }
        </button>
        
        {feedback && (
          <div className={`mt-3 sm:mt-0 text-sm ${
            feedback.status === 'success' ? 'text-green-600' : 
            feedback.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {feedback.message}
          </div>
        )}
      </div>
      
      {previousAnswers && previousAnswers.length > 0 && (
        <div className="mt-5 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Previous Answers:</h4>
          <ul className="text-sm space-y-2">
            {previousAnswers.map((prev, index) => (
              <li key={index} className="flex items-center bg-white p-2 rounded">
                <span className={`w-4 h-4 inline-block rounded-full mr-2 ${prev.is_correct ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="font-mono">{prev.user_answer}</span>
                <span className="ml-2 text-xs text-gray-500">
                  ({new Date(prev.created_at).toLocaleDateString()})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default QuestionItem; 