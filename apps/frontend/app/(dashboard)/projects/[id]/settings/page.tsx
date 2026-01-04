'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Trash2,
  Key,
  Copy,
  Check,
  Save,
  AlertCircle,
  Settings,
  GitBranch,
  Shield,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/header';
import { useProject, useDeleteProject, useUpdateProject } from '@/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

type SettingsSection = 'general' | 'github' | 'api-keys' | 'danger';

const NAV_ITEMS: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'github', label: 'GitHub Integration', icon: GitBranch },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'danger', label: 'Danger Zone', icon: Shield },
];

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

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
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

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Settings Navigation Sidebar */}
        <aside className="w-64 border-r border-border bg-card/50 p-4 shrink-0">
          <Link href={`/projects/${id}`}>
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </Link>

          <Separator className="mb-4" />

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isDanger = item.id === 'danger';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? isDanger
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-primary/10 text-primary'
                      : isDanger
                        ? 'text-destructive/70 hover:bg-destructive/5 hover:text-destructive'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Settings Content */}
        <main className="flex-1 p-8 max-w-3xl">
          {/* General Section */}
          {activeSection === 'general' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">General Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  View and manage your project configuration
                </p>
              </div>

              <Card className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderGit2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Project Name</Label>
                      <p className="text-lg font-medium text-foreground mt-1">{project.name}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Repository</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-foreground font-mono text-sm truncate">{project.repoUrl}</p>
                      <a
                        href={`https://github.com/${project.repoUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Branch</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <GitBranch className="w-4 h-4 text-muted-foreground" />
                        <p className="text-foreground">{project.branch}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Docs Path</Label>
                      <p className="text-foreground font-mono text-sm mt-1">{project.docsPath}/</p>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* GitHub Integration Section */}
          {activeSection === 'github' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">GitHub Integration</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your GitHub Personal Access Token for repository sync
                </p>
              </div>

              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#24292e] flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Personal Access Token</h3>
                      <p className="text-xs text-muted-foreground">Used for syncing documentation from your repository</p>
                    </div>
                  </div>

                  <Separator />

                  {tokenError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                      <p className="text-sm text-destructive">{tokenError}</p>
                    </div>
                  )}

                  {tokenSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <p className="text-sm text-emerald-500">Token updated successfully!</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="github-token">New Token</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="github-token"
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={handleUpdateToken}
                        disabled={updateProject.isPending || !newToken.trim()}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProject.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Token requires <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">repo</code> scope for full access.{' '}
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Generate new token
                      </a>
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* API Keys Section */}
          {activeSection === 'api-keys' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">API Keys</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate and manage API keys for Claude Code hook integration
                </p>
              </div>

              {newApiKey && (
                <Card className="p-4 border-primary/50 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary">New API Key Generated</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Copy this key now. It will not be shown again.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Input
                          value={newApiKey}
                          readOnly
                          className="font-mono text-sm bg-background"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyKey}
                          className="shrink-0"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Generate New Key</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a new API key for hook integration
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateKey}
                    disabled={generatingKey}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {generatingKey ? 'Generating...' : 'Generate Key'}
                  </Button>
                </div>

                {project.apiKeys && project.apiKeys.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active keys</span>
                      <span className="font-medium text-foreground">
                        {project.apiKeys.filter((k) => k.isActive).length}
                      </span>
                    </div>
                  </>
                )}
              </Card>
            </section>
          )}

          {/* Danger Zone Section */}
          {activeSection === 'danger' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Irreversible and destructive actions
                </p>
              </div>

              <Card className="p-6 border-destructive/30 bg-destructive/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-foreground">Delete Project</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently delete this project and all associated data including synced documents and API keys.
                      This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteProject.isPending}
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteProject.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </Card>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
