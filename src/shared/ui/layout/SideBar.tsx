'use client';

import React from 'react';
import { X } from 'lucide-react';

import type { FacilityCategory } from '@/lib/types';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/shared/ui/sheet';
import WarningModal from '@/shared/ui/warning-modal';
import { AccountSection } from './sections/AccountSection';
import { LanguageSection } from './sections/LanguageSection';
import { LinksSection } from './sections/LinksSection';
import { MarkerSection } from './sections/MarkerSection';
import { ThemeSection } from './sections/ThemeSection';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategories: FacilityCategory[];
  onCategoryToggle: (type: FacilityCategory) => void;
  onLogin?: () => void;
  onLogout?: () => void;
  showWarning?: boolean;
  onWarningClose?: () => void;
  /** 메뉴 안의 내부 링크(/places, /about, /profile)를 눌렀을 때. 기본 이동은 막지 않는다. */
  onNavigate?: (href: string) => void;
}

const noop = () => undefined;

/**
 * 설정 사이드 메뉴(계정·지도 마커·화면 테마·언어·둘러보기). Radix Sheet 위에 있어
 * role=dialog("설정"), aria-modal, 포커스 트랩, Escape, 포커스 복귀가 보장된다.
 */
export default function SideBar({
  isOpen,
  onClose,
  activeCategories,
  onCategoryToggle,
  onLogin,
  onLogout,
  showWarning,
  onWarningClose,
  onNavigate,
}: SidebarProps) {
  const { t } = useI18n();
  const closeRef = React.useRef<HTMLButtonElement>(null);

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={open => {
          if (!open) onClose();
        }}
      >
        <SheetContent
          side='right'
          aria-describedby={undefined}
          className='w-full gap-0 p-0 sm:w-[360px] sm:max-w-[360px]'
          onOpenAutoFocus={event => {
            event.preventDefault();
            closeRef.current?.focus();
          }}
        >
          <div className='flex h-14 shrink-0 items-center justify-between border-b border-border pl-4 pr-2'>
            <SheetTitle>{t('sidebar.title')}</SheetTitle>
            <SheetClose asChild>
              <Button
                ref={closeRef}
                type='button'
                variant='ghost'
                size='icon-lg'
                aria-label={t('sidebar.close')}
              >
                <X className='size-5' aria-hidden='true' />
              </Button>
            </SheetClose>
          </div>

          <div className='flex-1 overflow-y-auto overscroll-contain'>
            <AccountSection onLogin={onLogin} onLogout={onLogout} onNavigate={onNavigate} />
            <MarkerSection
              activeCategories={activeCategories}
              onCategoryToggle={onCategoryToggle}
            />
            <ThemeSection />
            <LanguageSection />
            <LinksSection onNavigate={onNavigate} />
          </div>

          <p className='shrink-0 border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-caption text-muted-foreground'>
            {t('sidebar.attribution')}
          </p>
        </SheetContent>
      </Sheet>

      <WarningModal isOpen={showWarning ?? false} onClose={onWarningClose ?? noop} />
    </>
  );
}
