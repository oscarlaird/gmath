// Simple test for the API endpoint
import fetch from 'node-fetch';

// Test the API endpoint
async function testApiEndpoint() {
  const API_URL = 'http://localhost:3001/gmath_embed/api/grade';
  
  // Test cases
  const testCases = [
    {
      name: 'Exact Match',
      userAnswer: '4',
      correctAnswer: '4',
      acceptableAnswers: [],
      expectedResult: true
    },
    {
      name: 'Acceptable Answer',
      userAnswer: '2+2',
      correctAnswer: '4',
      acceptableAnswers: ['2+2', '2*2'],
      expectedResult: true
    },
    {
      name: 'Incorrect Answer',
      userAnswer: '5',
      correctAnswer: '4',
      acceptableAnswers: [],
      expectedResult: false
    }
  ];
  
  // Run each test case
  for (const test of testCases) {
    console.log(`\n=== Testing: ${test.name} ===`);
    console.log(`User answer: "${test.userAnswer}"`);
    console.log(`Correct answer: "${test.correctAnswer}"`);
    if (test.acceptableAnswers.length > 0) {
      console.log(`Acceptable answers: ${JSON.stringify(test.acceptableAnswers)}`);
    }
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAnswer: test.userAnswer,
          correctAnswer: test.correctAnswer,
          acceptableAnswers: test.acceptableAnswers
        })
      });
      
      if (!response.ok) {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`API Response: ${JSON.stringify(data)}`);
      
      if (data.isCorrect === test.expectedResult) {
        console.log(`✅ Test passed!`);
      } else {
        console.log(`❌ Test failed! Expected ${test.expectedResult}, got ${data.isCorrect}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Run the tests
testApiEndpoint().catch(error => {
  console.error('Error running tests:', error);
});
