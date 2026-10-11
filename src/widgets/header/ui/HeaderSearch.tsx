'use client';

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Clock, Loader2, Search, WandSparkles, X } from 'lucide-react';
import {
  useSearchCache,
  type SearchItem,
  type SearchHistoryItem,
} from '@/shared/lib/hooks/useSearchCache';
import { parseNaturalLanguageSearch } from '@/features/natural-language-search/lib/rule-parser';
import { useNaturalLanguageRuleStore } from '@/features/natural-language-search/model/rule-store';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import type { FacilityCategory } from '@/lib/types';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { cn } from '@/shared/lib/utils';

export interface HeaderSearchHandle {
  focus: () => void;
  blur: () => void;
  closeSuggestions: () => void;
}

interface HeaderSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect?: (item: SearchItem) => void | Promise<void>;
  onClear?: () => void;
  className?: string;
}

const SEARCH_CATEGORY: Record<SearchItem['category'], FacilityCategory> = {
  subway: 'subway',
  bike: 'bike',
  library: 'library',
  park: 'park',
  cultural_event: 'cultural_event',
  cultural_reservation: 'cultural_reservation',
  cooling_center: 'cooling_shelter',
  restaurant: 'restaurant',
};

function CategoryGlyph({ category }: { category: SearchItem['category'] }) {
  const config = FACILITY_CONFIGS[SEARCH_CATEGORY[category]];
  const Icon = config.Icon;
  return (
    <span
      className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', config.color)}
      style={config.glyph === 'ink' ? { color: 'hsl(var(--marker-ink))' } : { color: '#ffffff' }}
      aria-hidden='true'
    >
      <Icon className='size-3.5' />
    </span>
  );
}

/** 검색 pill + 제안 팝업 (최근 검색, 자연어 조건, 장소 결과). */
export const HeaderSearch = React.forwardRef<HeaderSearchHandle, HeaderSearchProps>(
  function HeaderSearch({ query, onQueryChange, onSelect, onClear, className }, ref) {
    const { locale, t } = useI18n();
    const inputRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
    const [open, setOpen] = useState(false);
    const applyRule = useNaturalLanguageRuleStore(state => state.applyRule);
    const rule = useMemo(() => parseNaturalLanguageSearch(query), [query]);
    const {
      search,
      isLoading,
      error,
      searchHistory,
      addToHistory,
      removeFromHistory,
      clearHistory,
      getRelevantHistory,
    } = useSearchCache();

    const debouncedSearch = useMemo(() => {
      let timer: ReturnType<typeof setTimeout>;
      return (value: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          const results = search(value, 10);
          setSuggestions(results);
          setOpen(true);
        }, 180);
      };
    }, [search]);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      closeSuggestions: () => setOpen(false),
    }));

    useEffect(() => {
      const onPointerDown = (event: MouseEvent) => {
        if (
          !popupRef.current?.contains(event.target as Node) &&
          !inputRef.current?.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', onPointerDown);
      return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onQueryChange(value);
      if (value.length > 0) debouncedSearch(value);
      else {
        setSuggestions([]);
        setOpen(searchHistory.length > 0);
        onClear?.();
      }
    };

    const choose = useCallback(
      async (item: SearchItem, source: 'search_result' | 'search_history') => {
        trackEvent('discovery_started', { selection_source: source });
        onQueryChange(item.name);
        setOpen(false);
        inputRef.current?.blur();
        addToHistory(item.name, item);
        try {
          await onSelect?.(item);
        } catch (selectError) {
          console.error('검색 결과 선택 실패:', selectError);
        }
      },
      [addToHistory, onQueryChange, onSelect]
    );

    const chooseHistory = (item: SearchHistoryItem) => {
      if (item.selectedItem) return choose(item.selectedItem, 'search_history');
      onQueryChange(item.query);
      debouncedSearch(item.query);
    };

    const applyNaturalLanguage = () => {
      if (!rule.matched) return;
      applyRule(rule);
      trackEvent('discovery_started', { selection_source: 'natural_language' });
      setOpen(false);
      inputRef.current?.blur();
    };

    const clear = () => {
      onQueryChange('');
      setSuggestions([]);
      setOpen(false);
      inputRef.current?.focus();
      onClear?.();
    };

    const relevantHistory = getRelevantHistory(query).slice(0, 5);
    const hasHistory = relevantHistory.length > 0;
    const hasSuggestions = suggestions.length > 0;
    const showPopup = open || (isLoading && query.length > 0);

    return (
      <div className={cn('relative min-w-0', className)}>
        <div className='flex h-11 items-center rounded-2xl border border-border bg-surface-elevated pl-3 pr-1 shadow-float-md transition-[box-shadow,border-color] duration-fast focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50'>
          <Search className='size-4 shrink-0 text-muted-foreground' aria-hidden='true' />
          <input
            ref={inputRef}
            type='search'
            role='combobox'
            aria-label={t('header.searchLabel')}
            aria-expanded={showPopup}
            aria-controls='global-search-suggestions'
            aria-autocomplete='list'
            placeholder={t('header.searchPlaceholder')}
            value={query}
            onChange={handleChange}
            onFocus={() => {
              if (!query && searchHistory.length > 0) setOpen(true);
            }}
            onKeyDown={event => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === 'Escape') {
                if (showPopup) setOpen(false);
                else if (query) clear();
              } else if (event.key === 'Enter' && rule.matched && !hasSuggestions) {
                event.preventDefault();
                applyNaturalLanguage();
              } else if (event.key === 'ArrowDown' && showPopup) {
                event.preventDefault();
                popupRef.current?.querySelector<HTMLElement>('[role="option"]')?.focus();
              }
            }}
            className='min-w-0 flex-1 bg-transparent px-2 text-body text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden'
          />
          {query && (
            <button
              type='button'
              onClick={clear}
              className='flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent'
              aria-label={t('header.clearSearch')}
            >
              <X className='size-4' aria-hidden='true' />
            </button>
          )}
        </div>

        {showPopup && (
          <div
            id='global-search-suggestions'
            ref={popupRef}
            role='listbox'
            aria-label={t('header.searchResults')}
            className='absolute left-0 right-0 top-full z-map-popover mt-1.5 max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-float-lg animate-in fade-in-0 slide-in-from-top-1 duration-fast motion-reduce:animate-none'
          >
            {isLoading && (
              <div className='flex items-center justify-center gap-2 px-4 py-3 text-body-sm text-muted-foreground'>
                <Loader2 className='size-4 animate-spin' aria-hidden='true' />
                {t('header.loading')}
              </div>
            )}
            {!isLoading && rule.matched && (
              <button
                type='button'
                role='option'
                aria-selected='false'
                onClick={applyNaturalLanguage}
                className='flex w-full items-start gap-3 border-b border-border bg-accent/60 px-4 py-3 text-left outline-none hover:bg-accent focus-visible:bg-accent'
              >
                <WandSparkles className='mt-0.5 size-4 shrink-0 text-primary' aria-hidden='true' />
                <span className='min-w-0'>
                  <span className='block text-label text-accent-foreground'>
                    {t('header.applyRules')}
                  </span>
                  <span className='mt-0.5 block text-caption text-muted-foreground'>
                    {locale === 'en' ? rule.summaryEn : rule.summary}
                  </span>
                </span>
              </button>
            )}
            {!isLoading && hasHistory && (
              <>
                <div className='flex items-center justify-between px-4 py-2'>
                  <span className='flex items-center gap-1 text-caption font-medium text-muted-foreground'>
                    <Clock className='size-3' aria-hidden='true' />
                    {t('header.recentSearch')}
                  </span>
                  <button
                    type='button'
                    onClick={() => clearHistory()}
                    className='text-caption text-muted-foreground hover:text-foreground'
                  >
                    {t('header.clearAll')}
                  </button>
                </div>
                {relevantHistory.map(item => (
                  <div
                    key={item.id}
                    role='presentation'
                    className='flex items-center border-b border-border last:border-b-0 hover:bg-accent/60'
                  >
                    <button
                      type='button'
                      role='option'
                      aria-selected='false'
                      onClick={() => chooseHistory(item)}
                      className='flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left outline-none focus-visible:bg-accent'
                    >
                      <Clock className='size-4 shrink-0 text-muted-foreground' aria-hidden='true' />
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-body-sm font-medium'>
                          {item.query}
                        </span>
                        {item.selectedItem && (
                          <span className='block truncate text-caption text-muted-foreground'>
                            {item.selectedItem.address?.split(',')[0] || item.selectedItem.name}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      type='button'
                      onClick={() => removeFromHistory(item.id)}
                      className='mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent'
                      aria-label={t('header.removeHistory', { query: item.query })}
                    >
                      <X className='size-3.5' aria-hidden='true' />
                    </button>
                  </div>
                ))}
              </>
            )}
            {!isLoading && hasSuggestions && (
              <>
                {hasHistory && (
                  <div className='px-4 py-2 text-caption font-medium text-muted-foreground'>
                    {t('header.searchResults')}
                  </div>
                )}
                {suggestions.map(item => (
                  <button
                    key={item.id}
                    type='button'
                    role='option'
                    aria-selected='false'
                    onClick={() => choose(item, 'search_result')}
                    className='flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left outline-none last:border-b-0 hover:bg-accent/60 focus-visible:bg-accent'
                  >
                    <CategoryGlyph category={item.category} />
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-body-sm font-medium'>
                        {item.name}
                        {item.remark && (
                          <span className='ml-1.5 text-caption font-normal text-muted-foreground'>
                            {item.remark.split(',')[0]}
                          </span>
                        )}
                      </span>
                      {item.address && (
                        <span className='block truncate text-caption text-muted-foreground'>
                          {item.address.split(',')[0]}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </>
            )}
            {!isLoading && !hasHistory && !hasSuggestions && !rule.matched && query.length > 0 && (
              <div className='px-4 py-4 text-center text-body-sm text-muted-foreground'>
                {t('header.noResults')}
              </div>
            )}
            {error && (
              <div className='px-4 py-3 text-center text-caption text-destructive'>{error}</div>
            )}
          </div>
        )}
      </div>
    );
  }
);
