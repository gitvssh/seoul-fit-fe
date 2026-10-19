'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { Clock, WandSparkles, X } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { cn } from '@/shared/lib/utils';
import { FACILITY_CONFIGS, MARKER_GLYPH_COLOR } from '@/shared/lib/icons/facility';
import { getSubwayLineColor } from '@/shared/lib/icons/subway-colors';
import type { SearchHistoryItem, SearchItem } from '@/shared/lib/hooks/useSearchCache';
import { getLoadedHangul, matchText } from '../lib/ranking';
import { SEARCH_TO_FACILITY_CATEGORY } from '../lib/categories';

/** 목록 행: 44px 이상, 활성 행은 accent 틴트 (cmdk가 data-selected를 관리한다) */
export const ROW_CLASS =
  'flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-md px-3 py-1.5 text-foreground outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground';

/** 그룹 제목은 cmdk가 `cmdk-group-heading` 속성으로 렌더링하므로 속성 선택자로 꾸민다. */
export const GROUP_CLASS =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-label [&_[cmdk-group-heading]]:text-muted-foreground';

const firstSegment = (value?: string): string | undefined =>
  value?.split(',')[0]?.trim() || undefined;

/** 검색어와 일치한 구간을 `<mark>`로 감싼다. 순위 계산과 같은 규칙을 쓴다. */
export function HighlightedText({
  text,
  query,
  fuzzy = true,
}: Readonly<{
  text: string;
  query: string;
  fuzzy?: boolean;
}>) {
  const match = matchText(text, query, { hangul: getLoadedHangul(), fuzzy });
  if (!match || match.end <= match.start) return <>{text}</>;
  return (
    <>
      {text.slice(0, match.start)}
      <mark className='bg-transparent font-semibold text-inherit'>
        {text.slice(match.start, match.end)}
      </mark>
      {text.slice(match.end)}
    </>
  );
}

/** 28px 카테고리 글리프. 색·아이콘·글리프 극성은 마커와 같은 단일 소스를 쓴다. */
export function CategoryGlyph({ category }: Readonly<{ category: SearchItem['category'] }>) {
  const config = FACILITY_CONFIGS[SEARCH_TO_FACILITY_CATEGORY[category]];
  const Icon = config.Icon;
  return (
    <span
      aria-hidden='true'
      className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', config.color)}
      style={{ color: MARKER_GLYPH_COLOR[config.glyph] }}
    >
      <Icon className='size-3.5' strokeWidth={2.25} />
    </span>
  );
}

function SubwayLineBadge({ line }: Readonly<{ line: string }>) {
  return (
    <Badge variant='muted' className='shrink-0 gap-1'>
      <span
        aria-hidden='true'
        className='size-2 rounded-full'
        style={{ backgroundColor: getSubwayLineColor(line) }}
      />
      {line}
    </Badge>
  );
}

export function PlaceResultRow({
  valuePrefix,
  item,
  query,
  onSelect,
}: Readonly<{
  valuePrefix: string;
  item: SearchItem;
  query: string;
  onSelect: (item: SearchItem) => void;
}>) {
  const isSubway = item.category === 'subway';
  const line = isSubway ? firstSegment(item.remark) : undefined;
  const secondary = firstSegment(item.address);
  return (
    <Command.Item
      value={`${valuePrefix}place:${item.category}:${item.id}`}
      onSelect={() => onSelect(item)}
      className={ROW_CLASS}
    >
      <CategoryGlyph category={item.category} />
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='flex min-w-0 items-center gap-2'>
          <span className='truncate text-body'>
            <HighlightedText text={item.name} query={query} fuzzy={!isSubway} />
          </span>
          {line ? <SubwayLineBadge line={line} /> : null}
        </span>
        {secondary ? (
          <span className='truncate text-body-sm text-muted-foreground'>{secondary}</span>
        ) : null}
      </span>
    </Command.Item>
  );
}

export function RecentSearchRow({
  valuePrefix,
  entry,
  removeLabel,
  onSelect,
  onRemove,
}: Readonly<{
  valuePrefix: string;
  entry: SearchHistoryItem;
  removeLabel: string;
  onSelect: (entry: SearchHistoryItem) => void;
  onRemove: (historyId: string) => void;
}>) {
  const secondary = firstSegment(entry.selectedItem?.address);
  return (
    <Command.Item
      value={`${valuePrefix}recent:${entry.id}`}
      onSelect={() => onSelect(entry)}
      className={cn(ROW_CLASS, 'py-0 pr-0')}
    >
      <Clock aria-hidden='true' className='size-5 shrink-0 text-muted-foreground' />
      <span className='flex min-w-0 flex-1 flex-col py-1.5'>
        <span className='truncate text-body'>{entry.query}</span>
        {secondary ? (
          <span className='truncate text-body-sm text-muted-foreground'>{secondary}</span>
        ) : null}
      </span>
      {/* 터치에서도 항상 보이는 삭제 버튼 (hover 전용 opacity 없음) */}
      <Button
        type='button'
        variant='ghost'
        size='icon-lg'
        className='shrink-0 rounded-full text-muted-foreground'
        aria-label={removeLabel}
        onClick={event => {
          event.stopPropagation();
          onRemove(entry.id);
        }}
      >
        <X aria-hidden='true' className='size-4' />
      </Button>
    </Command.Item>
  );
}

/** 자연어 조건 행. 목록(listbox) 밖의 버튼이라 Enter는 첫 장소 결과를 고르고, 이 행은 탭·탭(터치)으로 고른다. */
export function RuleRow({
  title,
  summary,
  onApply,
}: Readonly<{
  title: string;
  summary: string;
  onApply: () => void;
}>) {
  return (
    <button
      type='button'
      onClick={onApply}
      className='flex min-h-11 w-full items-start gap-3 rounded-md bg-accent px-3 py-2.5 text-left text-accent-foreground outline-none transition-colors duration-fast ease-standard hover:bg-accent/80 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50'
    >
      <WandSparkles aria-hidden='true' className='mt-0.5 size-5 shrink-0' />
      <span className='flex min-w-0 flex-col'>
        <span className='text-label'>{title}</span>
        <span className='text-body-sm'>{summary}</span>
      </span>
    </button>
  );
}

/** 인덱스 적재 중: 결과 없음을 먼저 보여주지 않고 스켈레톤 행을 둔다. */
export function LoadingRows() {
  return (
    <div aria-hidden='true' className='space-y-1'>
      {[0, 1, 2].map(index => (
        <div key={index} className='flex items-center gap-3 px-3 py-2'>
          <Skeleton className='size-7 rounded-full' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-4 w-2/3' />
            <Skeleton className='h-3 w-1/2' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  retryLabel,
  onRetry,
}: Readonly<{
  message: string;
  retryLabel: string;
  onRetry: () => void;
}>) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 px-3 py-3'>
      <p className='text-body-sm text-destructive'>{message}</p>
      <Button type='button' variant='outline' size='sm' onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}

export function EmptyState({
  message,
  hint,
  resetLabel,
  onReset,
}: Readonly<{
  message: string;
  hint: string;
  resetLabel: string;
  onReset: () => void;
}>) {
  return (
    <div className='px-3 py-3'>
      <p className='text-body'>{message}</p>
      <p className='mt-1 text-body-sm text-muted-foreground'>{hint}</p>
      <Button type='button' variant='outline' size='sm' className='mt-3' onClick={onReset}>
        {resetLabel}
      </Button>
    </div>
  );
}
