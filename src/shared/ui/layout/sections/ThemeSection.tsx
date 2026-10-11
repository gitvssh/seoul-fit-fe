'use client';

import React from 'react';

import { useI18n } from '@/shared/i18n/I18nProvider';
import { useTheme } from '@/shared/lib/theme';
import { Switch } from '@/shared/ui/switch';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { SidebarSection } from './SidebarSection';

export function ThemeSection() {
  const { t } = useI18n();
  const { resolved, mapDark, setMapDark } = useTheme();
  const switchId = 'sidebar-map-dark';
  const hintId = `${switchId}-hint`;

  return (
    <SidebarSection id='sidebar-theme' title={t('theme.label')}>
      <div className='px-4 pb-1'>
        <ThemeToggle variant='segmented' />
      </div>
      <div className='flex min-h-11 items-center justify-between gap-3 px-4'>
        <label htmlFor={switchId} className='text-body text-foreground'>
          {t('theme.mapDark')}
        </label>
        <Switch
          id={switchId}
          checked={mapDark}
          onCheckedChange={setMapDark}
          disabled={resolved !== 'dark'}
          aria-describedby={hintId}
        />
      </div>
      <p id={hintId} className='px-4 pb-2 text-caption text-muted-foreground'>
        {t('theme.mapDarkHint')}
      </p>
    </SidebarSection>
  );
}
