'use client';

import { useState } from 'react';
import { FolderTree, RefreshCw, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SyncDocsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPath: string;
  isPending: boolean;
  onSync: (options: { path?: string; recursive?: boolean }) => void;
}

const PRESET_PATHS = [
  { label: 'Default (docs path)', value: '' },
  { label: 'Repository root', value: '.' },
  { label: 'docs/', value: 'docs' },
  { label: 'documentation/', value: 'documentation' },
  { label: 'wiki/', value: 'wiki' },
];

export function SyncDocsDialog({
  open,
  onOpenChange,
  defaultPath,
  isPending,
  onSync,
}: SyncDocsDialogProps) {
  const [path, setPath] = useState('');
  const [recursive, setRecursive] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleSync = () => {
    onSync({
      path: path || undefined,
      recursive: recursive || undefined,
    });
  };

  const selectPreset = (value: string) => {
    setPath(value);
    setShowPresets(false);
  };

  const displayPath = path || defaultPath;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            Sync Documents
          </DialogTitle>
          <DialogDescription>
            Choose which folder to sync markdown files from your repository.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Path input */}
          <div className="space-y-2">
            <Label htmlFor="sync-path">Folder path</Label>
            <div className="relative">
              <Input
                id="sync-path"
                placeholder={defaultPath || 'e.g., docs, wiki, or . for root'}
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Preset dropdown */}
            {showPresets && (
              <div className="border border-border rounded-lg bg-card shadow-lg overflow-hidden">
                {PRESET_PATHS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => selectPreset(preset.value)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>{preset.label}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {preset.value || defaultPath}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Leave empty to use default path. Use &quot;.&quot; to sync from repository root.
            </p>
          </div>

          {/* Recursive toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <input
              type="checkbox"
              id="recursive"
              checked={recursive}
              onChange={(e) => setRecursive(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <div className="flex-1">
              <Label htmlFor="recursive" className="cursor-pointer font-medium">
                Include subdirectories
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recursively sync all markdown files in nested folders
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Will sync from:</p>
            <p className="font-mono text-sm text-foreground">
              {displayPath === '.' ? '/ (repository root)' : `/${displayPath}/`}
              {recursive && <span className="text-primary">**</span>}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSync} disabled={isPending} variant="success">
            <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Syncing...' : 'Start Sync'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
