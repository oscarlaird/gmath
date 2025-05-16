import React from 'react';
import 'mathlive';

function QuestionItem({ question, answer, feedback, onAnswerChange }) {
  return (
    <div className="mb-8 p-4 border rounded-lg bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <p className="font-medium">{question.id}. {question.question}</p>
        <span className="text-sm text-gray-500 ml-2">Book: {question.bookNumber}</span>
      </div>
      
      <div className="mb-4">
        <math-field
          value={answer}
          onInput={(evt) => onAnswerChange(evt.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ minHeight: '40px' }}
        ></math-field>
      </div>
      
      {feedback && (
        <div className={`mt-2 text-sm ${
          feedback.status === 'success' ? 'text-green-600' : 
          feedback.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}

export default QuestionItem; 