'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { LogoMark } from '@/shared/ui/brand/Logo';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import type { RecommendationPreset } from '@/features/recommendation/model/types';
import { cn } from '@/shared/lib/utils';

export const WELCOME_STORAGE_KEY = 'seoul-fit.welcome.v1';
const TRY_PRESETS: RecommendationPreset[] = ['available_now', 'rainy_day', 'bike_trip'];

interface WelcomeCardProps {
  onPreset: (preset: RecommendationPreset) => void;
  className?: string;
}

/** 첫 방문에 한 번만 보이는 환영 카드. 모달이 아니며 지도 조작을 막지 않는다. */
export function WelcomeCard({ onPreset, className }: Readonly<WelcomeCardProps>) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(WELCOME_STORAGE_KEY) !== 'dismissed');
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(WELCOME_STORAGE_KEY, 'dismissed');
    } catch {
      // 저장이 막혀 있어도 이번 방문에서는 닫힌다.
    }
  };

  if (!visible) return null;

  return (
    <section
      aria-label={t('welcome.title')}
      className={cn(
        'pointer-events-auto rounded-xl border border-border bg-card p-4 text-card-foreground shadow-float-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-base motion-reduce:animate-none',
        className
      )}
    >
      <div className='flex items-start gap-3'>
        <LogoMark size={36} />
        <div className='min-w-0 flex-1'>
          <p className='text-body font-semibold leading-snug'>{t('welcome.title')}</p>
          <p className='mt-1 text-caption text-muted-foreground'>{t('welcome.description')}</p>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='-mr-1 -mt-1 shrink-0'
          onClick={dismiss}
          aria-label={t('welcome.close')}
        >
          <X className='size-4' aria-hidden='true' />
        </Button>
      </div>
      <div className='mt-3 flex flex-wrap items-center gap-1.5'>
        <span className='text-caption text-muted-foreground'>{t('welcome.try')}</span>
        {TRY_PRESETS.map(preset => (
          <button
            key={preset}
            type='button'
            onClick={() => {
              onPreset(preset);
              dismiss();
            }}
            className='h-8 rounded-full border border-border bg-background px-3 text-label outline-none transition-colors duration-fast hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50'
          >
            {t(`preset.${preset}` as MessageKey)}
          </button>
        ))}
        <Link
          href='/about'
          className='ml-auto inline-flex items-center gap-1 text-label text-primary underline-offset-4 hover:underline'
        >
          {t('welcome.about')}
          <ArrowRight className='size-3.5' aria-hidden='true' />
        </Link>
      </div>
    </section>
  );
}
