import React, { useEffect } from 'react';
import 'mathlive';

function QuestionItem({ question, answer, feedback, onAnswerChange, previousAnswers, onSubmit, isSubmitting }) {
  // Add useEffect to handle paste prevention specifically for math fields
  useEffect(() => {
    const preventPaste = (e) => {
      e.preventDefault();
    };

    // Target all math-field elements
    const mathFields = document.querySelectorAll('math-field');
    mathFields.forEach(field => {
      field.addEventListener('paste', preventPaste);
      // Also prevent paste on the shadow DOM input if it exists
      field.shadowRoot?.querySelector('input')?.addEventListener('paste', preventPaste);
    });

    // Cleanup function to remove event listeners
    return () => {
      mathFields.forEach(field => {
        field.removeEventListener('paste', preventPaste);
        field.shadowRoot?.querySelector('input')?.removeEventListener('paste', preventPaste);
      });
    };
  }, []); // Empty dependency array means this runs once on mount

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
    <div className={`mb-8 border ${overdueStatus ? 'border-[#edcdc2] bg-[#fdf5f0]' : 'border-[#d1d1c7] bg-[#fafaf5]'}`}>
      <div className="p-4 border-b border-[#e5e5dc]">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-normal text-lg text-[#5a7d7c]">{question.bookNumber}</h3>
            {question.due_on && (
              <span className={`text-sm ${overdueStatus ? 'text-[#e76f51]' : 'text-[#6b7280]'}`}>
                Due: {formatDueDate(question.due_on)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <math-field
          value={answer}
          onInput={(evt) => onAnswerChange(evt.target.value)}
          className="w-full px-4 py-3 border border-[#d1d1c7] focus:outline-none focus:border-[#85b7b6]"
          style={{ minWidth: '100%', minHeight: '48px' }}
        ></math-field>
      </div>
      
      <div className="p-4 border-t border-[#e5e5dc] flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <button
          onClick={() => onSubmit(question.id)}
          disabled={isSubmitting}
          className={`px-6 py-2 ${isSubmitting 
            ? 'bg-[#b3c8c8] cursor-not-allowed' 
            : 'bg-[#85b7b6] hover:bg-[#5a7d7c]'} text-white border-none transition-colors`}
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
            feedback.status === 'success' ? 'text-[#588157]' : 
            feedback.status === 'warning' ? 'text-[#e9c46a]' : 'text-[#e76f51]'
          }`}>
            {feedback.message}
          </div>
        )}
      </div>
      
      {previousAnswers && previousAnswers.length > 0 && (
        <div className="p-4 border-t border-[#e5e5dc]">
          <h4 className="text-sm font-normal mb-2 text-[#5a7d7c]">Previous Answers:</h4>
          <ul className="text-sm">
            {[...previousAnswers]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((prev, index) => (
              <li key={index} className="mb-2 pb-2 border-b border-[#e5e5dc] last:border-0 last:mb-0 last:pb-0">
                <div className="flex items-center">
                  <div className={`w-4 h-4 inline-block mr-2 ${prev.is_correct ? 'bg-[#588157]' : 'bg-[#e76f51]'}`}></div>
                  <math-field read-only>{prev.user_answer}</math-field>
                  <span className="ml-2 text-xs text-[#6b7280]">
                    ({new Date(prev.created_at).toLocaleString('en-US', {
                      timeZone: 'Asia/Shanghai',
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Wrap with React.memo for performance
export default React.memo(QuestionItem, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.answer === nextProps.answer &&
    prevProps.isSubmitting === nextProps.isSubmitting &&
    JSON.stringify(prevProps.feedback) === JSON.stringify(nextProps.feedback) &&
    JSON.stringify(prevProps.previousAnswers) === JSON.stringify(nextProps.previousAnswers)
  );
}); 