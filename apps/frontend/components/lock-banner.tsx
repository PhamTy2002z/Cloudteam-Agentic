'use client';

import { X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import type { Lock as LockType } from '@/lib/api';

interface LockBannerProps {
  lock: LockType;
  onDismiss?: () => void;
}

export function LockBanner({ lock, onDismiss }: LockBannerProps) {
  return (
    <div className="mx-6 mt-4 bg-gradient-to-r from-red-950 to-red-900 border-l-4 border-red-500 rounded-r-lg p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
        <Lock className="w-5 h-5 text-red-400 pulse-dot" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-red-200 font-medium">Project is locked</div>
        <div className="text-red-300/70 text-sm truncate">
          Locked by {lock.lockedBy} {formatRelativeTime(lock.lockedAt)}
          {lock.reason && ` - ${lock.reason}`}
        </div>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="text-red-300 hover:text-white hover:bg-red-800/50 shrink-0"
        >
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
