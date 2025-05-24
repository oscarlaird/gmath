import { checkFuzzyMatch } from './utils/mathUtils.js';
import { gradeAnswer } from './utils/llmGrading.js';

// Test cases
const testCases = [
  {
    userAnswer: "\\frac{1}{2}",
    correctAnswer: "0.5",
    expected: true,
    description: "Numerical equivalence"
  }
];

async function runTests() {
  console.log("Testing LLM grading system...\n");
  
  // Test LLM grading
  console.log("\nTesting LLM grading:");
  for (const test of testCases) {
    try {
      const result = await gradeAnswer(test.userAnswer, test.correctAnswer, "test-question");
      console.log(`${test.description}: ${result === test.expected ? '✅' : '❌'}`);
      console.log(`  User: ${test.userAnswer}`);
      console.log(`  Correct: ${test.correctAnswer}`);
      console.log(`  Expected: ${test.expected}, Got: ${result}\n`);
    } catch (error) {
      console.error(`Error testing ${test.description}:`, error);
    }
  }
}

// Run the tests
runTests().catch(console.error); 