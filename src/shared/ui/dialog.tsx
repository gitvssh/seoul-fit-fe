'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { buttonVariants } from './button';

type AutoFocusProps = Pick<
  React.ComponentProps<typeof DialogPrimitive.Content>,
  'onOpenAutoFocus' | 'onCloseAutoFocus'
>;

/**
 * Radix는 닫힐 때 `Dialog.Trigger`로만 포커스를 돌려준다. 이 앱의 모달은 헤더 버튼 등
 * 바깥 상태로 열리므로, 열릴 때 포커스가 있던 요소를 기억했다가 닫힐 때 그 요소로 돌려준다.
 * 호출자가 `onCloseAutoFocus`에서 `preventDefault()`를 부르면 그 결정을 따른다.
 */
function useRestoreFocus({ onOpenAutoFocus, onCloseAutoFocus }: AutoFocusProps): AutoFocusProps {
  const openerRef = React.useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: event => {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
      onOpenAutoFocus?.(event);
    },
    onCloseAutoFocus: event => {
      onCloseAutoFocus?.(event);
      const opener = openerRef.current;
      openerRef.current = null;
      if (event.defaultPrevented || !opener?.isConnected) return;
      event.preventDefault();
      opener.focus();
    },
  };
}

/**
 * 진짜 모달(로그아웃·경고·설정)에만 쓰는 Dialog. Radix가 role=dialog, aria-modal,
 * 포커스 트랩, Escape, 포커스 복귀를 제공한다. 표면은 solid `bg-card`, 레이어는 `z-dialog`.
 */
function Dialog({ ...props }: Readonly<React.ComponentProps<typeof DialogPrimitive.Root>>) {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot='dialog-trigger' {...props} />;
}

function DialogPortal({ ...props }: Readonly<React.ComponentProps<typeof DialogPrimitive.Portal>>) {
  return <DialogPrimitive.Portal data-slot='dialog-portal' {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot='dialog-close' {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot='dialog-overlay'
      className={cn(
        // The overlay only fades, so it may keep its fade under reduced motion.
        'motion-keep-fade fixed inset-0 z-dialog bg-scrim/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:duration-base data-[state=closed]:duration-exit',
        className
      )}
      {...props}
    />
  );
}

interface DialogContentProps extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /** 우상단 닫기 버튼의 접근 가능한 이름. 생략하면 닫기 버튼을 그리지 않는다. */
  closeLabel?: string;
}

function DialogContent({ className, children, closeLabel, ...props }: Readonly<DialogContentProps>) {
  const restoreFocus = useRestoreFocus(props);
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot='dialog-content'
        aria-modal='true'
        className={cn(
          'fixed left-1/2 top-1/2 z-dialog grid w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-float-lg outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:duration-base data-[state=closed]:duration-exit data-[state=open]:ease-enter data-[state=closed]:ease-exit',
          className
        )}
        {...props}
        {...restoreFocus}
      >
        {children}
        {closeLabel ? (
          <DialogPrimitive.Close
            data-slot='dialog-close'
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              'absolute right-3 top-3'
            )}
            aria-label={closeLabel}
          >
            <XIcon className='size-4' aria-hidden='true' />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-header'
      className={cn('flex flex-col gap-1.5 text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot='dialog-title'
      className={cn('text-title text-foreground', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot='dialog-description'
      className={cn('text-body-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  useRestoreFocus,
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
