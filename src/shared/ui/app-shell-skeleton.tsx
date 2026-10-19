import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';
import { LogoMark } from '@/shared/ui/brand/Logo';

export interface AppShellSkeletonProps {
  className?: string;
  /** Visually hidden status text for assistive technology. */
  label?: string;
  /** Render the floating explorer card placeholder over the map area. */
  showCard?: boolean;
}

/**
 * App-shell-shaped placeholder: a 56px header band, a map-coloured area and a
 * card skeleton. Used by app/loading.tsx and as the home Suspense fallback so the
 * transition into the map does not jump between two unrelated layouts.
 */
export function AppShellSkeleton({
  className,
  label = '화면을 준비하고 있어요',
  showCard = true,
}: Readonly<AppShellSkeletonProps>) {
  return (
    <div
      role='status'
      aria-live='polite'
      aria-busy='true'
      data-slot='app-shell-skeleton'
      className={cn(
        'flex h-screen min-h-[480px] flex-col overflow-hidden bg-background',
        className
      )}
    >
      <span className='sr-only'>{label}</span>
      <div className='flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4'>
        <LogoMark size={32} />
        <Skeleton className='h-10 max-w-xl flex-1 rounded-2xl' />
        <Skeleton className='hidden h-9 w-24 sm:block' />
        <Skeleton className='size-9 rounded-full' />
      </div>
      <div className='relative flex-1 bg-muted bg-[linear-gradient(hsl(var(--border)/0.55)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.55)_1px,transparent_1px)] bg-[size:48px_48px]'>
        {showCard && (
          <div className='absolute left-3 right-3 top-3 max-w-sm rounded-lg border border-border bg-card p-4 shadow-float-sm md:left-4'>
            <Skeleton className='h-4 w-28' />
            <Skeleton className='mt-3 h-3 w-44' />
            <div className='mt-4 flex gap-2'>
              <Skeleton className='h-9 w-20 rounded-2xl' />
              <Skeleton className='h-9 w-24 rounded-2xl' />
              <Skeleton className='h-9 w-16 rounded-2xl' />
            </div>
            <Skeleton className='mt-4 h-16 w-full' />
          </div>
        )}
      </div>
    </div>
  );
}
