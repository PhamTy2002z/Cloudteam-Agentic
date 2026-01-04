'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Key, Copy, Check, Save, AlertCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { useProject, useDeleteProject, useUpdateProject } from '@/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ProjectSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { data: project, isLoading, refetch } = useProject(id);
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject(id);

  const [generatingKey, setGeneratingKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Token update state
  const [newToken, setNewToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState(false);

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

  const handleUpdateToken = async () => {
    if (!newToken.trim()) {
      setTokenError('Please enter a GitHub token');
      return;
    }

    setTokenError(null);
    setTokenSuccess(false);

    try {
      await updateProject.mutateAsync({ token: newToken });
      setNewToken('');
      setTokenSuccess(true);
      refetch();
      setTimeout(() => setTokenSuccess(false), 3000);
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : 'Failed to update token');
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

        {/* GitHub Token Update */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">GitHub Token</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Update your GitHub Personal Access Token if the current one is invalid or expired.
          </p>

          {tokenError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">{tokenError}</p>
            </div>
          )}

          {tokenSuccess && (
            <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <p className="text-sm text-success">Token updated successfully!</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              onClick={handleUpdateToken}
              disabled={updateProject.isPending || !newToken.trim()}
              className="bg-primary hover:bg-primary/90 text-white shrink-0"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateProject.isPending ? 'Updating...' : 'Update Token'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Token needs <code className="bg-secondary px-1 rounded">repo</code> scope for full access.
          </p>
        </Card>

        {/* API Keys */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">API Keys</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate API keys for Claude Code hook integration.
          </p>

          {newApiKey && (
            <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-primary mb-2">
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
            className="bg-primary hover:bg-primary/90 text-white"
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
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Button>
        </Link>
      </div>
    </>
  );
}
