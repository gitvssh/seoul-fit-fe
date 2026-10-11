import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { PublicPlaceCategory } from '@/shared/lib/seo/public-places';

export interface PlacePaginationProps {
  category: PublicPlaceCategory;
  /** 1-based current page. */
  page: number;
  totalPages: number;
  hasNext: boolean;
}

function pageHref(category: PublicPlaceCategory, page: number): string {
  return page <= 1 ? `/places/${category}` : `/places/${category}?page=${page}`;
}

export function PlacePagination({ category, page, totalPages, hasNext }: PlacePaginationProps) {
  const hasPrevious = page > 1;
  return (
    <nav aria-label='페이지 이동' className='mt-10 flex items-center justify-between gap-3'>
      {hasPrevious ? (
        <Button asChild variant='outline' size='lg'>
          <Link href={pageHref(category, page - 1)} rel='prev'>
            <ChevronLeft aria-hidden='true' />
            이전
          </Link>
        </Button>
      ) : (
        <Button variant='outline' size='lg' disabled>
          <ChevronLeft aria-hidden='true' />
          이전
        </Button>
      )}
      <p className='text-body-sm text-muted-foreground tabular-nums'>
        {page} / {Math.max(totalPages, 1)} 페이지
      </p>
      {hasNext ? (
        <Button asChild variant='outline' size='lg'>
          <Link href={pageHref(category, page + 1)} rel='next'>
            다음
            <ChevronRight aria-hidden='true' />
          </Link>
        </Button>
      ) : (
        <Button variant='outline' size='lg' disabled>
          다음
          <ChevronRight aria-hidden='true' />
        </Button>
      )}
    </nav>
  );
}
