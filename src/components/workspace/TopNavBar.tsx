import { motion } from 'framer-motion';
import { Coffee, StepBack, Play, Pause, StepForward, RotateCcw, Download, Zap } from 'lucide-react';
import type { ModeId } from '@/types';

const MODES: { id: ModeId; label: string }[] = [
  { id: 'oop', label: 'OOP Studio' },
  { id: 'datastructures', label: 'Data Structures' },
  { id: 'logic', label: 'Logic & Methods' },
  { id: 'memory', label: 'Execution & Memory' },
  { id: 'quest', label: 'Quest / Challenge' },
];

interface TopNavBarProps {
  mode: ModeId;
  onModeChange: (mode: ModeId) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onExport: () => void;
  xp: number;
  stepIndex: number;
  totalSteps: number;
}

export function TopNavBar({
  mode,
  onModeChange,
  isPlaying,
  onPlayPause,
  onStepForward,
  onStepBack,
  onReset,
  onExport,
  xp,
  stepIndex,
  totalSteps,
}: TopNavBarProps) {
  return (
    <div className="flex flex-col border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm">
      {/* Top row: branding + controls */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600"
          >
            <Coffee size={20} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-gray-100 leading-tight">
              Java<span className="text-orange-400">Visualizer</span>
            </h1>
            <p className="text-[10px] text-gray-500 leading-tight">Learn Java visually</p>
          </div>
        </div>

        {/* Execution controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 mr-2 text-xs text-gray-500">
            <span className="font-mono">
              {totalSteps > 0 ? `${stepIndex + 1}/${totalSteps}` : '—'}
            </span>
          </div>
          <button
            onClick={onStepBack}
            disabled={stepIndex <= 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Step Back"
          >
            <StepBack size={16} />
          </button>
          <button
            onClick={onPlayPause}
            disabled={totalSteps === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={onStepForward}
            disabled={stepIndex >= totalSteps - 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Step Forward"
          >
            <StepForward size={16} />
          </button>
          <div className="w-px h-6 bg-gray-700 mx-1" />
          <button
            onClick={onReset}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            title="Reset Canvas"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onExport}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 transition-colors"
            title="Export .java file"
          >
            <Download size={14} />
            <span className="text-xs">Export</span>
          </button>
        </div>

        {/* XP badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-sm font-bold text-yellow-300 font-mono">{xp}</span>
          <span className="text-[10px] text-yellow-500/70">XP</span>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex items-center gap-1 px-4 pb-0 overflow-x-auto custom-scrollbar">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`relative px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              mode === m.id
                ? 'text-cyan-300'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {m.label}
            {mode === m.id && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
