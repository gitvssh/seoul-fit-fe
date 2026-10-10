import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-body-sm font-medium outline-none transition-[color,background-color,border-color,box-shadow] duration-fast ease-standard focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
        outline:
          'border border-input/60 bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:border-input/50 dark:bg-input/20 dark:hover:bg-input/40',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/60',
        link: 'text-primary underline-offset-4 hover:underline',
        /** Floating control over the map: solid surface, hairline border and float shadow. */
        float:
          'border border-border bg-surface-elevated text-surface-elevated-foreground shadow-float-md hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 rounded-md px-3 text-label has-[>svg]:px-2.5',
        lg: 'h-11 rounded-md px-6 text-body has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        /** 44px touch target for map controls (WCAG 2.5.5). */
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
