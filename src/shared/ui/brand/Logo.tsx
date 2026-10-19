import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/utils';
import { SITE_NAME } from '@/shared/lib/seo/site';
import { LOGO_MARK_PATHS, LOGO_MARK_TILE_VIEWBOX } from './logo-mark';

export interface LogoMarkProps {
  /** Tile size in CSS pixels. */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * The brand mark: the pin glyph on a primary-coloured rounded square.
 * Decorative by default; give the surrounding link or heading the accessible name.
 */
export function LogoMark({ size = 32, className, style }: Readonly<LogoMarkProps>) {
  return (
    <span
      aria-hidden='true'
      data-slot='logo-mark'
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[22%] bg-primary text-primary-foreground',
        className
      )}
      style={{ width: size, height: size, ...style }}
    >
      <svg
        viewBox={LOGO_MARK_TILE_VIEWBOX}
        width={size}
        height={size}
        fill='currentColor'
        focusable='false'
      >
        {LOGO_MARK_PATHS.map(d => (
          <path key={d} d={d} />
        ))}
      </svg>
    </span>
  );
}

export interface WordmarkProps {
  className?: string;
}

/** The text wordmark. Inherits colour so it works on any surface. */
export function Wordmark({ className }: Readonly<WordmarkProps>) {
  return (
    <span data-slot='wordmark' className={cn('font-semibold tracking-tight', className)}>
      {SITE_NAME}
    </span>
  );
}

export interface LogoProps {
  /** Mark size in CSS pixels; the wordmark scales with the text class. */
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}

/** Mark + wordmark lockup used by headers, footers and empty states. */
export function Logo({ size = 28, className, wordmarkClassName }: Readonly<LogoProps>) {
  return (
    <span data-slot='logo' className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      <Wordmark className={cn('text-body text-foreground', wordmarkClassName)} />
    </span>
  );
}
