const { chunkCode } = require('./backend/utils/chunkCode.js');

// Test various arrow function patterns
const testCases = [
  {
    name: 'Simple arrow function',
    code: 'const simple = (x) => { return x; };',
    expected: true
  },
  {
    name: 'Arrow function with TypeScript types',
    code: 'const typed = (x: number): number => { return x; };',
    expected: false // This is currently not supported by the regex
  },
  {
    name: 'Arrow function with complex TypeScript types',
    code: 'const complex = (x: string, y: number): Promise<string> => { return Promise.resolve(x); };',
    expected: false // This is currently not supported by the regex
  },
  {
    name: 'Single line arrow function',
    code: 'const single = x => x * 2;',
    expected: true
  }
];

console.log('🔍 Testing arrow function patterns...\n');

testCases.forEach(testCase => {
  const chunks = chunkCode(testCase.code, 'test.ts');
  const functions = chunks.filter(c => c.type === 'function');
  const found = functions.length > 0;
  
  console.log(`Test: ${testCase.name}`);
  console.log(`Code: ${testCase.code}`);
  console.log(`Expected to be found: ${testCase.expected}`);
  console.log(`Actually found: ${found}`);
  console.log(`Status: ${found === testCase.expected ? '✅ PASS' : '❌ FAIL'}`);
  console.log('---');
});