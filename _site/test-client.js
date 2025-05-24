// Client-side test script for the grading API

// Function to test the API endpoint
async function testGradeAPI(userAnswer, correctAnswer, acceptableAnswers = []) {
  console.log(`Testing API with:\nUser answer: ${userAnswer}\nCorrect answer: ${correctAnswer}`);
  if (acceptableAnswers.length > 0) {
    console.log(`Acceptable answers: ${JSON.stringify(acceptableAnswers)}`);
  }
  
  try {
    const response = await fetch('/api/grade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAnswer,
        correctAnswer,
        acceptableAnswers
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API Response: ${JSON.stringify(data)}`);
    return data.isCorrect;
  } catch (error) {
    console.error('Error calling grade API:', error);
    return null;
  }
}

// Add this to your browser console to test
window.testGradeAPI = testGradeAPI;

/*
  HOW TO USE:
  1. Open your browser console on your site
  2. Copy and paste this entire file into the console
  3. Run tests like this:
     
     // Test exact match
     testGradeAPI('4', '4')
     
     // Test with acceptable answers
     testGradeAPI('2+2', '4', ['2+2', '2*2'])
     
     // Test OpenAI fallback
     testGradeAPI('four', '4')
*/
