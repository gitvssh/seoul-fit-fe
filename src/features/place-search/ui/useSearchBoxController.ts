'use client';

import * as React from 'react';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import type { SearchHistoryItem, SearchItem } from '@/shared/lib/hooks/useSearchCache';
import type { NaturalLanguageSearchRule } from '@/features/natural-language-search/model/types';

const ACTIVE_OPTION_SELECTOR = '[cmdk-item][aria-selected="true"]';

/** Home/End는 cmdk가 가로채므로 텍스트 커서 이동을 직접 수행한다. */
function moveCaret(event: React.KeyboardEvent, input: HTMLInputElement) {
  event.preventDefault();
  const length = input.value.length;
  const target = event.key === 'Home' ? 0 : length;
  if (!event.shiftKey) {
    input.setSelectionRange(target, target);
    return;
  }
  const anchor =
    event.key === 'Home' ? (input.selectionEnd ?? length) : (input.selectionStart ?? 0);
  input.setSelectionRange(Math.min(anchor, target), Math.max(anchor, target));
}

export interface SearchBoxControllerInput {
  query: string;
  rule: NaturalLanguageSearchRule;
  open: boolean;
  popupVisible: boolean;
  setOpen: (open: boolean) => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onQueryChange: (query: string) => void;
  onSelect: (item: SearchItem) => void | Promise<void>;
  onClear: () => void;
  onApplyRule?: (rule: NaturalLanguageSearchRule) => void;
  addToHistory: (query: string, item?: SearchItem) => void;
}

/** SearchBox의 선택·지우기·키보드·포커스 동작. 상태는 SearchBox가 들고 있고 여기서는 전이만 다룬다. */
export function useSearchBoxController(input: SearchBoxControllerInput) {
  const {
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
  } = input;

  const finishSelection = () => {
    setOpen(false);
    inputRef.current?.blur();
  };

  const selectPlace = async (item: SearchItem) => {
    trackEvent('discovery_started', { selection_source: 'search_result' });
    onQueryChange(item.name);
    addToHistory(item.name, item);
    finishSelection();
    try {
      await onSelect(item);
    } catch (selectError) {
      console.error('검색 결과 선택 실패:', selectError);
    }
  };

  const selectRecent = async (entry: SearchHistoryItem) => {
    trackEvent('discovery_started', { selection_source: 'search_history' });
    onQueryChange(entry.query);
    addToHistory(entry.query, entry.selectedItem);
    if (!entry.selectedItem) {
      setOpen(true);
      inputRef.current?.focus();
      return;
    }
    finishSelection();
    try {
      await onSelect(entry.selectedItem);
    } catch (selectError) {
      console.error('검색 기록 선택 실패:', selectError);
    }
  };

  const applyRule = () => {
    if (!rule.matched) return;
    trackEvent('discovery_started', { selection_source: 'natural_language' });
    onApplyRule?.(rule);
    finishSelection();
  };

  const clearSearch = () => {
    onQueryChange('');
    onClear();
    setOpen(true);
    inputRef.current?.focus();
  };

  const resetFilters = () => {
    onClear();
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // 한글 조합 중에는 Enter·Esc·방향키를 모두 무시한다 (cmdk도 같은 가드를 가진다).
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const inputElement = inputRef.current;
    if (!inputElement || event.target !== inputElement) return;
    switch (event.key) {
      case 'Escape':
        if (popupVisible) {
          event.preventDefault();
          setOpen(false);
        } else if (query) {
          event.preventDefault();
          clearSearch();
        }
        return;
      case 'Enter': {
        const active = popupVisible ? rootRef.current?.querySelector(ACTIVE_OPTION_SELECTOR) : null;
        if (active) return; // cmdk가 활성 항목을 고른다
        event.preventDefault();
        if (rule.matched) applyRule();
        else if (!open) setOpen(true);
        return;
      }
      case 'ArrowDown':
      case 'ArrowUp':
        if (!open) setOpen(true);
        return;
      case 'Home':
      case 'End':
        moveCaret(event, inputElement);
        return;
      default:
        return;
    }
  };

  /** 팝업 안 버튼(조건 행·기록 삭제)의 키는 cmdk로 올리지 않고 브라우저 기본 동작에 맡긴다. */
  const handlePopupKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      inputRef.current?.focus();
    }
  };

  /** 팝업 안을 눌러도 입력창 포커스를 유지한다 (스크롤바 드래그는 컨테이너가 포커스를 받는다). */
  const handlePopupMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) event.preventDefault();
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && rootRef.current?.contains(next)) return;
    setOpen(false);
  };

  const handleRootFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) inputRef.current?.focus();
  };

  return {
    selectPlace,
    selectRecent,
    applyRule,
    clearSearch,
    resetFilters,
    handleKeyDown,
    handlePopupKeyDown,
    handlePopupMouseDown,
    handleBlur,
    handleRootFocus,
  };
}
