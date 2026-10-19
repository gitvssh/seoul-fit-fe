'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { Button } from '@/shared/ui/button';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { SearchHistoryItem, SearchItem } from '@/shared/lib/hooks/useSearchCache';
import { CATEGORY_MESSAGE_KEY, type SearchResultGroup } from '../lib/categories';
import {
  EmptyState,
  ErrorState,
  GROUP_CLASS,
  LoadingRows,
  PlaceResultRow,
  RecentSearchRow,
  RuleRow,
} from './SearchBoxParts';

export type PanelMode = 'hidden' | 'recent' | 'loading' | 'error' | 'results' | 'empty';

export interface SearchBoxPopupProps {
  mode: PanelMode;
  /** 항목 value의 인스턴스 접두사. 같은 화면에 검색창이 둘이어도 활성 항목을 유일하게 찾는다. */
  valuePrefix: string;
  /** 파서가 조건을 찾았고 현재 모드에서 보여줄 수 있을 때 */
  rule: { title: string; summary: string } | null;
  /** 순위 계산에 쓴(디바운스된) 검색어. 강조 구간이 결과와 어긋나지 않게 한다. */
  rankedQuery: string;
  /** 입력창의 현재 검색어 (빈 결과 문구용) */
  query: string;
  groups: SearchResultGroup[];
  recent: SearchHistoryItem[];
  listRef: (node: HTMLDivElement | null) => void;
  onApplyRule: () => void;
  onSelectPlace: (item: SearchItem) => void;
  onSelectRecent: (entry: SearchHistoryItem) => void;
  onRemoveRecent: (historyId: string) => void;
  onClearHistory: () => void;
  onRetry: () => void;
  onResetFilters: () => void;
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function SearchBoxPopup({
  mode,
  valuePrefix,
  rule,
  rankedQuery,
  query,
  groups,
  recent,
  listRef,
  onApplyRule,
  onSelectPlace,
  onSelectRecent,
  onRemoveRecent,
  onClearHistory,
  onRetry,
  onResetFilters,
  onMouseDown,
  onKeyDown,
}: Readonly<SearchBoxPopupProps>) {
  const { t } = useI18n();
  const hasList = mode === 'results' || mode === 'recent';

  return (
    <div
      tabIndex={-1}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      className='absolute inset-x-0 top-full z-map-popover mt-2 max-h-[60vh] space-y-1 overflow-y-auto rounded-lg border border-border bg-popover p-1.5 text-popover-foreground shadow-float-lg outline-none animate-in fade-in-0 slide-in-from-top-1 duration-base'
    >
      {rule ? <RuleRow title={rule.title} summary={rule.summary} onApply={onApplyRule} /> : null}
      {mode === 'loading' ? <LoadingRows /> : null}
      {mode === 'error' ? (
        <ErrorState message={t('search.error')} retryLabel={t('search.retry')} onRetry={onRetry} />
      ) : null}
      {hasList ? (
        <Command.List ref={listRef} label={t('search.suggestions')} className='outline-none'>
          {mode === 'recent' ? (
            <Command.Group heading={t('search.recent')} className={GROUP_CLASS}>
              {recent.map(entry => (
                <RecentSearchRow
                  key={entry.id}
                  valuePrefix={valuePrefix}
                  entry={entry}
                  removeLabel={t('search.removeHistory', { query: entry.query })}
                  onSelect={onSelectRecent}
                  onRemove={onRemoveRecent}
                />
              ))}
            </Command.Group>
          ) : (
            groups.map(group => (
              <Command.Group
                key={group.category}
                heading={t(CATEGORY_MESSAGE_KEY[group.category])}
                className={GROUP_CLASS}
              >
                {group.items.map(item => (
                  <PlaceResultRow
                    key={`${item.category}:${item.id}`}
                    valuePrefix={valuePrefix}
                    item={item}
                    query={rankedQuery}
                    onSelect={onSelectPlace}
                  />
                ))}
              </Command.Group>
            ))
          )}
        </Command.List>
      ) : null}
      {mode === 'recent' ? (
        <div className='flex justify-end px-1 pt-1'>
          <Button type='button' variant='link' size='sm' onClick={onClearHistory}>
            {t('search.clearHistory')}
          </Button>
        </div>
      ) : null}
      {mode === 'empty' ? (
        <EmptyState
          message={t('search.noResults', { query })}
          hint={t('search.noResultsHint')}
          resetLabel={t('search.resetFilters')}
          onReset={onResetFilters}
        />
      ) : null}
    </div>
  );
}
