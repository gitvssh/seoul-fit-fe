'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** 라벨의 언어(예: 언어 선택기). 보조기기가 올바른 발음 규칙을 쓰게 한다. */
  lang?: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  /** 그룹의 접근 가능한 이름(고정 라벨). */
  'aria-label': string;
  className?: string;
}

/**
 * 고정 라벨 + `aria-pressed`로 선택을 전달하는 분할 토글. 색만 바뀌고 크기는 바뀌지 않는다.
 * 외곽 44px(안쪽 버튼 36px + 패딩)로 터치 타깃을 맞춘다.
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <div
      role='group'
      aria-label={props['aria-label']}
      className={cn('inline-flex w-full gap-1 rounded-md bg-muted p-1', className)}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type='button'
            lang={option.lang}
            aria-pressed={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              'inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-sm px-2 text-label text-muted-foreground outline-none transition-[color,background-color,box-shadow] duration-fast ease-standard hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
              'aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm'
            )}
          >
            {option.icon}
            <span className='truncate'>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
