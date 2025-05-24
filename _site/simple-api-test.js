// Simple API test that tries different URL patterns
import fetch from 'node-fetch';

// Test function
async function testUrl(url, userAnswer = '4', correctAnswer = '4') {
  console.log(`\nTesting URL: ${url}`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAnswer,
        correctAnswer,
        acceptableAnswers: []
      })
    });
    
    if (!response.ok) {
      console.log(`❌ Status: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`✅ Success! Response: ${JSON.stringify(data)}`);
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

// Run tests with different URL patterns
async function runTests() {
  // URLs to test
  const urls = [
    'http://localhost:3001/api/grade',
    'http://localhost:3001/gmath_embed/api/grade',
    // Try with and without trailing slash
    'http://localhost:3001/api/grade/',
    'http://localhost:3001/gmath_embed/api/grade/'
  ];
  
  let foundWorkingUrl = false;
  
  for (const url of urls) {
    const success = await testUrl(url);
    if (success) {
      console.log(`\n✅ Found working URL: ${url}`);
      foundWorkingUrl = true;
    }
  }
  
  if (!foundWorkingUrl) {
    console.log('\n❌ No working URL found. API endpoint may not be properly configured.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});
