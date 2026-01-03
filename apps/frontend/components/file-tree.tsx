'use client';

import { File, Folder, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Doc } from '@/lib/api';

interface FileTreeProps {
  docs: Doc[];
  activeDoc?: string;
  onSelect: (fileName: string) => void;
  onRefresh?: () => void;
}

export function FileTree({ docs, activeDoc, onSelect, onRefresh }: FileTreeProps) {
  return (
    <aside className="w-56 border-r border-border bg-brand-dark-darker flex flex-col shrink-0">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Explorer
        </span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5 text-sm">
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
                    ? 'bg-brand-cyan/20 text-brand-cyan'
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
