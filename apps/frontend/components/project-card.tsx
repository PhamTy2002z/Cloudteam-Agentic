'use client';

import Link from 'next/link';
import { Settings, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LockStatus } from './lock-status';
import { formatRelativeTime } from '@/lib/utils';
import type { Project } from '@/lib/api';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const lock = project.locks?.[0];
  const isLocked = !!lock;

  // Extract org/repo from URL
  const repoMatch = project.repoUrl.match(/github\.com\/(.+)/);
  const repoName = repoMatch ? repoMatch[1].replace('.git', '') : project.repoUrl;

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="p-6 card-hover-lift group cursor-pointer bg-card rounded-lg hover:border-primary/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{repoName}</p>
            </div>
          </div>
          <LockStatus lock={lock} />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          {isLocked ? (
            <>
              <span>Locked by {lock.lockedBy}</span>
              <span className="text-border">|</span>
              <span>{formatRelativeTime(lock.lockedAt)}</span>
            </>
          ) : (
            <span>Last synced {formatRelativeTime(project.updatedAt)}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Button
            variant={isLocked ? 'secondary' : 'default'}
            disabled={isLocked}
            className="flex-1"
            size="sm"
          >
            {isLocked ? 'View Only' : 'Open Project'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/projects/${project.id}/settings`;
            }}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </Card>
    </Link>
  );
}
