import { motion, AnimatePresence } from 'framer-motion';
import { Info, ArrowRight } from 'lucide-react';

interface ExplanationBoxProps {
  stepIndex: number;
  totalSteps: number;
  description: string;
}

export function ExplanationBox({ stepIndex, totalSteps, description }: ExplanationBoxProps) {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4">
      <div className="flex items-center gap-2 mb-3">
        <Info size={16} className="text-cyan-400" />
        <h3 className="text-sm font-semibold text-gray-200">Under the Hood</h3>
        <span className="text-[10px] text-gray-500 ml-auto">
          Step {stepIndex + 1} of {totalSteps}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4"
        >
          <div className="flex items-start gap-2">
            <ArrowRight size={14} className="text-cyan-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
