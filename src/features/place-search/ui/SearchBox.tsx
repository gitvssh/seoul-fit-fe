'use client';

import * as React from 'react';
import { Command, useCommandState } from 'cmdk';
import { Search, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/shared/i18n/I18nProvider';
import {
  useSearchCache,
  type SearchHistoryItem,
  type SearchItem,
} from '@/shared/lib/hooks/useSearchCache';
import { parseNaturalLanguageSearch } from '@/features/natural-language-search/lib/rule-parser';
import type { NaturalLanguageSearchRule } from '@/features/natural-language-search/model/types';
import { groupByCategory } from '../lib/categories';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { SearchBoxPopup, type PanelMode } from './SearchBoxPopup';
import { useSearchBoxController } from './useSearchBoxController';

export interface SearchBoxProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** 장소 결과를 골랐을 때. 통합자가 지도를 옮기고 상세를 연다. */
  onSelect: (item: SearchItem) => void | Promise<void>;
  /** X 버튼 또는 Esc 두 번. 통합자가 지도 선택과 자연어 조건을 함께 해제한다. */
  onClear: () => void;
  /** "조건으로 지도 보기"를 골랐을 때. 파서가 조건을 찾은 경우에만 행이 보인다. */
  onApplyRule?: (rule: NaturalLanguageSearchRule) => void;
  /** pill = 지도 위 48px 검색 pill(모바일 헤더), panel = 데스크톱 aside 안 */
  variant?: 'pill' | 'panel';
  autoFocus?: boolean;
  className?: string;
  inputId?: string;
}

export interface SearchBoxHandle {
  focus(): void;
  blur(): void;
  closeSuggestions(): void;
}

const DEBOUNCE_MS = 180;
const MAX_RESULTS = 10;
const MAX_RECENT = 5;

const SHELL_CLASS: Record<NonNullable<SearchBoxProps['variant']>, string> = {
  pill: 'h-12 rounded-2xl border border-border bg-surface-elevated pl-4 pr-1 text-surface-elevated-foreground shadow-float-md',
  panel: 'h-11 rounded-md border border-input/70 bg-card pl-3 pr-1 text-card-foreground shadow-sm',
};

interface ModeInput {
  hasQuery: boolean;
  settled: boolean;
  isLoading: boolean;
  hasError: boolean;
  resultCount: number;
  recentCount: number;
}

function resolveMode(input: ModeInput): PanelMode {
  if (!input.hasQuery) return input.recentCount > 0 ? 'recent' : 'hidden';
  if (input.isLoading) return 'loading';
  if (input.hasError) return 'error';
  // 디바운스가 끝나기 전에는 직전 결과를 유지하고, 결과 없음을 먼저 보여주지 않는다.
  if (!input.settled) return input.resultCount > 0 ? 'results' : 'hidden';
  return input.resultCount > 0 ? 'results' : 'empty';
}

type Translate = ReturnType<typeof useI18n>['t'];

function statusFor(mode: PanelMode, t: Translate, resultCount: number, recentCount: number) {
  switch (mode) {
    case 'loading':
      return t('search.loading');
    case 'error':
      return t('search.error');
    case 'results':
      return resultCount === 1
        ? t('search.resultCountOne')
        : t('search.resultCount', { count: resultCount });
    case 'empty':
      return t('search.noResultsStatus');
    case 'recent':
      return t('search.recentCount', { count: recentCount });
    default:
      return '';
  }
}

interface PanelStateInput {
  query: string;
  search: (query: string, limit?: number) => SearchItem[];
  isLoading: boolean;
  hasError: boolean;
  searchHistory: SearchHistoryItem[];
}

/** 검색어 → 디바운스된 순위 결과·그룹·자연어 조건·최근 검색·패널 모드 */
function usePanelState({ query, search, isLoading, hasError, searchHistory }: PanelStateInput) {
  const trimmedQuery = query.trim();
  const debouncedQuery = useDebouncedValue(trimmedQuery, DEBOUNCE_MS);
  const rankedQuery = trimmedQuery ? debouncedQuery : '';
  const results = React.useMemo(
    () => (rankedQuery ? search(rankedQuery, MAX_RESULTS) : []),
    [rankedQuery, search]
  );
  const groups = React.useMemo(() => groupByCategory(results), [results]);
  const rule = React.useMemo(() => parseNaturalLanguageSearch(query), [query]);
  const recent = trimmedQuery ? [] : searchHistory.slice(0, MAX_RECENT);
  const mode = resolveMode({
    hasQuery: trimmedQuery !== '',
    settled: debouncedQuery === trimmedQuery,
    isLoading,
    hasError,
    resultCount: results.length,
    recentCount: recent.length,
  });
  return { trimmedQuery, rankedQuery, results, groups, rule, recent, mode };
}

const subscribeToNothing = () => () => {};

function findOptionId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  for (const option of document.querySelectorAll<HTMLElement>('[cmdk-item]')) {
    if (option.dataset.value === value) return option.id || undefined;
  }
  return undefined;
}

/**
 * 활성 항목의 DOM id. cmdk는 첫 항목을 자동 선택할 때 `selectedItemId`를 갱신하지 않으므로
 * 활성 값(`data-value`, 인스턴스 접두사로 유일)에서 직접 찾는다.
 */
function useActiveOptionId(): string | undefined {
  const activeValue = useCommandState(state => state.value);
  const getSnapshot = React.useCallback(() => findOptionId(activeValue), [activeValue]);
  return React.useSyncExternalStore(subscribeToNothing, getSnapshot, () => undefined);
}

interface SearchInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
  value: string;
  popupVisible: boolean;
  listId?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** cmdk의 Command.Input은 aria-expanded를 항상 true로 두고 id를 무시하므로 직접 그린다. */
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { popupVisible, listId, className, ...props },
  ref
) {
  const activeId = useActiveOptionId();
  return (
    <input
      ref={ref}
      type='text'
      role='combobox'
      aria-autocomplete='list'
      aria-expanded={popupVisible}
      aria-controls={popupVisible ? listId : undefined}
      aria-activedescendant={popupVisible ? activeId : undefined}
      autoComplete='off'
      autoCorrect='off'
      spellCheck={false}
      inputMode='search'
      enterKeyHint='search'
      className={cn(
        'min-w-0 flex-1 bg-transparent text-body text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
});

export const SearchBox = React.forwardRef<SearchBoxHandle, SearchBoxProps>(function SearchBox(
  {
    query,
    onQueryChange,
    onSelect,
    onClear,
    onApplyRule,
    variant = 'pill',
    autoFocus = false,
    className,
    inputId,
  },
  ref
) {
  const { t, locale } = useI18n();
  const {
    search,
    isLoading,
    error,
    reloadData,
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
  } = useSearchCache();
  const instanceId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [listId, setListId] = React.useState<string | undefined>(undefined);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { trimmedQuery, rankedQuery, results, groups, rule, recent, mode } = usePanelState({
    query,
    search,
    isLoading,
    hasError: Boolean(error),
    searchHistory,
  });
  const popupVisible = open && mode !== 'hidden';
  const ruleRow =
    popupVisible && rule.matched && mode !== 'recent'
      ? { title: t('search.applyRule'), summary: locale === 'en' ? rule.summaryEn : rule.summary }
      : null;
  const statusText = popupVisible ? statusFor(mode, t, results.length, recent.length) : '';

  const controller = useSearchBoxController({
    query,
    rule,
    open,
    popupVisible,
    setOpen,
    rootRef,
    inputRef,
    onQueryChange,
    onSelect,
    onClear,
    onApplyRule,
    addToHistory,
  });

  const listRef = React.useCallback((node: HTMLDivElement | null) => setListId(node?.id), []);

  React.useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      closeSuggestions: () => setOpen(false),
    }),
    []
  );

  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <Command
      ref={rootRef}
      shouldFilter={false}
      loop
      vimBindings={false}
      onKeyDown={controller.handleKeyDown}
      onBlur={controller.handleBlur}
      onFocus={controller.handleRootFocus}
      className={cn('relative', className)}
    >
      <div
        className={cn(
          'flex items-center gap-2 transition-[box-shadow,border-color] duration-fast ease-standard focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
          SHELL_CLASS[variant]
        )}
      >
        <Search aria-hidden='true' className='size-5 shrink-0 text-muted-foreground' />
        <SearchInput
          ref={inputRef}
          id={inputId}
          value={query}
          placeholder={t('search.placeholder')}
          aria-label={t('search.label')}
          popupVisible={popupVisible}
          listId={listId}
          onChange={event => {
            onQueryChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
        />
        {query ? (
          <Button
            type='button'
            variant='ghost'
            size={variant === 'pill' ? 'icon-lg' : 'icon'}
            className='shrink-0 rounded-full text-muted-foreground'
            aria-label={t('search.clear')}
            onClick={controller.clearSearch}
          >
            <X aria-hidden='true' className='size-5' />
          </Button>
        ) : null}
      </div>
      {popupVisible ? (
        <SearchBoxPopup
          mode={mode}
          valuePrefix={instanceId}
          rule={ruleRow}
          rankedQuery={rankedQuery}
          query={trimmedQuery}
          groups={groups}
          recent={recent}
          listRef={listRef}
          onApplyRule={controller.applyRule}
          onSelectPlace={controller.selectPlace}
          onSelectRecent={controller.selectRecent}
          onRemoveRecent={removeFromHistory}
          onClearHistory={clearHistory}
          onRetry={() => void reloadData()}
          onResetFilters={controller.resetFilters}
          onMouseDown={controller.handlePopupMouseDown}
          onKeyDown={controller.handlePopupKeyDown}
        />
      ) : null}
      {/* cmdk의 Empty는 role=presentation이라 결과 수를 별도 status로 알린다 */}
      <div role='status' aria-live='polite' className='sr-only'>
        {statusText}
      </div>
    </Command>
  );
});
