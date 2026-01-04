'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProject } from '@/hooks/use-projects';
import { useUIStore } from '@/stores/ui-store';
import {
  FolderKanban,
  Github,
  KeyRound,
  GitBranch,
  FolderOpen,
  Loader2,
  Plus,
} from 'lucide-react';

export function CreateProjectDialog() {
  const { createDialogOpen, setCreateDialogOpen } = useUIStore();
  const createProject = useCreateProject();

  const [formData, setFormData] = useState({
    name: '',
    repoUrl: '',
    token: '',
    branch: 'main',
    docsPath: 'docs',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProject.mutateAsync(formData);
      setCreateDialogOpen(false);
      setFormData({
        name: '',
        repoUrl: '',
        token: '',
        branch: 'main',
        docsPath: 'docs',
      });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent
        onClose={() => setCreateDialogOpen(false)}
        className="sm:max-w-[480px] p-0 gap-0 overflow-hidden"
      >
        {/* Header with gradient accent */}
        <div className="relative px-6 pt-6 pb-4 border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Create New Project</DialogTitle>
                <DialogDescription className="mt-0.5">
                  Connect a GitHub repository to sync documentation
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Form content */}
          <div className="px-6 py-5 space-y-5">
            {/* Project Info Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <FolderKanban className="w-3.5 h-3.5" />
                Project Info
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Project Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Awesome Project"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="h-10"
                />
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-border/50" />

            {/* GitHub Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Github className="w-3.5 h-3.5" />
                GitHub Connection
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="repoUrl" className="text-sm font-medium">
                  Repository URL
                </Label>
                <Input
                  id="repoUrl"
                  name="repoUrl"
                  placeholder="https://github.com/org/repo"
                  value={formData.repoUrl}
                  onChange={handleChange}
                  required
                  className="h-10 font-mono text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="token"
                  className="text-sm font-medium flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                  Access Token (PAT)
                </Label>
                <Input
                  id="token"
                  name="token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={formData.token}
                  onChange={handleChange}
                  required
                  className="h-10 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground/80 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-green-500" />
                  Encrypted at rest • Requires repo read/write scope
                </p>
              </div>

              {/* Branch & Path - Compact row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="branch"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                    Branch
                  </Label>
                  <Input
                    id="branch"
                    name="branch"
                    placeholder="main"
                    value={formData.branch}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="docsPath"
                    className="text-sm font-medium flex items-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    Docs Path
                  </Label>
                  <Input
                    id="docsPath"
                    name="docsPath"
                    placeholder="docs"
                    value={formData.docsPath}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 bg-muted/30 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProject.isPending}
              className="h-9 min-w-[120px]"
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
