import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LockStatus } from '@/components/lock-status';

describe('LockStatus', () => {
  it('renders unlocked when no lock', () => {
    render(<LockStatus lock={null} />);
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
  });

  it('renders unlocked when lock undefined', () => {
    render(<LockStatus lock={undefined} />);
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
  });

  it('renders locked when lock exists', () => {
    const lock = {
      id: 'lock-1',
      projectId: 'test-1',
      lockedBy: 'TechLead',
      lockedAt: new Date().toISOString(),
    };

    render(<LockStatus lock={lock} />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('has correct styling for locked state', () => {
    const lock = {
      id: 'lock-1',
      projectId: 'test-1',
      lockedBy: 'TechLead',
      lockedAt: new Date().toISOString(),
    };

    const { container } = render(<LockStatus lock={lock} />);
    // Check for red indicator dot when locked
    const indicator = container.querySelector('.bg-red-500');
    expect(indicator).toBeInTheDocument();
  });

  it('has green indicator for unlocked state', () => {
    const { container } = render(<LockStatus lock={null} />);
    const indicator = container.querySelector('.bg-green-500');
    expect(indicator).toBeInTheDocument();
  });
});
