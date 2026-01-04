'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { ProjectListItem } from '@/components/project-list-item';
import { LockBanner } from '@/components/lock-banner';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-projects';
import { useWebSocket } from '@/hooks/use-websocket';
import { useUIStore } from '@/stores/ui-store';
import { Plus, FolderKanban } from 'lucide-react';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [dismissedLock, setDismissedLock] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const setCreateDialogOpen = useUIStore((s) => s.setCreateDialogOpen);

  // Connect WebSocket for real-time updates
  useWebSocket();

  // Find any locked project for banner
  const lockedProject = projects?.find(
    (p) => p.locks?.length && p.id !== dismissedLock
  );

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects?.filter((p) => p.name.toLowerCase().includes(query));
  }, [projects, searchQuery]);

  return (
    <>
      <Header
        searchBar={{
          placeholder: 'Search projects...',
          value: searchQuery,
          onChange: setSearchQuery,
        }}
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

      {/* Projects list - horizontal layout */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[72px] rounded-lg" />
            ))}
          </div>
        ) : filteredProjects?.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={searchQuery ? 'No projects found' : 'No projects yet'}
            description={
              searchQuery
                ? `No projects match "${searchQuery}"`
                : 'Get started by creating your first project to sync documentation'
            }
            action={
              searchQuery
                ? undefined
                : {
                    label: 'Create Project',
                    onClick: () => setCreateDialogOpen(true),
                  }
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filteredProjects?.map((project) => (
              <ProjectListItem key={project.id} project={project} />
            ))}

            {/* Add new project row */}
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-4 p-4 bg-card/50 border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-card transition-all duration-200 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  Add New Project
                </h3>
                <p className="text-sm text-muted-foreground">
                  Connect a new Git repository
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
