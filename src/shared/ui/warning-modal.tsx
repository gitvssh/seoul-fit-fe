'use client';

import React from 'react';

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

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 마지막 카테고리까지 끄려고 할 때 보이는 경고. 확인·Escape·바깥 클릭이 모두 닫는다. */
export default function WarningModal({ isOpen, onClose }: WarningModalProps) {
  const { t } = useI18n();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('warning.title')}</DialogTitle>
          <DialogDescription>{t('warning.description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type='button' size='lg' onClick={onClose}>
            {t('warning.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
