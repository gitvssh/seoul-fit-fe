import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Map } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { LogoMark } from '@/shared/ui/brand/Logo';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없어요',
  robots: { index: false, follow: false },
};

/** Branded 404. Korean-only: rendered on the server without the locale provider. */
export default function NotFound() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12'>
      <div className='w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-float-sm'>
        <LogoMark size={44} className='mx-auto' />
        <p className='mt-6 text-label text-muted-foreground tabular-nums'>404</p>
        <h1 className='mt-1 text-title text-foreground'>페이지를 찾을 수 없어요</h1>
        <p className='mt-2 text-body text-muted-foreground'>
          주소가 바뀌었거나 삭제된 장소일 수 있어요. 지도에서 다시 찾아보거나 공개 목록에서
          둘러보세요.
        </p>
        <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center'>
          <Button asChild size='lg'>
            <Link href='/'>
              <Map aria-hidden='true' />
              지도로 가기
            </Link>
          </Button>
          <Button asChild variant='outline' size='lg'>
            <Link href='/places'>
              <Compass aria-hidden='true' />
              장소 둘러보기
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
