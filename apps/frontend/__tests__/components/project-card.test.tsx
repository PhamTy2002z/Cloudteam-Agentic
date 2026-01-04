import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectCard } from '@/components/project-card';
import type { Project } from '@/lib/api';

// Mock date utilities
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return {
    ...actual,
    formatRelativeTime: () => '2 hours ago',
  };
});

const mockProject: Project = {
  id: 'test-1',
  name: 'Test Project',
  repoUrl: 'https://github.com/test/repo',
  branch: 'main',
  docsPath: 'docs',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  locks: [],
};

describe('ProjectCard', () => {
  it('renders project name', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('shows repo path from URL', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('test/repo')).toBeInTheDocument();
  });

  it('shows unlocked badge when no lock', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
  });

  it('shows locked badge when lock exists', () => {
    const lockedProject: Project = {
      ...mockProject,
      locks: [
        {
          id: 'lock-1',
          projectId: 'test-1',
          lockedBy: 'TechLead',
          lockedAt: new Date().toISOString(),
        },
      ],
    };

    render(<ProjectCard project={lockedProject} />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('shows Open Project button when unlocked', () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText('Open Project')).toBeInTheDocument();
  });

  it('shows View Only button when locked', () => {
    const lockedProject: Project = {
      ...mockProject,
      locks: [
        {
          id: 'lock-1',
          projectId: 'test-1',
          lockedBy: 'TechLead',
          lockedAt: new Date().toISOString(),
        },
      ],
    };

    render(<ProjectCard project={lockedProject} />);
    expect(screen.getByText('View Only')).toBeInTheDocument();
  });

  it('shows who locked the project', () => {
    const lockedProject: Project = {
      ...mockProject,
      locks: [
        {
          id: 'lock-1',
          projectId: 'test-1',
          lockedBy: 'TechLead',
          lockedAt: new Date().toISOString(),
        },
      ],
    };

    render(<ProjectCard project={lockedProject} />);
    expect(screen.getByText(/Locked by TechLead/)).toBeInTheDocument();
  });
});
