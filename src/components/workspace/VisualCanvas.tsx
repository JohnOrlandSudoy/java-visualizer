import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Trash2, Edit3, AlertTriangle, X, ChevronDown, FileCode } from 'lucide-react';
import type { CodeBlock, PaletteBlockDef, BlockType } from '@/types';
import { TEMPLATES } from '@/data/templates';

const colorMap: Record<string, { bg: string; border: string; text: string; header: string }> = {
  amber: { bg: 'bg-amber-500/5', border: 'border-amber-500/30', text: 'text-amber-300', header: 'bg-amber-500/15' },
  sky: { bg: 'bg-sky-500/5', border: 'border-sky-500/30', text: 'text-sky-300', header: 'bg-sky-500/15' },
  emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/30', text: 'text-emerald-300', header: 'bg-emerald-500/15' },
  violet: { bg: 'bg-violet-500/5', border: 'border-violet-500/30', text: 'text-violet-300', header: 'bg-violet-500/15' },
  rose: { bg: 'bg-rose-500/5', border: 'border-rose-500/30', text: 'text-rose-300', header: 'bg-rose-500/15' },
};

function getIcon(name: string) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  return Icon || LucideIcons.Box;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createBlockFromPalette(def: PaletteBlockDef): CodeBlock {
  return {
    id: makeId(def.type),
    type: def.type,
    category: def.category,
    label: def.label,
    color: def.color,
    icon: def.icon,
    helpText: def.helpText,
    allowedChildren: def.allowedChildren,
    allowedParents: def.allowedParents,
    name: def.type === 'class' ? 'MyClass' : def.type === 'field' ? 'myField' : def.type === 'method' ? 'myMethod' : def.type === 'constructor' ? 'MyClass' : def.type === 'forLoop' ? undefined : undefined,
    dataType: def.type === 'field' ? 'int' : def.type === 'method' ? 'void' : undefined,
    modifier: def.type === 'field' ? 'private' : def.type === 'method' ? 'public' : 'public',
    children: [],
  };
}

function canAccept(parent: CodeBlock, childType: BlockType): boolean {
  return parent.allowedChildren.includes(childType);
}

function canDropAtRoot(type: BlockType): boolean {
  return type === 'class' || type === 'interface';
}

function findBlockById(blocks: CodeBlock[], id: string): CodeBlock | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children) {
      const found = findBlockById(b.children, id);
      if (found) return found;
    }
  }
  return null;
}

function removeBlockById(blocks: CodeBlock[], id: string): CodeBlock[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => ({ ...b, children: b.children ? removeBlockById(b.children, id) : b.children }));
}

function addChildToBlock(blocks: CodeBlock[], parentId: string, child: CodeBlock): CodeBlock[] {
  return blocks.map((b) => {
    if (b.id === parentId) {
      return { ...b, children: [...(b.children || []), child] };
    }
    if (b.children) {
      return { ...b, children: addChildToBlock(b.children, parentId, child) };
    }
    return b;
  });
}

function updateBlockById(blocks: CodeBlock[], id: string, updates: Partial<CodeBlock>): CodeBlock[] {
  return blocks.map((b) => {
    if (b.id === id) return { ...b, ...updates };
    if (b.children) return { ...b, children: updateBlockById(b.children, id, updates) };
    return b;
  });
}

interface CanvasBlockProps {
  block: CodeBlock;
  depth: number;
  activeLine: number | null;
  lineMap: Map<number, CodeBlock>;
  onDelete: (id: string) => void;
  onEdit: (block: CodeBlock) => void;
  onDrop: (parentId: string | null, block: CodeBlock) => void;
  onDragStart: (block: CodeBlock) => void;
}

function CanvasBlock({ block, depth, activeLine, lineMap, onDelete, onEdit, onDrop, onDragStart }: CanvasBlockProps) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);
  const colors = colorMap[block.color] || colorMap.amber;
  const Icon = getIcon(block.icon);

  // Check if this block is on the active line
  const isActive = Array.from(lineMap.entries()).some(([line, b]) => b.id === block.id && line === activeLine);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(true);
  };

  const handleDragLeave = () => {
    setIsDropTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);
    const data = e.dataTransfer.getData('application/json');
    if (data) {
    try {
        const parsed = JSON.parse(data) as { blockType: string; paletteBlock?: PaletteBlockDef; existingBlock?: CodeBlock };
        const childType = parsed.blockType as BlockType;

        if (parsed.paletteBlock) {
          if (canAccept(block, childType)) {
            onDrop(block.id, createBlockFromPalette(parsed.paletteBlock));
          } else {
            setShowInvalid(true);
            setTimeout(() => setShowInvalid(false), 1500);
          }
        } else if (parsed.existingBlock) {
          if (canAccept(block, childType)) {
            onDrop(block.id, parsed.existingBlock);
          } else {
            setShowInvalid(true);
            setTimeout(() => setShowInvalid(false), 1500);
          }
        }
      } catch {
        // ignore
      }
    }
  };

  const handleDragStartBlock = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(block);
    e.dataTransfer.setData('application/json', JSON.stringify({ blockType: block.type, existingBlock: block }));
  };

  const containerClasses = block.type === 'class' || block.type === 'interface'
    ? `${colors.bg} ${colors.border} border-2`
    : `${colors.bg} ${colors.border} border`;

  return (
    <div
      className={`relative rounded-lg ${containerClasses} ${isActive ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20' : ''} ${isDropTarget ? 'ring-2 ring-emerald-400' : ''} ${showInvalid ? 'ring-2 ring-red-500' : ''}`}
      draggable
      onDragStart={handleDragStartBlock}
      style={{ marginLeft: depth > 0 ? 0 : 0 }}
    >
      {/* Block header */}
      <div className={`flex items-center gap-2 px-3 py-2 ${colors.header} rounded-t-lg`}>
        <span className={`flex h-6 w-6 items-center justify-center rounded ${colors.text}`}>
          <Icon size={14} />
        </span>
        <span className={`text-xs font-mono font-medium ${colors.text} flex-1`}>
          {block.modifier && block.modifier !== 'default' && block.modifier + ' '}
          {block.dataType && block.type !== 'class' && block.type !== 'method' ? block.dataType + ' ' : ''}
          {block.dataType && block.type === 'method' ? block.dataType + ' ' : ''}
          {block.name || block.label}
          {block.extendsName ? ` extends ${block.extendsName}` : ''}
          {block.params?.length ? `(${block.params.map((p) => p.type + ' ' + p.name).join(', ')})` : ''}
          {block.type === 'forLoop' ? ` (${block.initExpr}; ${block.condition}; ${block.updateExpr})` : ''}
          {block.type === 'whileLoop' ? ` (${block.condition})` : ''}
          {block.type === 'ifElse' ? ` (${block.condition})` : ''}
          {block.type === 'print' ? `(${block.body || '""'})` : ''}
        </span>
        <button
          onClick={() => onEdit(block)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="Edit"
        >
          <Edit3 size={12} />
        </button>
        <button
          onClick={() => onDelete(block.id)}
          className="text-gray-500 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Children area */}
      {block.allowedChildren.length > 0 && (
        <div
          className={`min-h-[28px] p-2 space-y-2 ${isDropTarget ? 'bg-emerald-500/5' : ''} ${showInvalid ? 'bg-red-500/10' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {block.children && block.children.length > 0 ? (
            block.children.map((child) => (
              <CanvasBlock
                key={child.id}
                block={child}
                depth={depth + 1}
                activeLine={activeLine}
                lineMap={lineMap}
                onDelete={onDelete}
                onEdit={onEdit}
                onDrop={onDrop}
                onDragStart={onDragStart}
              />
            ))
          ) : (
            <div className="text-[10px] text-gray-600 italic px-1 py-1">
              {showInvalid ? (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertTriangle size={10} /> Invalid placement — this block can't go here
                </span>
              ) : (
                <span>Drop {block.allowedChildren.join(', ')} blocks here...</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface EditModalProps {
  block: CodeBlock;
  onSave: (id: string, updates: Partial<CodeBlock>) => void;
  onClose: () => void;
}

function EditModal({ block, onSave, onClose }: EditModalProps) {
  const [name, setName] = useState(block.name || '');
  const [dataType, setDataType] = useState(block.dataType || 'int');
  const [modifier, setModifier] = useState(block.modifier || 'public');
  const [extendsName, setExtendsName] = useState(block.extendsName || '');
  const [condition, setCondition] = useState(block.condition || '');
  const [initExpr, setInitExpr] = useState(block.initExpr || '');
  const [updateExpr, setUpdateExpr] = useState(block.updateExpr || '');
  const [body, setBody] = useState(block.body || '');
  const [params, setParams] = useState(block.params || []);

  const show = {
    name: ['class', 'interface', 'field', 'method', 'constructor', 'node'].includes(block.type),
    dataType: ['field', 'method'].includes(block.type),
    modifier: ['field', 'method'].includes(block.type),
    extends: block.type === 'class',
    control: ['forLoop', 'whileLoop', 'ifElse'].includes(block.type),
    print: block.type === 'print',
    params: ['method', 'constructor'].includes(block.type),
  };

  const handleSave = () => {
    const updates: Partial<CodeBlock> = { name, dataType: dataType as any, modifier: modifier as any, params };
    if (show.extends) updates.extendsName = extendsName;
    if (show.control) {
      updates.condition = condition;
      if (block.type === 'forLoop') {
        updates.initExpr = initExpr;
        updates.updateExpr = updateExpr;
      }
    }
    if (show.print) updates.body = body;
    onSave(block.id, updates);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Edit Block: {block.label}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        {show.name && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        )}

        {show.modifier && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Access Modifier</label>
            <select
              value={modifier}
              onChange={(e) => setModifier(e.target.value as any)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="protected">protected</option>
              <option value="default">default (package-private)</option>
            </select>
          </div>
        )}

        {show.dataType && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Data Type</label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as any)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="int">int</option>
              <option value="String">String</option>
              <option value="double">double</option>
              <option value="boolean">boolean</option>
              <option value="void">void</option>
              <option value="char">char</option>
              <option value="long">long</option>
            </select>
          </div>
        )}

        {show.extends && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Extends (parent class)</label>
            <input
              value={extendsName}
              onChange={(e) => setExtendsName(e.target.value)}
              placeholder="e.g. Animal"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        )}

        {show.params && (
          <div>
            <label className="text-xs text-gray-400 block mb-2">Parameters</label>
            {params.map((p, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={p.type}
                  onChange={(e) => setParams(params.map((pp, j) => j === i ? { ...pp, type: e.target.value } : pp))}
                  placeholder="type"
                  className="w-1/3 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                />
                <input
                  value={p.name}
                  onChange={(e) => setParams(params.map((pp, j) => j === i ? { ...pp, name: e.target.value } : pp))}
                  placeholder="name"
                  className="w-2/3 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                />
                <button onClick={() => setParams(params.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setParams([...params, { name: 'param' + (params.length + 1), type: 'int' }])}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              + Add parameter
            </button>
          </div>
        )}

        {show.control && (
          <>
            {block.type === 'forLoop' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Init</label>
                  <input value={initExpr} onChange={(e) => setInitExpr(e.target.value)} placeholder="int i = 0" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Condition</label>
                  <input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="i < n" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Update</label>
                  <input value={updateExpr} onChange={(e) => setUpdateExpr(e.target.value)} placeholder="i++" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
                </div>
              </>
            )}
            {block.type !== 'forLoop' && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">Condition</label>
                <input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="true" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
              </div>
            )}
          </>
        )}

        {show.print && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Print content</label>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='"Hello World"'
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg px-4 py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface VisualCanvasProps {
  blocks: CodeBlock[];
  onBlocksChange: (blocks: CodeBlock[]) => void;
  onAddFromPalette: (block: PaletteBlockDef) => void;
  activeLine: number | null;
  lineMap: Map<number, CodeBlock>;
}

export function VisualCanvas({ blocks, onBlocksChange, onAddFromPalette, activeLine, lineMap }: VisualCanvasProps) {
  const [editingBlock, setEditingBlock] = useState<CodeBlock | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<CodeBlock | null>(null);
  const [showTemplateDrop, setShowTemplateDrop] = useState(false);
  const [showInvalidRoot, setShowInvalidRoot] = useState(false);

  const handleDelete = useCallback((id: string) => {
    onBlocksChange(removeBlockById(blocks, id));
  }, [blocks, onBlocksChange]);

  const handleEdit = useCallback((block: CodeBlock) => {
    setEditingBlock(block);
  }, []);

  const handleDrop = useCallback((parentId: string | null, child: CodeBlock) => {
    if (parentId === null) {
      if (canDropAtRoot(child.type)) {
        // Remove from existing location first
        const cleaned = removeBlockById(blocks, child.id);
        onBlocksChange([...cleaned, child]);
      } else {
        setShowInvalidRoot(true);
        setTimeout(() => setShowInvalidRoot(false), 1500);
      }
    } else {
      const cleaned = removeBlockById(blocks, child.id);
      onBlocksChange(addChildToBlock(cleaned, parentId, child));
    }
  }, [blocks, onBlocksChange]);

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setShowTemplateDrop(true);
  };

  const handleRootDragLeave = () => {
    setShowTemplateDrop(false);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setShowTemplateDrop(false);
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const parsed = JSON.parse(data) as { blockType: string; paletteBlock?: PaletteBlockDef; existingBlock?: CodeBlock };
        if (parsed.paletteBlock) {
          const newBlock = createBlockFromPalette(parsed.paletteBlock);
          if (canDropAtRoot(newBlock.type)) {
            onBlocksChange([...blocks, newBlock]);
          } else {
            setShowInvalidRoot(true);
            setTimeout(() => setShowInvalidRoot(false), 1500);
          }
        } else if (parsed.existingBlock) {
          handleDrop(null, parsed.existingBlock);
        }
      } catch {
        // ignore
      }
    }
  };

  const handleEditSave = (id: string, updates: Partial<CodeBlock>) => {
    onBlocksChange(updateBlockById(blocks, id, updates));
  };

  const loadTemplate = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      onBlocksChange(JSON.parse(JSON.stringify(template.blocks)));
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Canvas header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <h2 className="text-sm font-semibold text-gray-200">Visual Canvas</h2>
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => { if (e.target.value) loadTemplate(e.target.value); e.target.value = ''; }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
            defaultValue=""
          >
            <option value="">Load Template...</option>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Canvas area */}
      <div
        className={`flex-1 overflow-y-auto custom-scrollbar p-4 ${showTemplateDrop ? 'bg-emerald-500/5' : ''} ${showInvalidRoot ? 'bg-red-500/5' : ''}`}
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
      >
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`mb-4 ${showInvalidRoot ? 'text-red-400' : 'text-gray-600'}`}>
              {showInvalidRoot ? (
                <div className="flex flex-col items-center gap-2">
                  <AlertTriangle size={48} />
                  <p className="text-sm">Only class/interface blocks can go at the root level!</p>
                </div>
              ) : (
                <FileCode size={48} />
              )}
            </div>
            <p className="text-sm text-gray-500 mb-2">
              {showTemplateDrop ? 'Drop here to create a new class' : 'Drag blocks from the left panel or load a template to begin'}
            </p>
            <p className="text-xs text-gray-600">
              Classes go here → Fields & Methods go inside Classes → Logic goes inside Methods
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {blocks.map((block) => (
              <CanvasBlock
                key={block.id}
                block={block}
                depth={0}
                activeLine={activeLine}
                lineMap={lineMap}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onDrop={handleDrop}
                onDragStart={setDraggedBlock}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editingBlock && (
          <EditModal
            block={editingBlock}
            onSave={handleEditSave}
            onClose={() => setEditingBlock(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
