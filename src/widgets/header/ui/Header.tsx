'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Languages, Menu } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { LogoMark, Wordmark } from '@/shared/ui/brand/Logo';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { SearchBox, type SearchBoxHandle } from '@/features/place-search';
import { NotificationsMenu } from './NotificationsMenu';

export interface HeaderRef {
  closeSearchSuggestions: () => void;
  blurSearchInput: () => void;
}

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSelect?: (searchItem: SearchItem) => void | Promise<void>;
  onSearchClear?: () => void;
  onMenuClick: () => void;
}

/**
 * 56px 헤더 띠. 모바일은 지도 위 글라스 띠([메뉴][검색][알림]), 데스크톱은 패널 상단
 * ([로고][검색][테마·언어·알림·메뉴]). 한 번만 렌더되고 반응형 클래스로만 배치가 바뀐다.
 */
const Header = React.forwardRef<HeaderRef, HeaderProps>(function Header(
  { searchQuery, onSearchChange, onSearchSelect, onSearchClear, onMenuClick },
  ref
) {
  const { locale, setLocale, t } = useI18n();
  const searchRef = useRef<SearchBoxHandle>(null);

  React.useImperativeHandle(ref, () => ({
    closeSearchSuggestions: () => searchRef.current?.closeSuggestions(),
    blurSearchInput: () => searchRef.current?.blur(),
  }));

  return (
    <header className='grid h-[var(--header-height)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 surface-glass border-b border-border/60 md:h-auto md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-3 md:gap-y-2 md:px-4 md:pb-3 md:pt-2 md:[backdrop-filter:none] md:[background-color:hsl(var(--background))]'>
      <Button
        type='button'
        variant='ghost'
        size='icon-lg'
        className='-ml-1 shrink-0 md:hidden'
        onClick={onMenuClick}
        aria-label={t('header.openSettings')}
      >
        <Menu className='size-6' aria-hidden='true' />
      </Button>
      <Link
        href='/'
        className='hidden h-10 shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:inline-flex'
        aria-label={t('header.home')}
      >
        <LogoMark size={32} />
        <Wordmark />
      </Link>
      <div className='col-start-3 row-start-1 flex shrink-0 items-center gap-0.5 md:col-start-2'>
        <NotificationsMenu />
        <ThemeToggle variant='icon' className='hidden md:inline-flex' />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='hidden md:inline-flex'
          onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')}
          aria-label={t('header.toggleLanguage')}
        >
          <Languages aria-hidden='true' />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='hidden md:inline-flex'
          onClick={onMenuClick}
          aria-label={t('header.openSettings')}
        >
          <Menu aria-hidden='true' />
        </Button>
      </div>
      <SearchBox
        ref={searchRef}
        className='col-start-2 row-start-1 min-w-0 md:col-span-2 md:col-start-1 md:row-start-2'
        variant='pill'
        query={searchQuery}
        onQueryChange={onSearchChange}
        onSelect={item => onSearchSelect?.(item)}
        onClear={() => onSearchClear?.()}
      />
    </header>
  );
});

export default Header;
