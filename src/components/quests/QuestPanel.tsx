import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Zap, Trophy, Play, Target, Sparkles } from 'lucide-react';
import { QUESTS } from '@/data/quests';
import type { CodeBlock, QuestValidation } from '@/types';

interface QuestPanelProps {
  blocks: CodeBlock[];
  onXPUpdate: (xp: number) => void;
}

export function QuestPanel({ blocks, onXPUpdate }: QuestPanelProps) {
  const [activeQuestId, setActiveQuestId] = useState<string | null>(QUESTS[0].id);
  const [validation, setValidation] = useState<QuestValidation | null>(null);
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  const activeQuest = QUESTS.find((q) => q.id === activeQuestId);

  const handleValidate = () => {
    if (!activeQuest) return;
    const result = activeQuest.validate(blocks);
    setValidation(result);
    if (result.passed && !completedQuests.has(activeQuest.id)) {
      setCompletedQuests((prev) => new Set([...prev, activeQuest.id]));
      onXPUpdate(activeQuest.xp);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50">
        <Trophy size={16} className="text-yellow-400" />
        <h2 className="text-sm font-semibold text-gray-200">Quest Mode</h2>
        <span className="text-[10px] text-gray-500 ml-auto">
          {completedQuests.size}/{QUESTS.length} completed
        </span>
      </div>

      {/* Quest list */}
      <div className="px-3 pt-3 space-y-2">
        {QUESTS.map((quest) => {
          const isActive = activeQuestId === quest.id;
          const isCompleted = completedQuests.has(quest.id);
          return (
            <button
              key={quest.id}
              onClick={() => {
                setActiveQuestId(quest.id);
                setValidation(null);
              }}
              className={`w-full text-left rounded-lg border p-3 transition-all ${
                isActive
                  ? 'border-yellow-500/40 bg-yellow-500/10'
                  : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                }`}>
                  {isCompleted ? <CheckCircle2 size={12} /> : quest.level}
                </span>
                <span className={`text-xs font-medium ${isActive ? 'text-yellow-300' : 'text-gray-300'}`}>
                  {quest.title}
                </span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-yellow-400">
                  <Zap size={10} />{quest.xp} XP
                </span>
              </div>
              <p className="text-[10px] text-gray-500 pl-7">{quest.description}</p>
            </button>
          );
        })}
      </div>

      {/* Active quest details */}
      {activeQuest && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 mt-2">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-cyan-400" />
              <h3 className="text-xs font-semibold text-gray-200">Objective</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{activeQuest.objective}</p>

            <button
              onClick={handleValidate}
              className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
            >
              <Play size={14} />
              Run & Validate
            </button>

            {/* Validation results */}
            <AnimatePresence mode="wait">
              {validation && (
                <motion.div
                  key={validation.passed ? 'pass' : 'fail'}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`rounded-lg p-3 ${
                    validation.passed
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {validation.passed ? (
                        <CheckCircle2 size={16} className="text-green-400" />
                      ) : (
                        <XCircle size={16} className="text-red-400" />
                      )}
                      <span className={`text-xs font-medium ${
                        validation.passed ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {validation.message}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {validation.details.map((d, i) => (
                        <li key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                          <span className={validation.passed ? 'text-green-400' : 'text-red-400'}>
                            {validation.passed ? '✓' : '•'}
                          </span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Celebration particles */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-50"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <Sparkles size={48} className="text-yellow-400" />
                <span className="text-lg font-bold text-yellow-300">+{activeQuest?.xp} XP!</span>
                <span className="text-sm text-gray-300">Quest Complete!</span>
              </motion.div>
              {/* Particles */}
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    background: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6'][i % 4],
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: (Math.cos((i / 12) * Math.PI * 2) * 120),
                    y: (Math.sin((i / 12) * Math.PI * 2) * 120),
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
