'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { Header } from '@/components/header';
import { useProject } from '@/hooks/use-projects';
import { useDocs } from '@/hooks/use-docs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LockStatus } from '@/components/lock-status';

export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading } = useProject(id);
  const { data: docs } = useDocs(id);

  if (isLoading || !project) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  const lock = project.locks?.[0];

  return (
    <>
      <Header
        title={project.name}
        description={project.repoUrl}
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

        {/* Documents List */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs?.map((doc) => (
              <Link
                key={doc.id}
                href={`/editor/${id}/${encodeURIComponent(doc.fileName)}`}
                className={lock ? 'pointer-events-none opacity-50' : ''}
              >
                <Card className="p-4 hover:border-brand-cyan/50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-cyan/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-cyan" />
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
