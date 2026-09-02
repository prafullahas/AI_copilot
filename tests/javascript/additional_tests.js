const { chunkCode } = require('./backend/utils/chunkCode.js');

// Additional comprehensive tests
console.log('🔍 Running additional edge case tests...\n');

// Test 1: Mixed language detection based on file extension
console.log('Test 1: File extension detection');
const jsCode = 'function test() { return "js"; }';
const pyCode = 'def test(): return "py"';

const jsChunks = chunkCode(jsCode, 'test.js');
const pyChunks = chunkCode(pyCode, 'test.py');
const tsChunks = chunkCode(jsCode, 'test.ts');
const javaChunks = chunkCode('public class Test {}', 'Test.java');

console.log(`JS file (.js): ${jsChunks.length} chunks`);
console.log(`Python file (.py): ${pyChunks.length} chunks`);
console.log(`TypeScript file (.ts): ${tsChunks.length} chunks`);
console.log(`Java file (.java): ${javaChunks.length} chunks`);

// Test 2: Complex nested structures
console.log('\nTest 2: Complex nested structures');
const nestedCode = `
class OuterClass {
  constructor() {
    this.inner = class InnerClass {
      method() {
        function nestedFunction() {
          return "nested";
        }
        return nestedFunction();
      }
    };
  }
}

function outerFunction() {
  const innerFunc = function() {
    return "inner";
  };
  return innerFunc;
}
`;

const nestedChunks = chunkCode(nestedCode, 'nested.js');
console.log(`Nested structures: ${nestedChunks.length} chunks`);
nestedChunks.forEach((chunk, i) => {
  console.log(`  Chunk ${i+1}: ${chunk.type} - ${chunk.content.split('\n')[0]}`);
});

// Test 3: Python indentation edge cases
console.log('\nTest 3: Python indentation edge cases');
const pythonIndentCode = `
def function_with_docstring():
    """
    This is a docstring
    with multiple lines
    """
    return "documented"

class ClassWithMethods:
    def method1(self):
        if True:
            return "method1"
    
    def method2(self):
        return "method2"

def function_with_nested_if():
    if True:
        if True:
            return "nested"
    return "not nested"
`;

const pythonChunks = chunkCode(pythonIndentCode, 'indent.py');
console.log(`Python indentation test: ${pythonChunks.length} chunks`);
pythonChunks.forEach((chunk, i) => {
  console.log(`  Chunk ${i+1}: ${chunk.type} - ${chunk.content.split('\n')[0]}`);
});

// Test 4: Single-line vs multi-line detection
console.log('\nTest 4: Single-line vs multi-line detection');
const singleMultiCode = `
const singleLine = x => x * 2;
const multiLine = (x) => {
  return x * 2;
};
function regularFunc() { return "regular"; }
`;

const singleMultiChunks = chunkCode(singleMultiCode, 'single_multi.js');
console.log(`Single/Multi-line test: ${singleMultiChunks.length} chunks`);
singleMultiChunks.forEach((chunk, i) => {
  const lines = chunk.content.split('\n').length;
  console.log(`  Chunk ${i+1}: ${chunk.type} - ${lines} lines - ${chunk.content.split('\n')[0]}`);
});

// Test 5: Export variations
console.log('\nTest 5: Export variations');
const exportCode = `
export function exportedFunc() { return "exported"; }
export const exportedArrow = () => { return "exported arrow"; };
export default function defaultFunc() { return "default"; }
export default class DefaultClass {}
export { namedExport };
function namedExport() { return "named"; }
`;

const exportChunks = chunkCode(exportCode, 'exports.js');
console.log(`Export variations test: ${exportChunks.length} chunks`);
exportChunks.forEach((chunk, i) => {
  console.log(`  Chunk ${i+1}: ${chunk.type} - ${chunk.content.split('\n')[0]}`);
});

console.log('\n✅ Additional edge case tests completed!');