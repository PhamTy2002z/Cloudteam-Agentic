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
      <DialogContent onClose={() => setCreateDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Connect a GitHub repository to sync documentation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="My Project"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repoUrl">Repository URL</Label>
            <Input
              id="repoUrl"
              name="repoUrl"
              placeholder="https://github.com/org/repo"
              value={formData.repoUrl}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">GitHub Token (PAT)</Label>
            <Input
              id="token"
              name="token"
              type="password"
              placeholder="ghp_..."
              value={formData.token}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Token is encrypted before storage. Needs repo read/write access.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                name="branch"
                placeholder="main"
                value={formData.branch}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="docsPath">Docs Path</Label>
              <Input
                id="docsPath"
                name="docsPath"
                placeholder="docs"
                value={formData.docsPath}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
              disabled={createProject.isPending}
            >
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
