import Link from 'next/link';
import { ChevronRight, Map } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Logo } from '@/shared/ui/brand/Logo';

/**
 * Compact header for pages outside the map (public place pages, /about).
 * Korean-only: these pages are server-rendered without the i18n provider's locale.
 */
export function SiteHeader() {
  return (
    <header className='border-b border-border bg-card'>
      <div className='mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6'>
        <Link
          href='/'
          aria-label='Seoul Fit 홈'
          className='rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
        >
          <Logo size={28} />
        </Link>
        <nav aria-label='사이트' className='flex items-center gap-1'>
          <Button asChild variant='ghost' size='lg' className='px-3'>
            <Link href='/about'>소개</Link>
          </Button>
          <Button asChild variant='outline' size='lg' className='px-4'>
            <Link href='/'>
              <Map aria-hidden='true' />
              지도로 보기
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Breadcrumb trail; the last item is the current page. */
export function SiteBreadcrumb({ items }: Readonly<{ items: BreadcrumbItem[] }>) {
  return (
    <nav aria-label='경로' className='text-body-sm text-muted-foreground'>
      <ol className='flex flex-wrap items-center gap-1'>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className='flex items-center gap-1'>
              {index > 0 && <ChevronRight className='size-3.5' aria-hidden='true' />}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className='rounded-sm py-1 hover:text-foreground hover:underline'
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className='py-1 text-foreground'>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
