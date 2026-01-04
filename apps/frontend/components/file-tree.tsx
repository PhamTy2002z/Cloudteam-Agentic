'use client';

import { File, Folder, RefreshCw, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Doc } from '@/lib/api';

interface FileTreeProps {
  docs: Doc[];
  activeDoc?: string;
  onSelect: (fileName: string) => void;
  onRefresh?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function FileTree({ docs, activeDoc, onSelect, onRefresh, isOpen = true, onToggle }: FileTreeProps) {
  return (
    <aside
      className={cn(
        "border-r border-border bg-brand-dark-darker flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "w-56" : "w-12"
      )}
    >
      <div className={cn(
        "border-b border-border flex items-center shrink-0",
        isOpen ? "p-3 justify-between" : "p-2 justify-center"
      )}>
        {isOpen && (
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Explorer
          </span>
        )}
        <div className="flex items-center gap-1">
          {onRefresh && isOpen && (
            <button
              onClick={onRefresh}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition cursor-pointer"
              title={isOpen ? "Hide Explorer" : "Show Explorer"}
            >
              {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      <div className={cn(
        "flex-1 overflow-y-auto p-2 transition-opacity duration-200",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className="space-y-0.5 text-sm whitespace-nowrap">
          {/* docs folder */}
          <div className="flex items-center gap-2 px-2 py-1.5 text-foreground">
            <Folder className="w-4 h-4 text-yellow-500" />
            <span>docs</span>
          </div>

          {/* Files */}
          <div className="pl-4 space-y-0.5">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelect(doc.fileName)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-left transition',
                  activeDoc === doc.fileName
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <File className="w-4 h-4 shrink-0" />
                <span className="truncate">{doc.fileName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
