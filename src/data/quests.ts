import type { Quest, CodeBlock } from '@/types';

export const QUESTS: Quest[] = [
  {
    id: 'quest-encapsulation',
    level: 1,
    title: 'Secure the BankAccount',
    description: 'Make the balance field private and add a deposit method that validates positive amounts only.',
    objective: 'Create a BankAccount class with: (1) a private double field named "balance", (2) a method named "deposit" that accepts a double parameter.',
    xp: 100,
    mode: 'oop',
    validate: (blocks: CodeBlock[]) => {
      const bankClass = blocks.find((b) => b.type === 'class' && b.name === 'BankAccount');
      if (!bankClass) {
        return { passed: false, message: 'No BankAccount class found', details: ['Create a class named "BankAccount"'] };
      }
      const details: string[] = [];
      const balanceField = bankClass.children?.find((c) => c.type === 'field' && c.name === 'balance');
      if (!balanceField) {
        details.push('Missing field: balance');
      } else {
        if (balanceField.modifier !== 'private') details.push(`balance should be private, currently ${balanceField.modifier}`);
        if (balanceField.dataType !== 'double') details.push(`balance should be type double, currently ${balanceField.dataType}`);
      }
      const depositMethod = bankClass.children?.find((c) => c.type === 'method' && c.name === 'deposit');
      if (!depositMethod) {
        details.push('Missing method: deposit');
      } else {
        if (!depositMethod.params?.some((p) => p.type === 'double')) details.push('deposit method should accept a double parameter');
      }
      const passed = details.length === 0;
      return {
        passed,
        message: passed ? 'Excellent! Your BankAccount is properly encapsulated!' : 'Not quite — review the requirements below',
        details: details.length ? details : ['All checks passed!'],
      };
    },
  },
  {
    id: 'quest-inheritance',
    level: 2,
    title: 'Vehicle & Car Inheritance',
    description: 'Create a Vehicle parent class and a Car child class that extends it and overrides startEngine().',
    objective: 'Create: (1) a class named "Vehicle" with a method "startEngine", (2) a class named "Car" that extends Vehicle with its own "startEngine" method.',
    xp: 150,
    mode: 'oop',
    validate: (blocks: CodeBlock[]) => {
      const details: string[] = [];
      const vehicle = blocks.find((b) => b.type === 'class' && b.name === 'Vehicle');
      if (!vehicle) {
        details.push('Missing class: Vehicle');
      } else {
        if (!vehicle.children?.some((c) => c.type === 'method' && c.name === 'startEngine')) {
          details.push('Vehicle needs a startEngine() method');
        }
      }
      const car = blocks.find((b) => b.type === 'class' && b.name === 'Car');
      if (!car) {
        details.push('Missing class: Car');
      } else {
        if (car.extendsName !== 'Vehicle') details.push(`Car should extend Vehicle, currently extends ${car.extendsName || 'nothing'}`);
        if (!car.children?.some((c) => c.type === 'method' && c.name === 'startEngine')) {
          details.push('Car needs to override startEngine()');
        }
      }
      const passed = details.length === 0;
      return {
        passed,
        message: passed ? 'Perfect! Car inherits from Vehicle and overrides startEngine()!' : 'Not quite — review the requirements below',
        details: details.length ? details : ['All checks passed!'],
      };
    },
  },
  {
    id: 'quest-linkedlist',
    level: 3,
    title: 'LinkedList Node Swap',
    description: 'Create a Node class with an int data field and a Node next reference to form a linked list structure.',
    objective: 'Create a class named "Node" with: (1) an int field named "data", (2) a Node reference field named "next".',
    xp: 200,
    mode: 'datastructures',
    validate: (blocks: CodeBlock[]) => {
      const details: string[] = [];
      const node = blocks.find((b) => b.type === 'class' && b.name === 'Node');
      if (!node) {
        details.push('Missing class: Node');
      } else {
        if (!node.children?.some((c) => (c.type === 'field') && c.name === 'data' && c.dataType === 'int')) {
          details.push('Node needs an int field named "data"');
        }
        if (!node.children?.some((c) => c.type === 'node' && c.name === 'next')) {
          details.push('Node needs a Node reference field named "next"');
        }
      }
      const passed = details.length === 0;
      return {
        passed,
        message: passed ? 'Great work! Your Node can link to other Nodes via the next pointer!' : 'Not quite — review the requirements below',
        details: details.length ? details : ['All checks passed!'],
      };
    },
  },
  {
    id: 'quest-overflow',
    level: 4,
    title: 'Stack Overflow Simulation',
    description: 'Create a recursive method with no base case and observe the stack overflow in the memory visualizer.',
    objective: 'Create any class with a method named "recurse" that calls itself. Watch the stack frames pile up in the memory visualizer!',
    xp: 250,
    mode: 'memory',
    validate: (blocks: CodeBlock[]) => {
      const details: string[] = [];
      const hasClass = blocks.some((b) => b.type === 'class');
      if (!hasClass) {
        details.push('Create a class first');
      } else {
        const hasRecurseMethod = blocks.some((b) => b.type === 'class' && b.children?.some((c) => c.type === 'method' && c.name === 'recurse'));
        if (!hasRecurseMethod) {
          details.push('Add a method named "recurse" to your class');
        }
      }
      const passed = details.length === 0;
      return {
        passed,
        message: passed ? 'Now press Play and watch the stack frames accumulate until overflow! A recursive method without a base case causes StackOverflowError.' : 'Not quite — review the requirements below',
        details: details.length ? details : ['All checks passed! Press Play to see the stack overflow.'],
      };
    },
  },
];
