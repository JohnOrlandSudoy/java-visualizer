import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  output: string[];
}

export function Terminal({ output }: TerminalProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  return (
    <div className="h-full flex flex-col bg-[#0c0c0c]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-[#1a1a1a]">
        <TerminalIcon size={14} className="text-green-400" />
        <span className="text-xs font-mono text-gray-400">Console Output</span>
        <div className="flex gap-1.5 ml-auto">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 font-mono text-xs">
        {output.length === 0 ? (
          <div className="text-gray-600">
            <span className="text-green-400">$</span> Waiting for program output...
          </div>
        ) : (
          <>
            {output.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-gray-300 py-0.5"
              >
                <span className="text-green-400 select-none">{'> '}</span>
                {line}
              </motion.div>
            ))}
            <div ref={endRef} />
          </>
        )}
      </div>
    </div>
  );
}
