import type { FacilityCategory } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import { cn } from '@/shared/lib/utils';

const SIZES = {
  sm: 'size-7 [&>svg]:size-3.5',
  md: 'size-9 [&>svg]:size-4',
  lg: 'size-12 [&>svg]:size-6',
} as const;

export interface CategoryGlyphProps {
  category: FacilityCategory;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Category colour disc with the lucide glyph from FACILITY_CONFIGS (decorative; the label sits next to it). */
export function CategoryGlyph({ category, size = 'md', className }: CategoryGlyphProps) {
  const config = FACILITY_CONFIGS[category];
  const Icon = config.Icon;
  return (
    <span
      aria-hidden='true'
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        config.color,
        config.glyph === 'ink' ? 'text-marker-ink' : 'text-primary-foreground',
        SIZES[size],
        className
      )}
    >
      <Icon aria-hidden='true' />
    </span>
  );
}
