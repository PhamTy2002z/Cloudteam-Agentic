import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-slate-700 text-slate-200',
        success: 'bg-green-500/10 text-green-400',
        destructive: 'bg-red-500/10 text-red-400',
        warning: 'bg-amber-500/10 text-amber-400',
        outline: 'border border-slate-600 text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
