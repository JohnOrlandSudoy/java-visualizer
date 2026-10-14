import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TopNavBar } from '@/components/workspace/TopNavBar';
import { BlockPalette } from '@/components/palette/BlockPalette';
import { VisualCanvas } from '@/components/workspace/VisualCanvas';
import { RightPanel } from '@/components/workspace/RightPanel';
import { QuestPanel } from '@/components/quests/QuestPanel';
import { generateJava, generateJavaFile } from '@/utils/javaGenerator';
import { generateExecutionSteps } from '@/utils/executionEngine';
import { TEMPLATES } from '@/data/templates';
import type { CodeBlock, PaletteBlockDef, ModeId, ExecutionStep } from '@/types';

function App() {
  const [mode, setMode] = useState<ModeId>('oop');
  const [blocks, setBlocks] = useState<CodeBlock[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [xp, setXp] = useState(0);
  const [draggedPaletteBlock, setDraggedPaletteBlock] = useState<PaletteBlockDef | null>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate code and execution steps
  const { code, lineMap } = useMemo(() => generateJava(blocks), [blocks]);
  const steps = useMemo(() => generateExecutionSteps(blocks), [blocks]);

  // Reset step index when blocks change
  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [blocks]);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, steps.length]);

  const handlePlayPause = useCallback(() => {
    if (steps.length === 0) return;
    if (stepIndex >= steps.length - 1) {
      setStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [stepIndex, steps.length]);

  const handleStepForward = useCallback(() => {
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const handleStepBack = useCallback(() => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setBlocks([]);
    setStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleExport = useCallback(() => {
    const fileContent = generateJavaFile(blocks);
    const blob = new Blob([fileContent], { type: 'text/x-java-source' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const className = blocks.find((b) => b.type === 'class')?.name || 'Main';
    a.download = `${className}.java`;
    a.click();
    URL.revokeObjectURL(url);
  }, [blocks]);

  const handleAddFromPalette = useCallback((def: PaletteBlockDef) => {
    const newBlock: CodeBlock = {
      id: `${def.type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: def.type,
      category: def.category,
      label: def.label,
      color: def.color,
      icon: def.icon,
      helpText: def.helpText,
      allowedChildren: def.allowedChildren,
      allowedParents: def.allowedParents,
      name: def.type === 'class' ? 'MyClass' : def.type === 'field' ? 'myField' : def.type === 'method' ? 'myMethod' : def.type === 'constructor' ? 'MyClass' : undefined,
      dataType: def.type === 'field' ? 'int' : def.type === 'method' ? 'void' : undefined,
      modifier: def.type === 'field' ? 'private' : 'public',
      children: [],
    };

    if (def.allowedParents === 'root') {
      setBlocks((prev) => [...prev, newBlock]);
    } else {
      // Try to add to the first compatible parent
      setBlocks((prev) => {
        const result = [...prev];
        // Find first parent that accepts this block type
        function findAndAdd(list: CodeBlock[]): boolean {
          for (const b of list) {
            if (b.allowedChildren.includes(def.type)) {
              b.children = [...(b.children || []), newBlock];
              return true;
            }
            if (b.children && findAndAdd(b.children)) return true;
          }
          return false;
        }
        if (!findAndAdd(result)) {
          // No valid parent found, add to root if allowed
          if (def.allowedParents === 'root') {
            result.push(newBlock);
          }
        }
        return [...result];
      });
    }
  }, []);

  const handlePaletteDragStart = useCallback((def: PaletteBlockDef) => {
    setDraggedPaletteBlock(def);
  }, []);

  const currentStep: ExecutionStep | null = steps[stepIndex] || null;
  const activeLine = currentStep?.line ?? null;
  const consoleOutput = currentStep?.consoleOutput || [];

  // Load default template on first mount
  useEffect(() => {
    if (blocks.length === 0 && TEMPLATES.length > 0) {
      setBlocks(JSON.parse(JSON.stringify(TEMPLATES[0].blocks)));
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-gray-200 overflow-hidden">
      <TopNavBar
        mode={mode}
        onModeChange={setMode}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onStepForward={handleStepForward}
        onStepBack={handleStepBack}
        onReset={handleReset}
        onExport={handleExport}
        xp={xp}
        stepIndex={stepIndex}
        totalSteps={steps.length}
      />

      {/* 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-64 shrink-0 border-r border-gray-700/50 bg-gray-900/30">
          <BlockPalette onAddBlock={handleAddFromPalette} />
        </div>

        {/* Center panel — switch between canvas and quest based on mode */}
        <div className="flex-1 overflow-hidden border-r border-gray-700/50">
          {mode === 'quest' ? (
            <div className="h-full">
              <QuestPanel blocks={blocks} onXPUpdate={setXp} />
            </div>
          ) : (
            <VisualCanvas
              blocks={blocks}
              onBlocksChange={setBlocks}
              onAddFromPalette={handleAddFromPalette}
              activeLine={activeLine}
              lineMap={lineMap}
            />
          )}
        </div>

        {/* Right panel */}
        <div className="w-[420px] shrink-0 bg-gray-900/30">
          <RightPanel
            code={code}
            lineMap={lineMap}
            activeLine={activeLine}
            currentStep={currentStep}
            stepIndex={stepIndex}
            totalSteps={steps.length}
            consoleOutput={consoleOutput}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
