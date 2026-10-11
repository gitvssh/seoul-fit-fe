'use client';

import React from 'react';
import { LoaderCircle } from 'lucide-react';

import { useI18n } from '@/shared/i18n/I18nProvider';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

interface LogoutModalProps {
  showLogoutModal: boolean;
  /** 로그아웃이 끝나고 부모가 홈으로 이동시키는 동안 보이는 짧은 상태. */
  showLogoutSuccess: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({
  showLogoutModal,
  showLogoutSuccess,
  onCancel,
  onConfirm,
}: LogoutModalProps) {
  const { t } = useI18n();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  return (
    <>
      <Dialog
        open={showLogoutModal}
        onOpenChange={open => {
          if (!open) onCancel();
        }}
      >
        <DialogContent
          onOpenAutoFocus={event => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('logout.title')}</DialogTitle>
            <DialogDescription>{t('logout.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button ref={cancelRef} type='button' variant='secondary' size='lg' onClick={onCancel}>
              {t('logout.cancel')}
            </Button>
            <Button type='button' variant='destructive' size='lg' onClick={onConfirm}>
              {t('logout.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogoutSuccess}>
        <DialogContent
          onEscapeKeyDown={event => event.preventDefault()}
          onInteractOutside={event => event.preventDefault()}
        >
          <div
            role='status'
            aria-live='polite'
            className='flex flex-col items-center gap-3 text-center'
          >
            <LoaderCircle className='size-6 animate-spin text-primary' aria-hidden='true' />
            <DialogTitle>{t('logout.successTitle')}</DialogTitle>
            <DialogDescription>{t('logout.successDescription')}</DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
