const { chunkCode } = require('./backend/utils/chunkCode.js');

// Debug TypeScript test
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

console.log('🔍 Debugging TypeScript extraction...');
const chunks = chunkCode(tsCode, 'test.ts');

console.log(`\nTotal chunks found: ${chunks.length}`);
chunks.forEach((chunk, index) => {
  console.log(`\nChunk ${index + 1}:`);
  console.log(`Type: ${chunk.type}`);
  console.log(`FilePath: ${chunk.filePath}`);
  console.log(`Content preview: ${chunk.content.split('\n')[0]}...`);
});

const functions = chunks.filter(c => c.type === 'function');
const classes = chunks.filter(c => c.type === 'class');

console.log(`\nFunctions found: ${functions.length}`);
functions.forEach((func, index) => {
  console.log(`Function ${index + 1}: ${func.content.split('\n')[0]}`);
});

console.log(`\nClasses found: ${classes.length}`);
classes.forEach((cls, index) => {
  console.log(`Class ${index + 1}: ${cls.content.split('\n')[0]}`);
});