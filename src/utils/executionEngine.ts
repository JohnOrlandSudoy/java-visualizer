import type { CodeBlock, ExecutionStep, StackFrame, HeapObject, StackVariable, Pointer } from '@/types';

function addr(counter: number): string {
  return '0x' + (0x1000 + counter * 0x1f4).toString(16).toUpperCase();
}

export function generateExecutionSteps(blocks: CodeBlock[]): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  let heapCounter = 0;
  let varCounter = 0;
  let frameCounter = 0;

  function makeVar(name: string, type: string, value: string | null, isRef: boolean, heapId?: string): StackVariable {
    return { id: `var_${varCounter++}`, name, type, value, isReference: isRef, heapId };
  }

  function makeFrame(methodName: string, vars: StackVariable[]): StackFrame {
    return { id: `frame_${frameCounter++}`, methodName, variables: vars, active: true };
  }

  function makeHeap(className: string, fields: HeapObject['fields']): HeapObject {
    return { id: `heap_${heapCounter}`, address: addr(heapCounter), className, fields, refCount: 1, gcMarked: false };
  }

  // Step 0: initial state — JVM starts, main() frame on stack
  {
    const mainFrame = makeFrame('main', [
      makeVar('args', 'String[]', null, true, 'heap_args'),
    ]);
    const argsHeap: HeapObject = { id: 'heap_args', address: addr(heapCounter++), className: 'String[]', fields: [], refCount: 1, gcMarked: false };
    const pointers: Pointer[] = [{ id: 'ptr_0', fromStackId: mainFrame.variables[0].id, toHeapId: 'heap_args' }];
    steps.push({
      line: 1,
      description: 'JVM started. The main() method is pushed onto the call stack. The args parameter references an empty String array on the heap.',
      stack: [mainFrame],
      heap: [argsHeap],
      pointers,
      consoleOutput: [],
      gcTriggered: false,
    });
  }

  // Process each top-level class
  for (const block of blocks) {
    if (block.type === 'class') {
      // Step: class loaded
      steps.push({
        line: steps.length + 1,
        description: `Class ${block.name} loaded into the JVM method area. No heap allocation yet — the class is just a blueprint.`,
        stack: [...steps[steps.length - 1].stack],
        heap: [...steps[steps.length - 1].heap],
        pointers: [...steps[steps.length - 1].pointers],
        consoleOutput: [...steps[steps.length - 1].consoleOutput],
        gcTriggered: false,
      });

      // If class has a constructor, simulate object creation
      const constructor = block.children?.find((c) => c.type === 'constructor');
      const fields = block.children?.filter((c) => c.type === 'field' || c.type === 'node') || [];

      if (constructor) {
        const heapObj = makeHeap(block.name || 'Object', []);
        const prevStack = [...steps[steps.length - 1].stack];
        const prevHeap = [...steps[steps.length - 1].heap];

        // Create constructor stack frame
        const ctorVars: StackVariable[] = [];
        for (const p of constructor.params || []) {
          ctorVars.push(makeVar(p.name, p.type, p.type === 'int' ? '0' : p.type === 'double' ? '0.0' : 'null', p.type === 'String' || p.type === 'custom'));
        }

        // Add a reference variable to main for the new object
        const refVar = makeVar(
          `my${block.name}`,
          block.name || 'Object',
          null,
          true,
          heapObj.id
        );
        const mainFrame = prevStack[0];
        const updatedMain = { ...mainFrame, variables: [...mainFrame.variables, refVar] };
        const ctorFrame = makeFrame(`${block.name}()`, ctorVars);
        const newStack = [updatedMain, ctorFrame];

        // Populate heap fields
        for (const f of fields) {
          heapObj.fields.push({
            name: f.name || 'field',
            type: f.dataType || 'int',
            value: f.dataType === 'int' ? '0' : f.dataType === 'double' ? '0.0' : f.dataType === 'boolean' ? 'false' : 'null',
            isRef: f.type === 'node' || f.dataType === 'String' || f.dataType === 'custom',
          });
        }

        const newHeap = [...prevHeap, heapObj];
        const newPointers = [...steps[steps.length - 1].pointers, { id: `ptr_${refVar.id}`, fromStackId: refVar.id, toHeapId: heapObj.id }];

        steps.push({
          line: steps.length + 1,
          description: `new ${block.name}() creates an object in Heap memory at address ${heapObj.address}. The constructor ${block.name}() is pushed onto the call stack. Reference variable 'my${block.name}' in main() now points to it.`,
          stack: newStack,
          heap: newHeap,
          pointers: newPointers,
          consoleOutput: [...steps[steps.length - 1].consoleOutput],
          gcTriggered: false,
        });

        // Step: constructor body executes — assign params to fields
        if (constructor.params?.length) {
          const assignedFields = heapObj.fields.map((f) => {
            const param = constructor.params!.find((p) => p.name === f.name);
            if (param) {
              const val = param.type === 'int' ? '42' : param.type === 'double' ? '100.0' : param.type === 'String' ? '"Buddy"' : 'null';
              return { ...f, value: val };
            }
            return f;
          });
          const updatedHeap = newHeap.map((h) => h.id === heapObj.id ? { ...h, fields: assignedFields } : h);
          steps.push({
            line: steps.length + 1,
            description: `Constructor body executes: this.${constructor.params[0].name} = ${constructor.params[0].name} assigns the value to the object's field at ${heapObj.address}.`,
            stack: newStack,
            heap: updatedHeap,
            pointers: newPointers,
            consoleOutput: [...steps[steps.length - 1].consoleOutput],
            gcTriggered: false,
          });
        }

        // Step: constructor returns, frame popped
        steps.push({
          line: steps.length + 1,
          description: `Constructor ${block.name}() finishes and its stack frame is popped. The object at ${heapObj.address} remains on the heap, referenced by 'my${block.name}' in main().`,
          stack: [updatedMain],
          heap: [...steps[steps.length - 1].heap],
          pointers: [...steps[steps.length - 1].pointers],
          consoleOutput: [...steps[steps.length - 1].consoleOutput],
          gcTriggered: false,
        });
      }

      // Process methods that print
      const methods = block.children?.filter((c) => c.type === 'method') || [];
      for (const method of methods) {
        // Step: method called, push frame
        const methodVars: StackVariable[] = [];
        for (const p of method.params || []) {
          const val = p.type === 'int' ? '10' : p.type === 'int[]' ? 'null' : p.type === 'double' ? '50.0' : 'null';
          methodVars.push(makeVar(p.name, p.type, val, p.type.includes('String') || p.type.includes('[]') || p.type === 'custom'));
        }

        // Add local variable for for-loops
        const forLoops = method.children?.filter((c) => c.type === 'forLoop') || [];
        for (const fl of forLoops) {
          if (fl.initExpr) {
            const match = fl.initExpr.match(/int\s+(\w+)\s*=\s*(\d+)/);
            if (match) {
              methodVars.push(makeVar(match[1], 'int', match[2], false));
            }
          }
        }

        const prevStack = [...steps[steps.length - 1].stack];
        const prevHeap = [...steps[steps.length - 1].heap];
        const prevPointers = [...steps[steps.length - 1].pointers];
        const methodFrame = makeFrame(`${method.name}()`, methodVars);
        const newStack = [...prevStack, methodFrame];

        steps.push({
          line: steps.length + 1,
          description: `Method ${method.name}() is called. A new stack frame is pushed with local variables: ${methodVars.map((v) => v.name).join(', ') || '(none)'}.`,
          stack: newStack,
          heap: prevHeap,
          pointers: prevPointers,
          consoleOutput: [...steps[steps.length - 1].consoleOutput],
          gcTriggered: false,
        });

        // Execute prints in method (including nested in loops/ifs)
        const allPrints = collectPrints(method);
        for (const printBlock of allPrints) {
          let output = printBlock.body || '""';
          // Simulate variable substitution
          output = output
            .replace(/"Found " \+ target \+ " at index " \+ i/, 'Found 10 at index 3')
            .replace(/"Deposited: " \+ amount/, 'Deposited: 50.0')
            .replace(/"Woof! says " \+ name/, 'Woof! says Buddy')
            .replace(/"Some animal sound"/, 'Some animal sound')
            .replace(/"Woof!"/, 'Woof!');
          // Strip quotes if it's a simple string
          output = output.replace(/^"(.*)"$/, '$1');

          steps.push({
            line: steps.length + 1,
            description: `System.out.println() executes. Output "${output}" is written to the console stream.`,
            stack: [...steps[steps.length - 1].stack],
            heap: [...steps[steps.length - 1].heap],
            pointers: [...steps[steps.length - 1].pointers],
            consoleOutput: [...steps[steps.length - 1].consoleOutput, output],
            gcTriggered: false,
          });
        }

        // Step: method returns, frame popped
        steps.push({
          line: steps.length + 1,
          description: `Method ${method.name}() completes. Its stack frame is popped and all local variables are destroyed.`,
          stack: [steps[steps.length - 1].stack[0]],
          heap: [...steps[steps.length - 1].heap],
          pointers: [...steps[steps.length - 1].pointers],
          consoleOutput: [...steps[steps.length - 1].consoleOutput],
          gcTriggered: false,
        });
      }
    }
  }

  // Final step: program ends, GC demonstration
  {
    const prev = steps[steps.length - 1];
    const gcHeap = prev.heap.map((h) => ({ ...h, gcMarked: h.refCount === 0 }));
    steps.push({
      line: steps.length + 1,
      description: 'main() returns. All stack frames are popped. Objects on the heap with zero references become eligible for Garbage Collection (GC).',
      stack: [],
      heap: gcHeap,
      pointers: [],
      consoleOutput: [...prev.consoleOutput],
      gcTriggered: true,
    });
  }

  return steps;
}

function collectPrints(block: CodeBlock): CodeBlock[] {
  const prints: CodeBlock[] = [];
  function walk(b: CodeBlock) {
    if (b.type === 'print') prints.push(b);
    if (b.children) b.children.forEach(walk);
  }
  if (block.children) block.children.forEach(walk);
  return prints;
}
