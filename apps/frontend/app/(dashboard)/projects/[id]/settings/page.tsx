'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Key, Copy, Check } from 'lucide-react';
import { Header } from '@/components/header';
import { useProject, useDeleteProject } from '@/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: project, isLoading } = useProject(id);
  const deleteProject = useDeleteProject();

  const [generatingKey, setGeneratingKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    try {
      const result = await api.generateApiKey(id, 'Hook Integration');
      setNewApiKey(result.key);
    } catch (error) {
      console.error('Failed to generate API key:', error);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject.mutateAsync(id);
      router.push('/projects');
    }
  };

  if (isLoading || !project) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Header title="Project Settings" description={project.name} />

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Project Info */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Project Information</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="text-foreground">{project.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Repository</Label>
              <p className="text-foreground font-mono text-sm">{project.repoUrl}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Branch</Label>
                <p className="text-foreground">{project.branch}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Docs Path</Label>
                <p className="text-foreground">{project.docsPath}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* API Keys */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">API Keys</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate API keys for Claude Code hook integration.
          </p>

          {newApiKey && (
            <div className="mb-4 p-4 bg-brand-cyan/10 border border-brand-cyan/30 rounded-lg">
              <p className="text-sm text-brand-cyan mb-2">
                Copy this key now. It will not be shown again.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={newApiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerateKey}
            disabled={generatingKey}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
          >
            <Key className="w-4 h-4 mr-2" />
            {generatingKey ? 'Generating...' : 'Generate New Key'}
          </Button>

          {project.apiKeys && project.apiKeys.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Active keys: {project.apiKeys.filter((k) => k.isActive).length}
              </p>
            </div>
          )}
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/50">
          <h3 className="font-semibold text-destructive mb-4">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting a project will remove all synced documents and API keys.
          </p>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProject.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
          </Button>
        </Card>

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
