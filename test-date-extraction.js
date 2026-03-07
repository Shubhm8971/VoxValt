const { extractDateFromText } = require('./lib/date-extractor.ts');

const testCases = [
  'Call tomorrow',
  'Meeting next Monday', 
  'Pay bill in 3 days',
  'Review this Friday',
  'Follow up next week',
  'Send email today',
  'Call in 2 weeks',
  'Meeting tomorrow at 3pm'
];

console.log('=== Date Extraction Test ===');
testCases.forEach(testCase => {
  try {
    const result = extractDateFromText(testCase);
    console.log(`"${testCase}" →`, result);
  } catch (e) {
    console.log(`"${testCase}" → Error:`, e.message);
  }
});
