'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Languages, Menu, Moon, Sun, SunMoon } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { LogoMark, Wordmark } from '@/shared/ui/brand/Logo';
import type { SearchItem } from '@/shared/lib/hooks/useSearchCache';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { useTheme } from '@/shared/lib/theme';
import { HeaderSearch, type HeaderSearchHandle } from './HeaderSearch';
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

const THEME_ORDER = ['system', 'light', 'dark'] as const;

/**
 * 56px 헤더 띠. 모바일은 지도 위 글라스 띠([메뉴][검색][알림]), 데스크톱은 패널 상단
 * ([로고][검색][테마·언어·알림·메뉴]). 한 번만 렌더되고 반응형 클래스로만 배치가 바뀐다.
 */
const Header = React.forwardRef<HeaderRef, HeaderProps>(function Header(
  { searchQuery, onSearchChange, onSearchSelect, onSearchClear, onMenuClick },
  ref
) {
  const { locale, setLocale, t } = useI18n();
  const { preference, resolved, setPreference } = useTheme();
  const searchRef = useRef<HeaderSearchHandle>(null);

  React.useImperativeHandle(ref, () => ({
    closeSearchSuggestions: () => searchRef.current?.closeSuggestions(),
    blurSearchInput: () => searchRef.current?.blur(),
  }));

  const cycleTheme = () => {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(preference) + 1) % THEME_ORDER.length];
    setPreference(next);
  };
  const ThemeIcon = preference === 'system' ? SunMoon : resolved === 'dark' ? Moon : Sun;

  return (
    <header className='flex h-[var(--header-height)] items-center gap-2 px-3 surface-glass border-b border-border/60 md:bg-background md:px-4 md:[backdrop-filter:none] md:[background-color:hsl(var(--background))]'>
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
        className='hidden shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:inline-flex'
        aria-label={t('header.home')}
      >
        <LogoMark size={32} />
        <Wordmark className='hidden lg:inline' />
      </Link>
      <HeaderSearch
        ref={searchRef}
        className='min-w-0 flex-1'
        query={searchQuery}
        onQueryChange={onSearchChange}
        onSelect={onSearchSelect}
        onClear={onSearchClear}
      />
      <div className='flex shrink-0 items-center gap-0.5'>
        <NotificationsMenu />
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='hidden md:inline-flex'
          onClick={cycleTheme}
          aria-label={t('theme.label')}
        >
          <ThemeIcon aria-hidden='true' />
        </Button>
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
    </header>
  );
});

export default Header;
