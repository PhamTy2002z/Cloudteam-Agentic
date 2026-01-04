import { Badge } from '@/components/ui/badge';
import type { Lock } from '@/lib/api';

interface LockStatusProps {
  lock?: Lock | null;
}

export function LockStatus({ lock }: LockStatusProps) {
  const isLocked = !!lock;

  return (
    <Badge variant={isLocked ? 'destructive' : 'default'} className={`px-2 py-0.5 text-xs ${isLocked ? '' : 'bg-success text-success-foreground'}`}>
      <span
        className={`w-2 h-2 shrink-0 rounded-full ${
          isLocked ? 'bg-red-500 pulse-dot' : 'bg-green-500'
        }`}
      />
      {isLocked ? 'Locked' : 'Unlocked'}
    </Badge>
  );
}
