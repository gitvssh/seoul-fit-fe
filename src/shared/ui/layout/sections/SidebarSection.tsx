import React from 'react';

import { cn } from '@/shared/lib/utils';

interface SidebarSectionProps {
  id: string;
  title: string;
  /** 제목 줄 오른쪽에 두는 요약·액션. */
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** 설정 메뉴의 한 구역: `text-section` 제목 + 44px 행들. */
export function SidebarSection({
  id,
  title,
  aside,
  className,
  children,
}: Readonly<SidebarSectionProps>) {
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className={cn('border-b border-border py-2', className)}>
      <div className='flex min-h-11 items-center justify-between gap-3 px-4'>
        <h3 id={headingId} className='text-section text-foreground'>
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}
