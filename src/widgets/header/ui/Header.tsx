// components/layout/Header.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Menu,
  MapPin,
  X,
  Bell,
  Train,
  Bike,
  Book,
  Trees,
  Building,
  Loader2,
  Snowflake,
  Clock,
  User,
  WandSparkles,
  Languages,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  useSearchCache,
  type SearchItem,
  type SearchHistoryItem,
} from '@/shared/lib/hooks/useSearchCache';
import { useAuthStore } from '@/shared/model/authStore';
import { useNotificationStore } from '@/shared/model/notificationStore';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { isSafeAppDeepLink } from '@/features/engagement/model/types';
import type { Notification } from '@/lib/types';
import { parseNaturalLanguageSearch } from '@/features/natural-language-search/lib/rule-parser';
import { useNaturalLanguageRuleStore } from '@/features/natural-language-search/model/rule-store';
import { useI18n } from '@/shared/i18n/I18nProvider';

export interface HeaderRef {
  closeSearchSuggestions: () => void;
  blurSearchInput: () => void;
}

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSelect?: (searchItem: SearchItem) => void;
  onSearchClear?: () => void;
  onMenuClick: () => void;
}

// 카테고리별 아이콘 매핑
const getCategoryIcon = (category: SearchItem['category']) => {
  switch (category) {
    case 'subway':
      return <Train className='w-4 h-4 text-blue-500' />;
    case 'bike':
      return <Bike className='w-4 h-4 text-green-500' />;
    case 'library':
      return <Book className='w-4 h-4 text-purple-500' />;
    case 'park':
      return <Trees className='w-4 h-4 text-emerald-500' />;
    case 'cultural_event':
    case 'cultural_reservation':
      return <Building className='w-4 h-4 text-orange-500' />;
    case 'cooling_center':
      return <Snowflake className='w-4 h-4 text-cyan-500' />;
    case 'restaurant':
      return <MapPin className='w-4 h-4 text-red-500' />;
    default:
      return <MapPin className='w-4 h-4 text-gray-400' />;
  }
};

const Header = React.forwardRef<HeaderRef, HeaderProps>(
  ({ searchQuery, onSearchChange, onSearchSelect, onSearchClear, onMenuClick }, ref) => {
    const { isAuthenticated, user, accessToken } = useAuthStore();
    const { locale, setLocale, t } = useI18n();
    const {
      unreadCount: notificationCount,
      notifications,
      isLoadingHistory,
      fetchUnreadCount,
      fetchNotificationHistory,
      markAsRead,
      markAllAsRead,
    } = useNotificationStore();
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const applyNaturalLanguageRule = useNaturalLanguageRuleStore(state => state.applyRule);
    const naturalLanguageRule = useMemo(
      () => parseNaturalLanguageSearch(searchQuery),
      [searchQuery]
    );
    const searchRef = useRef<HTMLInputElement>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 검색 캐시 훅 사용 (검색 히스토리 포함)
    const {
      search,
      isLoading: cacheLoading,
      error: cacheError,
      searchHistory,
      addToHistory,
      removeFromHistory,
      clearHistory,
      getRelevantHistory,
    } = useSearchCache();

    // 디바운싱된 검색 함수 (메모이제이션)
    const debouncedSearch = useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          try {
            const results = search(value, 10);
            setSuggestions(results);
            setShowSuggestions(
              results.length > 0 ||
                getRelevantHistory(value).length > 0 ||
                parseNaturalLanguageSearch(value).matched
            );
          } catch (error) {
            console.error('검색 중 오류:', error);
            setSuggestions([]);
            setShowSuggestions(getRelevantHistory(value).length > 0);
          }
        }, 200);
      };
    }, [search, getRelevantHistory]);

    // 검색어 변경 핸들러 (최적화됨)
    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onSearchChange(value);

        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }

        if (value.length > 0) {
          debouncedSearch(value);
        } else {
          setSuggestions([]);
          setShowSuggestions(searchHistory.length > 0);
          if (onSearchClear) {
            onSearchClear();
          }
        }
      },
      [onSearchChange, onSearchClear, debouncedSearch, searchHistory.length]
    );

    // 검색 제안 선택
    const handleSuggestionClick = async (suggestion: SearchItem) => {
      trackEvent('discovery_started', { selection_source: 'search_result' });
      onSearchChange(suggestion.name);
      setShowSuggestions(false);
      searchRef.current?.blur();

      // 검색 히스토리에 추가
      addToHistory(suggestion.name, suggestion);

      // 검색 결과 선택 이벤트 발생
      if (onSearchSelect) {
        try {
          await onSearchSelect(suggestion);
        } catch (error) {
          console.error('검색 결과 선택 실패:', error);
        }
      }
    };

    const handleNaturalLanguageRule = () => {
      if (!naturalLanguageRule.matched) return;
      applyNaturalLanguageRule(naturalLanguageRule);
      trackEvent('discovery_started', { selection_source: 'natural_language' });
      setShowSuggestions(false);
      searchRef.current?.blur();
    };

    // 검색 히스토리 아이템 클릭
    const handleHistoryClick = async (historyItem: SearchHistoryItem) => {
      trackEvent('discovery_started', { selection_source: 'search_history' });
      onSearchChange(historyItem.query);
      setShowSuggestions(false);
      searchRef.current?.blur();

      // 히스토리를 최신으로 업데이트
      addToHistory(historyItem.query, historyItem.selectedItem);

      // 선택된 아이템이 있으면 해당 아이템으로 이동
      if (historyItem.selectedItem && onSearchSelect) {
        try {
          await onSearchSelect(historyItem.selectedItem);
        } catch (error) {
          console.error('검색 히스토리 선택 실패:', error);
        }
      }
    };

    // 검색 히스토리 개별 삭제
    const handleRemoveHistoryItem = (e: React.MouseEvent, historyId: string) => {
      e.stopPropagation(); // 부모 클릭 이벤트 방지
      removeFromHistory(historyId);
    };

    // 검색 초기화
    const handleClearSearch = () => {
      onSearchChange('');
      setShowSuggestions(false);
      searchRef.current?.focus();

      // 검색 초기화 이벤트 발생
      if (onSearchClear) {
        onSearchClear();
      }
    };

    // 외부 클릭 감지
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          suggestionRef.current &&
          !suggestionRef.current.contains(event.target as Node) &&
          !searchRef.current?.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
      const currentTimeout = searchTimeoutRef.current;
      return () => {
        if (currentTimeout) {
          clearTimeout(currentTimeout);
        }
      };
    }, []);

    // 인증된 사용자의 알림 개수 초기 로드
    useEffect(() => {
      if (isAuthenticated && user && accessToken) {
        fetchUnreadCount(user.id, accessToken);
      }
    }, [isAuthenticated, user, accessToken, fetchUnreadCount]);

    // 알림 드롭다운 열릴 때 알림 히스토리 로드
    const handleNotificationDropdownOpen = () => {
      if (isAuthenticated && user && accessToken) {
        fetchNotificationHistory(user.id, accessToken);
      }
    };

    // 알림 클릭 시 읽음 처리
    const handleNotificationClick = async (notification: Notification) => {
      if (accessToken && user) {
        await markAsRead(notification.id, user.id, accessToken);
        if (isSafeAppDeepLink(notification.deepLink)) {
          window.location.assign(notification.deepLink);
        }
      }
    };

    // 알림 타입별 아이콘 가져오기
    const getNotificationIcon = (type: string) => {
      switch (type) {
        case 'CONGESTION':
          return <div className='w-2 h-2 bg-orange-500 rounded-full' />;
        case 'LOCATION':
          return <div className='w-2 h-2 bg-blue-500 rounded-full' />;
        case 'EVENT':
          return <div className='w-2 h-2 bg-green-500 rounded-full' />;
        case 'SYSTEM':
          return <div className='w-2 h-2 bg-purple-500 rounded-full' />;
        default:
          return <div className='w-2 h-2 bg-gray-500 rounded-full' />;
      }
    };

    // 날짜 포맷팅 함수
    const formatNotificationDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) {
        return '방금 전';
      } else if (diffInHours < 24) {
        return `${diffInHours}시간 전`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}일 전`;
      }
    };

    // 검색 제안 닫기 함수
    const closeSearchSuggestions = useCallback(() => {
      setShowSuggestions(false);
    }, []);

    // 검색창 포커스 해제 함수
    const blurSearchInput = useCallback(() => {
      searchRef.current?.blur();
    }, []);

    // ref로 외부 함수 노출
    React.useImperativeHandle(
      ref,
      () => ({
        closeSearchSuggestions,
        blurSearchInput,
      }),
      [closeSearchSuggestions, blurSearchInput]
    );

    // 디버깅: 렌더링 직전

    return (
      <div className='p-4'>
        {/* 헤더 */}
        <header className='flex items-center justify-between gap-3'>
          {/* 로고 */}
          <div className='mr-3 flex-shrink-0'>
            <Link
              href='/'
              className='flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F284E] transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'
              aria-label={t('header.home')}
            >
              <svg
                width='32'
                height='32'
                viewBox='0 0 48 49'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M24.0001 11.2046C26.9059 11.2046 29.2618 13.5605 29.2618 16.4663C29.2617 19.974 24.0001 24.6509 24.0001 24.6509C24.0001 24.6509 18.7384 19.974 18.7383 16.4663C18.7383 13.5605 21.0942 11.2046 24.0001 11.2046ZM24.0001 14.2192C22.8237 14.2192 21.8702 15.1727 21.8702 16.3491C21.8702 17.5255 22.8237 18.479 24.0001 18.479C25.1764 18.4789 26.1299 17.5254 26.1299 16.3491C26.1299 15.1728 25.1764 14.2193 24.0001 14.2192Z'
                  fill='white'
                />
                <path
                  d='M19.8088 36.9922V24.6906L13.5467 27.6462V38.59L19.8088 36.9922Z'
                  fill='white'
                />
                <path
                  d='M20.8936 34.3163V25.2897L27.7967 28.3252V37.6714L20.8936 34.3163Z'
                  fill='white'
                />
                <path
                  d='M28.7335 37.6714V23.2926L34.4533 20.5767V34.8356L28.7335 37.6714Z'
                  fill='white'
                />
              </svg>
            </Link>
          </div>

          {/* 검색바 영역 - 반응형으로 전체 너비 활용 */}
          <div className='flex items-center flex-1 relative'>
            <div
              className={`flex items-center w-full bg-gray-50 rounded-lg transition-all duration-200 ${
                isFocused ? 'ring-2 ring-blue-500 bg-white shadow-sm' : 'hover:bg-gray-100'
              }`}
            >
              <Search className='w-5 h-5 text-gray-400 ml-3 flex-shrink-0' />
              <input
                ref={searchRef}
                type='text'
                role='combobox'
                aria-label={t('header.searchLabel')}
                aria-expanded={showSuggestions || cacheLoading}
                aria-controls='global-search-suggestions'
                aria-autocomplete='list'
                placeholder={t('header.searchPlaceholder')}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={event => {
                  if (event.key === 'Escape') {
                    setShowSuggestions(false);
                  } else if (event.key === 'ArrowDown' && showSuggestions) {
                    event.preventDefault();
                    document
                      .querySelector<HTMLElement>(
                        '#global-search-suggestions [role="option"]'
                      )
                      ?.focus();
                  }
                }}
                onFocus={() => {
                  setIsFocused(true);
                  // 검색창 포커스 시 검색 히스토리 표시
                  if (!searchQuery && searchHistory.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => setIsFocused(false)}
                className='flex-1 bg-transparent px-3 py-2.5 outline-none text-gray-700 placeholder-gray-400 min-w-0'
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className='p-1 mr-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0'
                  aria-label={t('header.clearSearch')}
                >
                  <X className='w-4 h-4 text-gray-400' />
                </button>
              )}
            </div>

            {/* 검색 제안 드롭다운 */}
            {(showSuggestions || cacheLoading) && (
              <div
                id='global-search-suggestions'
                ref={suggestionRef}
                role='listbox'
                aria-label={t('header.searchResults')}
                className='absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto'
              >
                {cacheLoading && (
                  <div className='px-4 py-3 text-center text-gray-500 flex items-center justify-center gap-2'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    {t('header.loading')}
                  </div>
                )}

                {!cacheLoading &&
                  (() => {
                    const relevantHistory = getRelevantHistory(searchQuery);
                    const hasHistory = relevantHistory.length > 0;
                    const hasSuggestions = suggestions.length > 0;
                    const hasRule = naturalLanguageRule.matched;

                    return (
                      <>
                        {hasRule && (
                          <button
                            type='button'
                            role='option'
                            aria-selected='false'
                            onClick={handleNaturalLanguageRule}
                            className='flex w-full items-start gap-3 border-b border-violet-100 bg-violet-50 px-4 py-3 text-left hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-600'
                          >
                            <WandSparkles
                              className='mt-0.5 h-4 w-4 shrink-0 text-violet-700'
                              aria-hidden='true'
                            />
                            <span className='min-w-0'>
                              <span className='block text-xs font-semibold text-violet-900'>
                                {t('header.applyRules')}
                              </span>
                              <span className='mt-0.5 block text-xs text-violet-800'>
                                {locale === 'en'
                                  ? naturalLanguageRule.summaryEn
                                  : naturalLanguageRule.summary}
                              </span>
                            </span>
                          </button>
                        )}
                        {/* 검색 히스토리 섹션 */}
                        {hasHistory && (
                          <>
                            <div className='px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between'>
                              <span className='text-xs font-medium text-gray-600 flex items-center gap-1'>
                                <Clock className='w-3 h-3' />
                                {t('header.recentSearch')}
                              </span>
                              {relevantHistory.length > 0 && (
                                <button
                                  onClick={() => clearHistory()}
                                  className='text-xs text-gray-400 hover:text-gray-600 transition-colors'
                                >
                                  {t('header.clearAll')}
                                </button>
                              )}
                            </div>
                            {relevantHistory.slice(0, 5).map(historyItem => (
                              <div
                                key={historyItem.id}
                                role='presentation'
                                className='group flex w-full items-center border-b border-gray-100 hover:bg-gray-50'
                              >
                                <button
                                  type='button'
                                  role='option'
                                  aria-selected='false'
                                  onClick={() => handleHistoryClick(historyItem)}
                                  className='flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600'
                                >
                                  <Clock className='h-4 w-4 flex-shrink-0 text-gray-500' />
                                  <span className='min-w-0 flex-1'>
                                    <span className='block truncate font-medium text-gray-700'>
                                      {historyItem.query}
                                    </span>
                                    {historyItem.selectedItem && (
                                      <span className='block truncate text-xs text-gray-600'>
                                        {historyItem.selectedItem.address?.split(',')[0] ||
                                          historyItem.selectedItem.name}
                                      </span>
                                    )}
                                  </span>
                                </button>
                                <button
                                  type='button'
                                  onClick={e => handleRemoveHistoryItem(e, historyItem.id)}
                                  className='mr-3 flex-shrink-0 rounded-full p-2 opacity-0 transition-all hover:bg-gray-200 focus:opacity-100 group-hover:opacity-100'
                                  aria-label={t('header.removeHistory', {
                                    query: historyItem.query,
                                  })}
                                >
                                  <X className='h-3 w-3 text-gray-600' />
                                </button>
                              </div>
                            ))}
                          </>
                        )}

                        {/* 자동완성 결과 섹션 */}
                        {hasSuggestions && (
                          <>
                            {hasHistory && (
                              <div className='px-4 py-2 bg-gray-50 border-b border-gray-100'>
                                <span className='text-xs font-medium text-gray-600'>
                                  {t('header.searchResults')}
                                </span>
                              </div>
                            )}
                            {suggestions.map(suggestion => (
                              <button
                                key={suggestion.id}
                                type='button'
                                role='option'
                                aria-selected='false'
                                onClick={() => handleSuggestionClick(suggestion)}
                                className='w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0'
                              >
                                {getCategoryIcon(suggestion.category)}
                                <div className='flex-1 min-w-0'>
                                  <div className='font-medium text-gray-900 truncate'>
                                    {suggestion.name}
                                    {suggestion.remark && (
                                      <span className='ml-2 text-xs text-gray-400'>
                                        ({suggestion.remark.split(',')[0]})
                                      </span>
                                    )}
                                  </div>
                                  {suggestion.address && (
                                    <div className='text-sm text-gray-500 truncate'>
                                      {suggestion.address.split(',')[0]}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </>
                        )}

                        {/* 결과 없음 메시지 */}
                        {!hasHistory && !hasSuggestions && !hasRule && searchQuery.length > 0 && (
                          <div className='px-4 py-3 text-center text-gray-500'>
                            {t('header.noResults')}
                          </div>
                        )}
                      </>
                    );
                  })()}

                {cacheError && (
                  <div className='px-4 py-3 text-center text-red-500 text-sm'>{cacheError}</div>
                )}
              </div>
            )}
          </div>

          {/* 우측 버튼들 */}
          <div className='flex items-center gap-2 flex-shrink-0'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='hidden gap-1 px-2 text-xs sm:inline-flex'
              onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')}
              aria-label={locale === 'ko' ? 'Switch to English' : '한국어로 전환'}
            >
              <Languages className='h-4 w-4' aria-hidden='true' />
              {t('language.toggle')}
            </Button>
            <Link
              href='/places'
              className='hidden rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:inline-flex'
            >
              {t('header.places')}
            </Link>
            {/* 알림 버튼 - 로그인 상태에서만 표시 */}
            {isAuthenticated && (
              <div className='relative'>
                <DropdownMenu onOpenChange={open => open && handleNotificationDropdownOpen()}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      size='icon'
                      className='relative'
                      aria-label={t('header.openNotifications')}
                    >
                      <Bell className='h-4 w-4' />
                      {notificationCount > 0 && (
                        <div className='absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center min-w-[1.25rem]'>
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-80 max-h-96 overflow-y-auto'>
                    <div className='flex items-center justify-between px-3 py-2 border-b'>
                      <span className='font-medium'>{t('header.notifications')}</span>
                      {notifications.some(n => n.status === 'SENT') && (
                        <button
                          onClick={async e => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (user && accessToken) {
                              await markAllAsRead(user.id, accessToken);
                              await fetchUnreadCount(user.id, accessToken);
                            }
                          }}
                          className='text-xs text-blue-600 hover:text-blue-700 font-medium'
                        >
                          {t('header.markAllRead')}
                        </button>
                      )}
                    </div>

                    {isLoadingHistory ? (
                      <DropdownMenuItem>
                        <div className='flex items-center gap-2 w-full justify-center py-4'>
                          <Loader2 className='w-4 h-4 animate-spin' />
                          <span className='text-sm text-gray-600'>{t('header.loading')}</span>
                        </div>
                      </DropdownMenuItem>
                    ) : notifications.length > 0 ? (
                      notifications.map(notification => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`cursor-pointer border-b last:border-b-0 ${
                            notification.status === 'SENT' ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className='flex items-start gap-3 w-full py-2'>
                            {getNotificationIcon(notification.type)}
                            <div className='flex-1 min-w-0'>
                              <div className='font-medium text-sm truncate'>
                                {notification.title}
                              </div>
                              <div className='text-xs text-gray-600 mt-1 line-clamp-2'>
                                {notification.message}
                              </div>
                              {notification.reason && (
                                <div className='mt-1 line-clamp-2 text-xs text-blue-700'>
                                  {notification.reason}
                                </div>
                              )}
                              <div className='flex items-center justify-between mt-2'>
                                <span className='text-xs text-gray-400'>
                                  {formatNotificationDate(
                                    notification.sentAt || notification.createdAt
                                  )}
                                </span>
                                {notification.status === 'SENT' && (
                                  <div className='w-2 h-2 bg-blue-500 rounded-full' />
                                )}
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem>
                        <div className='flex items-center justify-center w-full py-8'>
                          <span className='text-sm text-gray-500'>알림이 없습니다</span>
                        </div>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* 프로필 버튼 - 로그인 상태에서만 표시 */}
            {isAuthenticated && (
              <Button
                variant='outline'
                size='icon'
                onClick={() => (window.location.href = '/profile')}
                title={user?.nickname || '내 정보'}
              >
                <User className='h-4 w-4' />
              </Button>
            )}

            {/* 메뉴 버튼 */}
            <button
              onClick={onMenuClick}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              aria-label={t('header.openMenu')}
            >
              <Menu className='w-6 h-6 text-gray-700' />
            </button>
          </div>
        </header>
      </div>
    );
  }
);

Header.displayName = 'Header';

export default Header;
