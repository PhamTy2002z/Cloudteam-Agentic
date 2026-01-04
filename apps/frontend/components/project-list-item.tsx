'use client';

import Link from 'next/link';
import { Settings, FileText, GitBranch, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LockStatus } from './lock-status';
import { formatRelativeTime } from '@/lib/utils';
import type { Project } from '@/lib/api';

interface ProjectListItemProps {
  project: Project;
}

export function ProjectListItem({ project }: ProjectListItemProps) {
  const lock = project.locks?.[0];
  const isLocked = !!lock;

  // Extract org/repo from URL
  const repoMatch = project.repoUrl.match(/github\.com\/(.+)/);
  const repoName = repoMatch ? repoMatch[1].replace('.git', '') : project.repoUrl;

  return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-card/80 transition-all duration-200">
        {/* Project Icon */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>

        {/* Project Info - Main */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <LockStatus lock={lock} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 truncate">
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{repoName}</span>
            </span>
          </div>
        </div>

        {/* Last Activity */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground min-w-[140px]">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {isLocked ? (
            <span>Locked {formatRelativeTime(lock.lockedAt)}</span>
          ) : (
            <span>Updated {formatRelativeTime(project.updatedAt)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={isLocked ? 'secondary' : 'default'}
            size="sm"
            className="hidden sm:flex"
          >
            {isLocked ? 'View Only' : 'Open'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/projects/${project.id}/settings`;
            }}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(project.repoUrl, '_blank');
            }}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
