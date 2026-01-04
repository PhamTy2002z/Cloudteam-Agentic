'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  AlertCircle,
  GitBranch,
  FolderOpen,
} from 'lucide-react';
import { Header } from '@/components/header';
import { useProject } from '@/hooks/use-projects';
import { useDocs, useSyncDocs } from '@/hooks/use-docs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LockStatus } from '@/components/lock-status';
import { EmptyState } from '@/components/empty-state';
import { toast } from 'sonner';

// File metadata mapping for better UX
const getFileMetadata = (fileName: string) => {
  const name = fileName.toLowerCase();

  if (name.includes('readme') || name.includes('overview') || name.includes('pdr')) {
    return { category: 'Overview', description: 'Project overview and requirements' };
  }
  if (name.includes('code-standard') || name.includes('standards')) {
    return { category: 'Standards', description: 'Coding conventions and guidelines' };
  }
  if (name.includes('deploy') || name.includes('vps')) {
    return { category: 'Deployment', description: 'Deployment and infrastructure' };
  }
  if (name.includes('design') || name.includes('ui') || name.includes('ux')) {
    return { category: 'Design', description: 'UI/UX guidelines and design system' };
  }
  if (name.includes('roadmap') || name.includes('plan')) {
    return { category: 'Planning', description: 'Project roadmap and milestones' };
  }
  if (name.includes('architecture') || name.includes('system')) {
    return { category: 'Architecture', description: 'System architecture and design patterns' };
  }
  if (name.includes('codebase') || name.includes('summary')) {
    return { category: 'Codebase', description: 'Codebase structure and summary' };
  }
  if (name.includes('tech') || name.includes('stack')) {
    return { category: 'Tech Stack', description: 'Technologies and dependencies' };
  }
  return { category: 'Document', description: 'Documentation file' };
};

export default function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: project, isLoading } = useProject(params.id);
  const { data: docs, refetch: refetchDocs } = useDocs(params.id);
  const syncDocs = useSyncDocs(params.id);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncError(null);
    try {
      await syncDocs.mutateAsync();
      refetchDocs();
      toast.success('Documents synced successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      if (message.includes('credentials') || message.includes('401')) {
        setSyncError('Invalid GitHub token. Please update your token in Settings.');
      } else if (message.includes('Not Found') || message.includes('404')) {
        setSyncError(`Folder "${project?.docsPath}" not found in repository.`);
      } else {
        setSyncError(message);
      }
      toast.error('Sync failed');
    }
  };

  // Sort docs by category for better organization
  const sortedDocs = useMemo(() => {
    if (!docs) return [];
    return [...docs].sort((a, b) => {
      const metaA = getFileMetadata(a.fileName);
      const metaB = getFileMetadata(b.fileName);
      // Overview first, then alphabetically by category
      if (metaA.category === 'Overview') return -1;
      if (metaB.category === 'Overview') return 1;
      return metaA.category.localeCompare(metaB.category);
    });
  }, [docs]);

  if (isLoading || !project) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  const lock = project.locks?.[0];
  const hasDocs = sortedDocs.length > 0;

  return (
    <>
      <Header
        title={project.name}
        description={project.repoUrl}
        action={{
          label: 'Settings',
          onClick: () => window.location.href = `/projects/${params.id}/settings`,
        }}
      />

      <div className="p-6 space-y-6">
        {/* Project Info - Compact Modern Card */}
        <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{project.branch}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-sm text-muted-foreground">{project.docsPath}/</span>
                </div>
              </div>
            </div>
            <LockStatus lock={lock} />
          </div>
        </Card>

        {/* Sync Error Alert */}
        {syncError && (
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-destructive text-sm">Sync Failed</p>
                <p className="text-sm text-muted-foreground mt-0.5">{syncError}</p>
                {syncError.includes('token') && (
                  <Link href={`/projects/${params.id}/settings`}>
                    <Button variant="outline" size="sm" className="mt-3 h-8 text-xs">
                      Go to Settings
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Documents Section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Documentation</h3>
              {hasDocs && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {sortedDocs.length} file{sortedDocs.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>
            <Button
              onClick={handleSync}
              disabled={syncDocs.isPending}
              size="sm"
              className="h-9"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncDocs.isPending ? 'animate-spin' : ''}`} />
              {syncDocs.isPending ? 'Syncing...' : 'Sync from GitHub'}
            </Button>
          </div>

          {hasDocs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedDocs.map((doc, index) => {
                const meta = getFileMetadata(doc.fileName);

                return (
                  <Link
                    key={doc.id}
                    href={`/editor/${params.id}/${encodeURIComponent(doc.fileName)}`}
                    className={lock ? 'pointer-events-none opacity-50' : 'group'}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Card className="h-full card-hover-lift card-entrance rounded-xl border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-200 overflow-hidden">
                      <div className="flex h-full">
                        {/* Accent bar - single color */}
                        <div className="w-1 bg-primary/60 shrink-0 group-hover:bg-primary transition-colors duration-200" />

                        {/* Content */}
                        <div className="flex-1 p-4 space-y-2">
                          <p className="font-medium text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                            {doc.fileName.replace('.md', '')}
                          </p>

                          <p className="text-xs text-muted-foreground/70 line-clamp-1">
                            {meta.description}
                          </p>

                          {/* Footer */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                              {meta.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50 font-mono">
                              v{doc.version}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="p-10 border-dashed border-border/50 bg-card/30">
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description={`Click "Sync from GitHub" to pull documentation files from your repository's ${project.docsPath}/ folder.`}
                action={{
                  label: syncDocs.isPending ? 'Syncing...' : 'Sync from GitHub',
                  onClick: handleSync,
                  loading: syncDocs.isPending,
                  icon: RefreshCw,
                }}
              />
            </Card>
          )}
        </div>

        {/* Back link */}
        <div className="pt-2">
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
