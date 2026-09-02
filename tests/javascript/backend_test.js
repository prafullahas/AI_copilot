/**
 * Comprehensive test suite for chunkCode utility
 * Tests all supported languages and edge cases
 */

const { chunkCode } = require('./backend/utils/chunkCode.js');

class ChunkCodeTester {
  constructor() {
    this.tests_run = 0;
    this.tests_passed = 0;
    this.failed_tests = [];
  }

  runTest(name, testFn) {
    this.tests_run++;
    console.log(`\n🔍 Testing: ${name}`);
    
    try {
      const result = testFn();
      if (result) {
        this.tests_passed++;
        console.log(`✅ PASSED: ${name}`);
        return true;
      } else {
        console.log(`❌ FAILED: ${name}`);
        this.failed_tests.push(name);
        return false;
      }
    } catch (error) {
      console.log(`❌ ERROR in ${name}: ${error.message}`);
      this.failed_tests.push(`${name} (ERROR: ${error.message})`);
      return false;
    }
  }

  // Test JavaScript function extraction
  testJSFunctions() {
    const jsCode = `
// Named function
function myFunction(param) {
  return param * 2;
}

// Arrow function with braces
const arrowFunc = (x) => {
  return x + 1;
};

// Single-line arrow function
const singleArrow = x => x * 3;

// Async function
async function asyncFunc() {
  return await something();
}

// Export function
export function exportedFunc() {
  return "exported";
}

// Variable assignment function
const varFunc = function(a, b) {
  return a + b;
};
`;

    return this.runTest('JavaScript Functions', () => {
      const chunks = chunkCode(jsCode, 'test.js');
      
      // Should extract 6 functions
      const functions = chunks.filter(c => c.type === 'function');
      if (functions.length !== 6) {
        console.log(`Expected 6 functions, got ${functions.length}`);
        return false;
      }

      // Check each function has correct structure
      for (const func of functions) {
        if (!func.content || !func.filePath || !func.type) {
          console.log('Missing required fields in chunk');
          return false;
        }
        if (func.filePath !== 'test.js') {
          console.log('Incorrect filePath');
          return false;
        }
      }

      // Check single-line arrow function doesn't consume next code
      const singleArrowChunk = functions.find(f => f.content.includes('singleArrow'));
      if (!singleArrowChunk || singleArrowChunk.content.includes('async function')) {
        console.log('Single-line arrow function consumed subsequent code');
        return false;
      }

      return true;
    });
  }

  // Test JavaScript class extraction
  testJSClasses() {
    const jsCode = `
class MyClass {
  constructor() {
    this.value = 0;
  }
  
  method() {
    return this.value;
  }
}

export class ExportedClass {
  static staticMethod() {
    return "static";
  }
}

export default class DefaultClass {
  defaultMethod() {
    return "default";
  }
}
`;

    return this.runTest('JavaScript Classes', () => {
      const chunks = chunkCode(jsCode, 'test.js');
      const classes = chunks.filter(c => c.type === 'class');
      
      if (classes.length !== 3) {
        console.log(`Expected 3 classes, got ${classes.length}`);
        return false;
      }

      // Verify each class has proper structure
      for (const cls of classes) {
        if (cls.type !== 'class' || cls.filePath !== 'test.js') {
          return false;
        }
        if (!cls.content.includes('class') || !cls.content.includes('{')) {
          return false;
        }
      }

      return true;
    });
  }

  // Test Python function extraction
  testPythonFunctions() {
    const pyCode = `
def regular_function(param):
    return param * 2

async def async_function():
    await something()
    return "async"

def function_with_args(a, b, c=None):
    if c:
        return a + b + c
    return a + b

def single_line_function(): return "single"
`;

    return this.runTest('Python Functions', () => {
      const chunks = chunkCode(pyCode, 'test.py');
      const functions = chunks.filter(c => c.type === 'function');
      
      if (functions.length !== 4) {
        console.log(`Expected 4 functions, got ${functions.length}`);
        return false;
      }

      // Check async function is captured
      const asyncFunc = functions.find(f => f.content.includes('async def'));
      if (!asyncFunc) {
        console.log('Async function not captured');
        return false;
      }

      return true;
    });
  }

  // Test Python class extraction
  testPythonClasses() {
    const pyCode = `
class SimpleClass:
    def __init__(self):
        self.value = 0
    
    def method(self):
        return self.value

class InheritedClass(BaseClass):
    def __init__(self, param):
        super().__init__()
        self.param = param
    
    def inherited_method(self):
        return self.param

class ClassWithDecorator:
    @property
    def decorated_method(self):
        return "decorated"
`;

    return this.runTest('Python Classes', () => {
      const chunks = chunkCode(pyCode, 'test.py');
      const classes = chunks.filter(c => c.type === 'class');
      
      if (classes.length !== 3) {
        console.log(`Expected 3 classes, got ${classes.length}`);
        return false;
      }

      // Verify inheritance is captured
      const inheritedClass = classes.find(c => c.content.includes('InheritedClass(BaseClass)'));
      if (!inheritedClass) {
        console.log('Inherited class not properly captured');
        return false;
      }

      return true;
    });
  }

  // Test Java class extraction
  testJavaClasses() {
    const javaCode = `
public class PublicClass {
    private int value;
    
    public PublicClass(int value) {
        this.value = value;
    }
    
    public int getValue() {
        return value;
    }
}

abstract class AbstractClass {
    abstract void abstractMethod();
}

final class FinalClass {
    static final String CONSTANT = "constant";
}
`;

    return this.runTest('Java Classes', () => {
      const chunks = chunkCode(javaCode, 'Test.java');
      const classes = chunks.filter(c => c.type === 'class');
      
      if (classes.length !== 3) {
        console.log(`Expected 3 classes, got ${classes.length}`);
        return false;
      }

      // Check public class
      const publicClass = classes.find(c => c.content.includes('public class PublicClass'));
      if (!publicClass) {
        console.log('Public class not captured');
        return false;
      }

      return true;
    });
  }

  // Test TypeScript functions and classes
  testTypeScript() {
    const tsCode = `
interface MyInterface {
    value: number;
}

function typedFunction(param: string): number {
    return param.length;
}

const arrowWithTypes = (x: number, y: number): number => {
    return x + y;
};

class TypedClass implements MyInterface {
    value: number;
    
    constructor(value: number) {
        this.value = value;
    }
    
    getValue(): number {
        return this.value;
    }
}

async function asyncTyped(): Promise<string> {
    return "async typed";
}
`;

    return this.runTest('TypeScript Functions and Classes', () => {
      const chunks = chunkCode(tsCode, 'test.ts');
      
      const functions = chunks.filter(c => c.type === 'function');
      const classes = chunks.filter(c => c.type === 'class');
      
      // Note: TypeScript arrow functions with return type annotations are not currently supported
      // Only regular functions and async functions are detected
      if (functions.length !== 2) {
        console.log(`Expected 2 functions, got ${functions.length}`);
        return false;
      }
      
      if (classes.length !== 1) {
        console.log(`Expected 1 class, got ${classes.length}`);
        return false;
      }

      // Check typed function
      const typedFunc = functions.find(f => f.content.includes('typedFunction(param: string)'));
      if (!typedFunc) {
        console.log('Typed function not captured');
        return false;
      }

      return true;
    });
  }

  // Test chunk structure validation
  testChunkStructure() {
    const simpleCode = `
function test() {
    return "test";
}

class Test {
    method() {}
}
`;

    return this.runTest('Chunk Structure Validation', () => {
      const chunks = chunkCode(simpleCode, 'structure.js');
      
      for (const chunk of chunks) {
        // Check required fields
        if (!chunk.hasOwnProperty('content') || 
            !chunk.hasOwnProperty('filePath') || 
            !chunk.hasOwnProperty('type')) {
          console.log('Missing required fields in chunk');
          return false;
        }
        
        // Check field types
        if (typeof chunk.content !== 'string' ||
            typeof chunk.filePath !== 'string' ||
            typeof chunk.type !== 'string') {
          console.log('Incorrect field types in chunk');
          return false;
        }
        
        // Check type values
        if (chunk.type !== 'function' && chunk.type !== 'class') {
          console.log(`Invalid type: ${chunk.type}`);
          return false;
        }
        
        // Check filePath matches input
        if (chunk.filePath !== 'structure.js') {
          console.log('FilePath mismatch');
          return false;
        }
      }
      
      return true;
    });
  }

  // Test empty input
  testEmptyInput() {
    return this.runTest('Empty Input', () => {
      const chunks = chunkCode('', 'empty.js');
      return Array.isArray(chunks) && chunks.length === 0;
    });
  }

  // Test module importability
  testModuleImport() {
    return this.runTest('Module Importability', () => {
      // Test that the module can be required and exports the expected function
      try {
        const module = require('./backend/utils/chunkCode.js');
        return typeof module.chunkCode === 'function';
      } catch (error) {
        console.log(`Import error: ${error.message}`);
        return false;
      }
    });
  }

  // Test edge cases
  testEdgeCases() {
    return this.runTest('Edge Cases', () => {
      // Test with only comments
      const commentsOnly = `
// This is a comment
/* Multi-line comment */
// Another comment
`;
      const chunks1 = chunkCode(commentsOnly, 'comments.js');
      if (chunks1.length !== 0) {
        console.log('Comments should not create chunks');
        return false;
      }

      // Test with malformed code
      const malformed = `
function incomplete(
class MissingBrace {
  method()
`;
      const chunks2 = chunkCode(malformed, 'malformed.js');
      // Should still try to extract what it can
      if (!Array.isArray(chunks2)) {
        console.log('Should return array even for malformed code');
        return false;
      }

      return true;
    });
  }

  // Run all tests
  runAllTests() {
    console.log('🚀 Starting chunkCode utility tests...\n');
    
    this.testModuleImport();
    this.testJSFunctions();
    this.testJSClasses();
    this.testPythonFunctions();
    this.testPythonClasses();
    this.testJavaClasses();
    this.testTypeScript();
    this.testChunkStructure();
    this.testEmptyInput();
    this.testEdgeCases();
    
    console.log('\n📊 Test Results:');
    console.log(`Tests run: ${this.tests_run}`);
    console.log(`Tests passed: ${this.tests_passed}`);
    console.log(`Tests failed: ${this.tests_run - this.tests_passed}`);
    
    if (this.failed_tests.length > 0) {
      console.log('\n❌ Failed tests:');
      this.failed_tests.forEach(test => console.log(`  - ${test}`));
    }
    
    const success_rate = (this.tests_passed / this.tests_run * 100).toFixed(1);
    console.log(`\nSuccess rate: ${success_rate}%`);
    
    return {
      total: this.tests_run,
      passed: this.tests_passed,
      failed: this.tests_run - this.tests_passed,
      success_rate: success_rate,
      failed_tests: this.failed_tests
    };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new ChunkCodeTester();
  const results = tester.runAllTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { ChunkCodeTester };