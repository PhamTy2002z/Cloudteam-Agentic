'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MonacoEditor } from '@/components/monaco-editor';
import { MarkdownPreview } from '@/components/markdown-preview';
import { FileTree } from '@/components/file-tree';
import { useProject } from '@/hooks/use-projects';
import { useDoc, useDocs, useUpdateDoc, usePushDoc, useSyncDocs } from '@/hooks/use-docs';
import { useLock, useAcquireLock, useReleaseLock } from '@/hooks/use-lock';
import { useWebSocket } from '@/hooks/use-websocket';
import { useUIStore } from '@/stores/ui-store';

export default function EditorPage({
  params,
}: {
  params: { projectId: string; docId: string };
}) {
  const { projectId, docId } = params;
  const router = useRouter();
  const fileName = decodeURIComponent(docId);

  const { data: project } = useProject(projectId);
  const { data: docs, refetch: refetchDocs } = useDocs(projectId);
  const { data: doc, isLoading } = useDoc(projectId, fileName);
  const { data: lock } = useLock(projectId);
  const updateDoc = useUpdateDoc(projectId, fileName);
  const pushDoc = usePushDoc(projectId, fileName);
  const syncDocs = useSyncDocs(projectId);
  const acquireLock = useAcquireLock(projectId);
  const releaseLock = useReleaseLock(projectId);

  const editorDirty = useUIStore((s) => s.editorDirty);
  const setEditorDirty = useUIStore((s) => s.setEditorDirty);

  // Track if we acquired lock to properly clean up
  const hasAcquiredLock = useRef(false);

  // Connect WebSocket
  useWebSocket(projectId);

  // Acquire lock on mount, release on unmount
  useEffect(() => {
    if (!lock && !hasAcquiredLock.current) {
      hasAcquiredLock.current = true;
      acquireLock.mutate({ lockedBy: 'Tech Lead', reason: `Editing ${fileName}` });
    }

    return () => {
      if (hasAcquiredLock.current) {
        releaseLock.mutate();
        hasAcquiredLock.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (content: string) => {
    await updateDoc.mutateAsync(content);
    setEditorDirty(false);
  };

  const handlePush = async () => {
    await pushDoc.mutateAsync();
  };

  const handleRefresh = () => {
    syncDocs.mutate();
    refetchDocs();
  };

  const handleSelectDoc = (newFileName: string) => {
    router.push(`/editor/${projectId}/${encodeURIComponent(newFileName)}`);
  };

  if (isLoading || !doc) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-brand-dark">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-brand-dark-darker shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-foreground">{project?.name}</h1>
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg">
          <span className="text-sm text-foreground font-mono">{fileName}</span>
          {editorDirty && (
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Modified" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-success text-success-foreground">Editing</Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave(doc.content)}
            disabled={updateDoc.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateDoc.isPending ? 'Saving...' : 'Save'}
          </Button>

          <Button
            size="sm"
            onClick={handlePush}
            disabled={pushDoc.isPending}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            {pushDoc.isPending ? 'Pushing...' : 'Push'}
          </Button>

          <Link href={`/projects/${projectId}/settings`}>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* File tree */}
        <FileTree
          docs={docs || []}
          activeDoc={fileName}
          onSelect={handleSelectDoc}
          onRefresh={handleRefresh}
        />

        {/* Editor + Preview split */}
        <div className="flex-1 flex">
          <div className="flex-1 border-r border-border">
            <MonacoEditor
              initialContent={doc.content}
              onSave={handleSave}
              onAutoSave={handleSave}
            />
          </div>
          <div className="w-[45%] flex flex-col bg-brand-dark-darker">
            <div className="h-9 bg-secondary border-b border-border flex items-center px-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Preview
              </span>
            </div>
            <MarkdownPreview content={doc.content} />
          </div>
        </div>
      </div>
    </div>
  );
}
