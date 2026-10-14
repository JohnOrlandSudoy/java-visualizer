import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Database, Trash2, ArrowRight } from 'lucide-react';
import type { ExecutionStep } from '@/types';

interface MemoryVisualizerProps {
  step: ExecutionStep | null;
}

export function MemoryVisualizer({ step }: MemoryVisualizerProps) {
  if (!step) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-sm">
        Press Play to see memory in action
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
      {/* Call Stack */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-200">Call Stack</h3>
          <span className="text-[10px] text-gray-500 ml-auto">{step.stack.length} frame(s)</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {step.stack.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-gray-600 italic px-3 py-2"
              >
                Stack is empty — all methods returned
              </motion.div>
            ) : (
              step.stack.map((frame, i) => (
                <motion.div
                  key={frame.id}
                  layout
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className={`rounded-lg border ${
                    i === step.stack.length - 1
                      ? 'border-cyan-500/40 bg-cyan-500/5'
                      : 'border-gray-700 bg-gray-800/50'
                  } p-3`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium text-cyan-300">{frame.methodName}</span>
                    <span className="text-[10px] text-gray-500">frame #{i + 1}</span>
                  </div>
                  <div className="space-y-1">
                    {frame.variables.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 font-mono">{v.type}</span>
                        <span className="text-gray-300 font-mono">{v.name}</span>
                        <span className="text-gray-600">=</span>
                        {v.isReference ? (
                          <span className="text-amber-400 font-mono flex items-center gap-1">
                            <ArrowRight size={10} />
                            {v.heapId ? '→ heap' : 'null'}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-mono">{v.value}</span>
                        )}
                      </div>
                    ))}
                    {frame.variables.length === 0 && (
                      <span className="text-[10px] text-gray-600 italic">No local variables</span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700/50" />

      {/* Heap */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database size={16} className="text-rose-400" />
          <h3 className="text-sm font-semibold text-gray-200">Heap Memory</h3>
          <span className="text-[10px] text-gray-500 ml-auto">{step.heap.length} object(s)</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {step.heap.length === 0 ? (
              <motion.div
                key="empty-heap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-gray-600 italic px-3 py-2"
              >
                Heap is empty — no objects allocated
              </motion.div>
            ) : (
              step.heap.map((obj) => (
                <motion.div
                  key={obj.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: obj.gcMarked ? 0.3 : 1,
                    scale: 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`rounded-lg border p-3 ${
                    obj.gcMarked
                      ? 'border-gray-700 bg-gray-800/20'
                      : 'border-rose-500/40 bg-rose-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium text-rose-300">{obj.className}</span>
                    <div className="flex items-center gap-2">
                      {obj.gcMarked && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Trash2 size={10} /> GC eligible
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                        @{obj.address}
                      </span>
                    </div>
                  </div>
                  {obj.fields.length > 0 && (
                    <div className="space-y-1">
                      {obj.fields.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500 font-mono">{f.type}</span>
                          <span className="text-gray-300 font-mono">{f.name}</span>
                          <span className="text-gray-600">=</span>
                          {f.isRef ? (
                            <span className="text-amber-400 font-mono">→ ref</span>
                          ) : (
                            <span className="text-emerald-400 font-mono">{f.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {obj.fields.length === 0 && (
                    <span className="text-[10px] text-gray-600 italic">No fields</span>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pointer visualization */}
      {step.pointers.length > 0 && (
        <>
          <div className="border-t border-gray-700/50" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-gray-200">Active Pointers</h3>
            </div>
            <div className="space-y-1">
              {step.pointers.map((p) => {
                const frame = step.stack.find((f) => f.variables.some((v) => v.id === p.fromStackId));
                const var_ = frame?.variables.find((v) => v.id === p.fromStackId);
                const heapObj = step.heap.find((h) => h.id === p.toHeapId);
                return (
                  <div key={p.id} className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-cyan-300">{var_?.name || 'var'}</span>
                    <span className="text-amber-400">──→</span>
                    <span className="text-rose-300">{heapObj?.className || 'obj'} @{heapObj?.address || '?'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* GC indicator */}
      {step.gcTriggered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-center gap-2"
        >
          <Trash2 size={16} className="text-yellow-400" />
          <span className="text-xs text-yellow-300">
            Garbage Collection: Objects with 0 references are marked for removal from the heap.
          </span>
        </motion.div>
      )}
    </div>
  );
}
