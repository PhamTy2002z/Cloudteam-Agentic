'use client';

import { useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useUIStore } from '@/stores/ui-store';
import { debounce } from '@/lib/utils';
import type { OnMount, Monaco } from '@monaco-editor/react';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface MonacoEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onAutoSave?: (content: string) => void;
  readOnly?: boolean;
}

export function MonacoEditor({
  initialContent,
  onSave,
  onAutoSave,
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const setEditorDirty = useUIStore((s) => s.setEditorDirty);

  const debouncedAutoSave = useMemo(
    () =>
      debounce((value: string) => {
        onAutoSave?.(value);
      }, 2000),
    [onAutoSave],
  );

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const value = editor.getValue();
        onSave(value);
        setEditorDirty(false);
      });
    },
    [onSave, setEditorDirty],
  );

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        setEditorDirty(true);
        debouncedAutoSave(value);
      }
    },
    [setEditorDirty, debouncedAutoSave],
  );

  return (
    <Editor
      height="100%"
      defaultLanguage="markdown"
      defaultValue={initialContent}
      onChange={handleChange}
      onMount={handleMount}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: 'JetBrains Mono, monospace',
        wordWrap: 'on',
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
      }}
    />
  );
}
