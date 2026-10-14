import { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';
import 'highlight.js/styles/atom-one-dark.css';

hljs.registerLanguage('java', java);

interface CodeOutputProps {
  code: string;
  activeLine: number | null;
  lineMap: Map<number, import('@/types').CodeBlock>;
}

export function CodeOutput({ code, activeLine }: CodeOutputProps) {
  const codeRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (codeRef.current) {
      try {
        hljs.highlightElement(codeRef.current);
      } catch {
        // ignore
      }
    }
  }, [code]);

  useEffect(() => {
    if (activeLine != null && lineRefs.current[activeLine]) {
      lineRefs.current[activeLine]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeLine]);

  const lines = code.split('\n');

  return (
    <div ref={containerRef} className="h-full overflow-auto custom-scrollbar bg-[#0d1117]">
      <div className="flex font-mono text-xs">
        {/* Line numbers */}
        <div className="flex flex-col select-none border-r border-gray-800 bg-[#0d1117] sticky left-0">
          {lines.map((_, i) => (
            <div
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className={`px-3 py-0.5 text-right transition-colors ${
                activeLine === i + 1 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-gray-600'
              }`}
              style={{ minWidth: '3rem' }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        {/* Code */}
        <div className="flex-1 overflow-x-auto">
          <pre className="m-0">
            <code ref={codeRef} className="language-java block">
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={`px-3 py-0.5 whitespace-pre transition-colors ${
                    activeLine === i + 1 ? 'bg-cyan-500/10' : ''
                  }`}
                >
                  {line || ' '}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
