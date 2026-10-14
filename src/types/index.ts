export type BlockCategory =
  | 'class'
  | 'field'
  | 'method'
  | 'control'
  | 'datastructure';

export type BlockType =
  | 'class'
  | 'interface'
  | 'extends'
  | 'implements'
  | 'field'
  | 'method'
  | 'constructor'
  | 'param'
  | 'forLoop'
  | 'whileLoop'
  | 'ifElse'
  | 'arrayList'
  | 'node'
  | 'hashMap'
  | 'print';

export type DataType = 'int' | 'String' | 'double' | 'boolean' | 'void' | 'char' | 'long' | 'custom';

export type AccessModifier = 'public' | 'private' | 'protected' | 'default';

export interface BlockParam {
  name: string;
  type: DataType | string;
  value?: string;
}

export interface CodeBlock {
  id: string;
  type: BlockType;
  category: BlockCategory;
  label: string;
  color: string;
  icon: string;
  helpText: string;
  // nesting
  allowedChildren: BlockType[];
  allowedParents: BlockType[] | 'root';
  // payload
  name?: string;
  dataType?: DataType;
  modifier?: AccessModifier;
  params?: BlockParam[];
  body?: string;
  extendsName?: string;
  implementsNames?: string[];
  condition?: string;
  initExpr?: string;
  updateExpr?: string;
  children?: CodeBlock[];
  parent?: CodeBlock | null;
}

export interface PaletteBlockDef {
  type: BlockType;
  category: BlockCategory;
  label: string;
  color: string;
  icon: string;
  helpText: string;
  allowedChildren: BlockType[];
  allowedParents: BlockType[] | 'root';
}

export type ModeId =
  | 'oop'
  | 'datastructures'
  | 'logic'
  | 'memory'
  | 'quest';

export interface Mode {
  id: ModeId;
  label: string;
  icon: string;
}

// ===== Memory model =====

export interface StackFrame {
  id: string;
  methodName: string;
  variables: StackVariable[];
  active: boolean;
}

export interface StackVariable {
  id: string;
  name: string;
  type: string;
  value: string | null; // null = reference (pointer to heap)
  isReference: boolean;
  heapId?: string; // target heap object
}

export interface HeapObject {
  id: string;
  address: string;
  className: string;
  fields: { name: string; type: string; value: string | null; isRef: boolean; heapId?: string }[];
  refCount: number;
  gcMarked: boolean;
}

export interface Pointer {
  id: string;
  fromStackId: string; // stack variable id
  toHeapId: string;
}

export interface ExecutionStep {
  line: number;
  description: string;
  stack: StackFrame[];
  heap: HeapObject[];
  pointers: Pointer[];
  consoleOutput: string[];
  gcTriggered: boolean;
}

// ===== Quests =====

export interface Quest {
  id: string;
  level: number;
  title: string;
  description: string;
  objective: string;
  xp: number;
  mode: ModeId;
  validate: (blocks: CodeBlock[]) => QuestValidation;
}

export interface QuestValidation {
  passed: boolean;
  message: string;
  details: string[];
}

// ===== Template =====

export interface Template {
  id: string;
  name: string;
  description: string;
  mode: ModeId;
  blocks: CodeBlock[];
}
