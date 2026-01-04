'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { useProject } from '@/hooks/use-projects';
import { useDocs, useSyncDocs } from '@/hooks/use-docs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LockStatus } from '@/components/lock-status';

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      // Parse common GitHub errors
      if (message.includes('credentials') || message.includes('401')) {
        setSyncError('Invalid GitHub token. Please update your token in Settings.');
      } else if (message.includes('Not Found') || message.includes('404')) {
        setSyncError(`Folder "${project?.docsPath}" not found in repository.`);
      } else {
        setSyncError(message);
      }
    }
  };

  if (isLoading || !project) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  const lock = project.locks?.[0];
  const hasDocs = docs && docs.length > 0;

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
        {/* Project Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Project Details</h2>
              <p className="text-sm text-muted-foreground">Branch: {project.branch} | Docs: {project.docsPath}</p>
            </div>
            <LockStatus lock={lock} />
          </div>
        </Card>

        {/* Sync Error Alert */}
        {syncError && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Sync Failed</p>
                <p className="text-sm text-destructive/80 mt-1">{syncError}</p>
                {syncError.includes('token') && (
                  <Link href={`/projects/${params.id}/settings`}>
                    <Button variant="outline" size="sm" className="mt-3 border-destructive text-destructive hover:bg-destructive hover:text-white">
                      Go to Settings
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Documents List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Documents</h3>
            <Button
              onClick={handleSync}
              disabled={syncDocs.isPending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncDocs.isPending ? 'animate-spin' : ''}`} />
              {syncDocs.isPending ? 'Syncing...' : 'Sync from GitHub'}
            </Button>
          </div>

          {hasDocs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/editor/${params.id}/${encodeURIComponent(doc.fileName)}`}
                  className={lock ? 'pointer-events-none opacity-50' : ''}
                >
                  <Card className="p-6 hover:border-primary/50 transition cursor-pointer rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">v{doc.version}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No documents yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Click &quot;Sync from GitHub&quot; to pull documentation files from your repository&apos;s {project.docsPath}/ folder.
              </p>
              <Button
                onClick={handleSync}
                disabled={syncDocs.isPending}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncDocs.isPending ? 'animate-spin' : ''}`} />
                {syncDocs.isPending ? 'Syncing...' : 'Sync from GitHub'}
              </Button>
            </Card>
          )}
        </div>

        {/* Back link */}
        <Link href="/projects">
          <Button variant="ghost" className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    </>
  );
}
