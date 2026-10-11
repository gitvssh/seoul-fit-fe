'use client';

import React, { useMemo } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { cn } from '@/shared/lib/utils';

export type SheetSnap = 'peek' | 'half' | 'full';

export const SHEET_PEEK_PX = 168;
const SNAP_VALUES: Record<SheetSnap, Drawer.Root.SnapPoint> = {
  peek: `${SHEET_PEEK_PX}px`,
  half: 0.55,
  full: 1,
};
const SNAP_ORDER: SheetSnap[] = ['peek', 'half', 'full'];

/** 시트 높이(px): 지도 컨트롤·로고가 가려지지 않도록 지도에 알린다. */
export function sheetVisibleHeight(snap: SheetSnap, viewportHeight: number): number {
  if (snap === 'peek') return SHEET_PEEK_PX;
  if (snap === 'half') return Math.round(viewportHeight * 0.55);
  return viewportHeight;
}

function snapKeyOf(value: Drawer.Root.SnapPoint | null): SheetSnap | null {
  if (value === null) return null;
  return (SNAP_ORDER.find(key => SNAP_VALUES[key] === value) ?? null) as SheetSnap | null;
}

interface MobileSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** 피크에서 더 내리거나 Escape를 눌렀을 때: 선택 해제 등 */
  onDismissAttempt: (reason: string) => void;
  label: string;
  children: React.ReactNode;
}

/**
 * 비모달 3단 스냅 바텀시트. 열린 채로 지도 조작이 가능하고, 피크 아래로는 닫히지 않는다.
 * Escape는 한 단계씩 접고, 피크에서는 onDismissAttempt로 위임한다.
 */
export function MobileSheet({
  snap,
  onSnapChange,
  onDismissAttempt,
  label,
  children,
}: MobileSheetProps) {
  const { t } = useI18n();
  const snapPoints = useMemo(() => SNAP_ORDER.map(key => SNAP_VALUES[key]), []);

  const cycle = () => {
    const index = SNAP_ORDER.indexOf(snap);
    onSnapChange(SNAP_ORDER[(index + 1) % SNAP_ORDER.length]);
  };

  return (
    <Drawer.Root
      open
      modal={false}
      disablePointerDismissal
      snapPoints={snapPoints}
      snapPoint={SNAP_VALUES[snap]}
      onSnapPointChange={value => {
        const next = snapKeyOf(value);
        if (next) onSnapChange(next);
      }}
      onOpenChange={(open, details) => {
        if (open) return;
        details.cancel();
        if (details.reason === 'escape-key') {
          if (snap !== 'peek') onSnapChange(SNAP_ORDER[SNAP_ORDER.indexOf(snap) - 1]);
          else onDismissAttempt('escape-key');
          return;
        }
        onDismissAttempt(details.reason);
      }}
    >
      <Drawer.Portal keepMounted>
        <Drawer.Viewport className='pointer-events-none fixed inset-x-0 bottom-0 top-0 z-sheet'>
          <Drawer.Popup
            initialFocus={false}
            finalFocus={false}
            aria-label={label}
            className={cn(
              'pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col rounded-t-xl border border-b-0 border-border bg-card text-card-foreground shadow-float-lg outline-none',
              'h-[calc(100dvh-var(--header-height))] max-h-[100dvh]',
              '[transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]',
              'transition-transform duration-sheet ease-enter data-[swiping]:transition-none motion-reduce:transition-none'
            )}
          >
            <div className='flex shrink-0 justify-center pb-1 pt-2'>
              <button
                type='button'
                className='flex h-8 w-20 items-center justify-center rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
                onClick={cycle}
                onKeyDown={event => {
                  if (event.key === 'ArrowUp' && snap !== 'full') {
                    event.preventDefault();
                    onSnapChange(SNAP_ORDER[SNAP_ORDER.indexOf(snap) + 1]);
                  } else if (event.key === 'ArrowDown' && snap !== 'peek') {
                    event.preventDefault();
                    onSnapChange(SNAP_ORDER[SNAP_ORDER.indexOf(snap) - 1]);
                  }
                }}
                aria-label={t('map.sheet.handle')}
                aria-expanded={snap !== 'peek'}
              >
                <span
                  className='h-1.5 w-10 rounded-full bg-muted-foreground/40'
                  aria-hidden='true'
                />
              </button>
            </div>
            <Drawer.Content className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
