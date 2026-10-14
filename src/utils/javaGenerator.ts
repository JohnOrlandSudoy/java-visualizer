import type { CodeBlock } from '@/types';

export function generateJava(blocks: CodeBlock[]): { code: string; lineMap: Map<number, CodeBlock> } {
  const lines: string[] = [];
  const lineMap = new Map<number, CodeBlock>();
  let currentLine = 1;

  function pad(indent: number): string {
    return '    '.repeat(indent);
  }

  function emit(text: string, block?: CodeBlock) {
    const lineNum = currentLine;
    lines.push(text);
    if (block) {
      lineMap.set(lineNum, block);
    }
    currentLine++;
  }

  function processBlock(block: CodeBlock, indent: number) {
    switch (block.type) {
      case 'class': {
        let header = `${pad(indent)}public class ${block.name || 'MyClass'}`;
        if (block.extendsName) header += ` extends ${block.extendsName}`;
        if (block.implementsNames?.length) header += ` implements ${block.implementsNames.join(', ')}`;
        emit(`${header} {`, block);
        if (block.children) {
          for (const child of block.children) {
            emit('');
            processBlock(child, indent + 1);
          }
        }
        emit(`${pad(indent)}}`);
        break;
      }
      case 'interface': {
        emit(`${pad(indent)}interface ${block.name || 'MyInterface'} {`, block);
        if (block.children) {
          for (const child of block.children) {
            processBlock(child, indent + 1);
          }
        }
        emit(`${pad(indent)}}`);
        break;
      }
      case 'field': {
        const mod = block.modifier && block.modifier !== 'default' ? block.modifier + ' ' : '';
        emit(`${pad(indent)}${mod}${block.dataType || 'int'} ${block.name || 'field'};`, block);
        break;
      }
      case 'node': {
        const mod = block.modifier && block.modifier !== 'default' ? block.modifier + ' ' : '';
        emit(`${pad(indent)}${mod}Node ${block.name || 'next'};`, block);
        break;
      }
      case 'constructor': {
        const params = (block.params || []).map((p) => `${p.type} ${p.name}`).join(', ');
        emit(`${pad(indent)}${block.modifier && block.modifier !== 'default' ? block.modifier + ' ' : 'public '}${block.name || 'Constructor'}(${params}) {`, block);
        if (block.params?.length) {
          for (const p of block.params) {
            emit(`${pad(indent + 1)}this.${p.name} = ${p.name};`);
          }
        }
        if (block.children) {
          for (const child of block.children) {
            processBlock(child, indent + 1);
          }
        }
        emit(`${pad(indent)}}`);
        break;
      }
      case 'method': {
        const mod = block.modifier && block.modifier !== 'default' ? block.modifier + ' ' : 'public ';
        const ret = block.dataType || 'void';
        const params = (block.params || []).map((p) => `${p.type} ${p.name}`).join(', ');
        emit(`${pad(indent)}${mod}${ret} ${block.name || 'myMethod'}(${params}) {`, block);
        if (block.children) {
          for (const child of block.children) {
            processBlock(child, indent + 1);
          }
        }
        emit(`${pad(indent)}}`);
        break;
      }
      case 'forLoop': {
        emit(`${pad(indent)}for (${block.initExpr || 'int i = 0'}; ${block.condition || 'i < n'}; ${block.updateExpr || 'i++'}) {`, block);
        if (block.children) {
          for (const child of block.children) {
            processBlock(child, indent + 1);
          }
        }
        emit(`${pad(indent)}}`);
        break;
      }
      case 'whileLoop': {
        emit(`${pad(indent)}while (${block.condition || 'true'}) {`, block);
        if (block.children) {
          for (const child of block.children) {
            processBlock(child, indent + 1);
          }
        }
        emit(`${pad(indent)}}`);
        break;
      }
      case 'ifElse': {
        emit(`${pad(indent)}if (${block.condition || 'true'}) {`, block);
        if (block.children) {
          for (const child of block.children) {
            processBlock(child, indent + 1);
          }
        }
        emit(`${pad(indent)}} else {`);
        emit(`${pad(indent)}    // else branch`);
        emit(`${pad(indent)}}`);
        break;
      }
      case 'print': {
        emit(`${pad(indent)}System.out.println(${block.body || '""'});`, block);
        break;
      }
      case 'arrayList': {
        emit(`${pad(indent)}ArrayList<${block.dataType || 'String'}> ${block.name || 'list'} = new ArrayList<>();`, block);
        break;
      }
      case 'hashMap': {
        emit(`${pad(indent)}HashMap<${block.dataType || 'String'}, Object> ${block.name || 'map'} = new HashMap<>();`, block);
        break;
      }
      case 'param': {
        const params = (block.params || []).map((p) => `${p.type} ${p.name}`).join(', ');
        emit(`${pad(indent)}// params: ${params}`, block);
        break;
      }
      default: {
        emit(`${pad(indent)}// ${block.label}`, block);
      }
    }
  }

  for (const block of blocks) {
    processBlock(block, 0);
    emit('');
  }

  return { code: lines.join('\n'), lineMap };
}

export function generateJavaFile(blocks: CodeBlock[]): string {
  const { code } = generateJava(blocks);
  const imports = [
    'import java.util.ArrayList;',
    'import java.util.HashMap;',
    '',
  ].join('\n');
  return `${imports}\n${code}\n`;
}
