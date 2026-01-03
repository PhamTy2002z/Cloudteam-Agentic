'use client';

import { useMemo } from 'react';

interface MarkdownPreviewProps {
  content: string;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const html = useMemo(() => {
    // Escape HTML first to prevent XSS
    const escaped = escapeHtml(content);

    return escaped
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-foreground mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-foreground mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-foreground mb-4 pb-2 border-b border-border">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-secondary px-2 py-0.5 rounded text-brand-cyan text-sm font-mono">$1</code>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 text-muted-foreground">$1</li>')
      .replace(/\n\n/g, '</p><p class="text-muted-foreground mb-4">')
      .replace(/^(?!<[h|l])/gm, '<p class="text-muted-foreground mb-4">');
  }, [content]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <article
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
