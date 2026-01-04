'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    icon?: LucideIcon;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {/* Decorative background pattern */}
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl scale-150" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50 shadow-sm">
          <Icon className="w-7 h-7 text-muted-foreground/80" />
        </div>
      </div>

      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground/80 mb-5 max-w-xs leading-relaxed">
        {description}
      </p>

      {action && (
        <Button
          onClick={action.onClick}
          disabled={action.loading}
          size="sm"
          className="h-9 shadow-sm"
        >
          {ActionIcon && (
            <ActionIcon className={`w-4 h-4 mr-2 ${action.loading ? 'animate-spin' : ''}`} />
          )}
          {action.label}
        </Button>
      )}
    </div>
  );
}
