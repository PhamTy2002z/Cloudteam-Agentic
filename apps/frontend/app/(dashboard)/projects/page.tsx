'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { ProjectCard } from '@/components/project-card';
import { LockBanner } from '@/components/lock-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-projects';
import { useWebSocket } from '@/hooks/use-websocket';
import { useUIStore } from '@/stores/ui-store';
import { Plus } from 'lucide-react';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [dismissedLock, setDismissedLock] = useState<string | null>(null);
  const setCreateDialogOpen = useUIStore((s) => s.setCreateDialogOpen);

  // Connect WebSocket for real-time updates
  useWebSocket();

  // Find any locked project for banner
  const lockedProject = projects?.find(
    (p) => p.locks?.length && p.id !== dismissedLock
  );

  return (
    <>
      <Header
        title="Projects"
        description="Manage your documentation sync projects"
        action={{
          label: 'New Project',
          onClick: () => setCreateDialogOpen(true),
        }}
      />

      {/* Lock banner */}
      {lockedProject?.locks?.[0] && (
        <LockBanner
          lock={lockedProject.locks[0]}
          onDismiss={() => setDismissedLock(lockedProject.id)}
        />
      )}

      {/* Projects grid */}
      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[200px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects?.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}

            {/* Add new project card */}
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-card/50 border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[200px] hover:border-brand-cyan/50 hover:bg-card transition cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-secondary group-hover:bg-brand-cyan/20 flex items-center justify-center mb-3 transition">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-brand-cyan transition" />
              </div>
              <h3 className="font-medium text-muted-foreground group-hover:text-foreground transition">
                Add New Project
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Connect a new Git repository
              </p>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
