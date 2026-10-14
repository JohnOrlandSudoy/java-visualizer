import { useState } from 'react';
import { Code2, Cpu, TerminalSquare, BookOpen } from 'lucide-react';
import { CodeOutput } from '@/components/workspace/CodeOutput';
import { MemoryVisualizer } from '@/components/memory/MemoryVisualizer';
import { Terminal } from '@/components/workspace/Terminal';
import { ExplanationBox } from '@/components/workspace/ExplanationBox';
import type { CodeBlock, ExecutionStep } from '@/types';

type TabId = 'code' | 'memory' | 'terminal' | 'explanation';

const TABS: { id: TabId; label: string; icon: typeof Code2 }[] = [
  { id: 'code', label: 'Java Code', icon: Code2 },
  { id: 'memory', label: 'Memory', icon: Cpu },
  { id: 'terminal', label: 'Console', icon: TerminalSquare },
  { id: 'explanation', label: 'Under the Hood', icon: BookOpen },
];

interface RightPanelProps {
  code: string;
  lineMap: Map<number, CodeBlock>;
  activeLine: number | null;
  currentStep: ExecutionStep | null;
  stepIndex: number;
  totalSteps: number;
  consoleOutput: string[];
}

export function RightPanel({
  code,
  lineMap,
  activeLine,
  currentStep,
  stepIndex,
  totalSteps,
  consoleOutput,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('code');

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-gray-700/50 bg-gray-900/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-cyan-300'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'code' && (
          <CodeOutput code={code} activeLine={activeLine} lineMap={lineMap} />
        )}
        {activeTab === 'memory' && (
          <MemoryVisualizer step={currentStep} />
        )}
        {activeTab === 'terminal' && (
          <Terminal output={consoleOutput} />
        )}
        {activeTab === 'explanation' && (
          <ExplanationBox
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            description={currentStep?.description || 'Press Play to start execution.'}
          />
        )}
      </div>
    </div>
  );
}
