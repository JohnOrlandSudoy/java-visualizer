import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { PALETTE_BLOCKS, CATEGORY_LABELS, CATEGORY_ORDER } from '@/data/paletteBlocks';
import type { PaletteBlockDef, BlockCategory } from '@/types';

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-300', badge: 'bg-amber-500/20' },
  sky: { bg: 'bg-sky-500/10', border: 'border-sky-500/40', text: 'text-sky-300', badge: 'bg-sky-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-300', badge: 'bg-emerald-500/20' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/40', text: 'text-violet-300', badge: 'bg-violet-500/20' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/40', text: 'text-rose-300', badge: 'bg-rose-500/20' },
};

function getIcon(name: string) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  return Icon || LucideIcons.Box;
}

interface PaletteItemProps {
  block: PaletteBlockDef;
  onAdd: (block: PaletteBlockDef) => void;
}

function PaletteItem({ block, onAdd }: PaletteItemProps) {
  const [showHelp, setShowHelp] = useState(false);
  const colors = colorMap[block.color] || colorMap.amber;
  const Icon = getIcon(block.icon);

  return (
    <div className={`group relative rounded-lg border ${colors.border} ${colors.bg} transition-all hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => onAdd(block)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${colors.badge} ${colors.text}`}>
            <Icon size={14} />
          </span>
          <span className={`text-xs font-medium ${colors.text}`}>{block.label}</span>
        </button>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="What is this?"
        >
          <HelpCircle size={14} />
        </button>
        <button
          onClick={() => onAdd(block)}
          className={`flex h-6 w-6 items-center justify-center rounded ${colors.badge} ${colors.text} hover:scale-110 transition-transform`}
          title="Add to canvas"
        >
          <Plus size={14} />
        </button>
      </div>
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="px-3 pb-3 text-xs text-gray-400 leading-relaxed">{block.helpText}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BlockPaletteProps {
  onAddBlock: (block: PaletteBlockDef) => void;
}

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <h2 className="text-sm font-semibold text-gray-200">Component Blocks</h2>
        <span className="text-[10px] text-gray-500">Drag or click + to add</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-3">
        {CATEGORY_ORDER.map((cat: string) => {
          const blocks = PALETTE_BLOCKS.filter((b) => b.category === cat);
          if (!blocks.length) return null;
          const isCollapsed = collapsed[cat];
          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="flex w-full items-center justify-between mb-2 px-1"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  {CATEGORY_LABELS[cat]}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-gray-500 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-2"
                  >
                    {blocks.map((block) => (
                      <PaletteItem key={`${block.type}-${block.label}`} block={block} onAdd={onAddBlock} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
