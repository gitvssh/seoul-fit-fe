import React from 'react';
import { cn } from '@/shared/lib/utils';

interface LogoMarkProps {
  size?: number;
  className?: string;
  /** 장식용이면 true (옆에 텍스트가 있을 때) */
  decorative?: boolean;
}

/** 서울핏 마크: 핀과 세 블록(서울의 능선)을 담은 둥근 사각형. 헤더·아이콘·OG가 같은 형태를 쓴다. */
export function LogoMark({ size = 36, className, decorative = true }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 48 48'
      className={cn('shrink-0', className)}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : 'Seoul Fit'}
    >
      <rect width='48' height='48' rx='12' fill='hsl(var(--primary))' />
      <path
        d='M24 10.3c2.9 0 5.3 2.4 5.3 5.3 0 3.5-5.3 8.2-5.3 8.2s-5.3-4.7-5.3-8.2c0-2.9 2.4-5.3 5.3-5.3Zm0 3a2.1 2.1 0 1 0 0 4.3 2.1 2.1 0 0 0 0-4.3Z'
        fill='hsl(var(--primary-foreground))'
      />
      <path d='M19.8 36.1V23.8l-6.3 3v10.9l6.3-1.6Z' fill='hsl(var(--primary-foreground))' />
      <path d='M20.9 33.4v-9l6.9 3v9.4l-6.9-3.4Z' fill='hsl(var(--primary-foreground))' />
      <path d='M28.7 36.8V22.4l5.7-2.7v14.3l-5.7 2.8Z' fill='hsl(var(--primary-foreground))' />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('text-section font-semibold tracking-tight text-foreground', className)}>
      Seoul Fit
    </span>
  );
}

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      <Wordmark />
    </span>
  );
}
