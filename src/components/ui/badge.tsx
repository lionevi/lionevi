import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/12 text-primary-600 ring-1 ring-primary/25',
        secondary: 'bg-secondary/15 text-secondary-700 ring-1 ring-secondary/30',
        accent: 'bg-accent/12 text-accent ring-1 ring-accent/25',
        outline: 'border border-border text-muted-foreground',
        success: 'bg-success/12 text-[#15803D] ring-1 ring-success/30',
        warning: 'bg-warning/12 text-[#B45309] ring-1 ring-warning/30',
        error: 'bg-error/10 text-error ring-1 ring-error/30',
        muted: 'bg-muted text-muted-foreground ring-1 ring-border',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps): React.JSX.Element {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
