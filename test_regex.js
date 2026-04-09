// Test regex patterns
const patterns = [
  { type: 'function', regex: /^(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\(.*\)\s*=>/ },
];

const testLines = [
  'const arrowWithTypes = (x: number, y: number): number => {',
  'const simpleArrow = (x) => {',
  'const asyncArrow = async (x) => {',
];

testLines.forEach(line => {
  const trimmed = line.trimStart();
  const matches = patterns[0].regex.test(trimmed);
  console.log(`Line: "${line}"`);
  console.log(`Trimmed: "${trimmed}"`);
  console.log(`Matches: ${matches}`);
  console.log('---');
});