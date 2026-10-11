'use client';

import React from 'react';

import { useI18n, type Locale } from '@/shared/i18n/I18nProvider';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { SidebarSection } from './SidebarSection';

export function LanguageSection() {
  const { locale, setLocale, t } = useI18n();

  return (
    <SidebarSection id='sidebar-language' title={t('language.label')}>
      <div className='px-4 pb-2'>
        <SegmentedControl<Locale>
          aria-label={t('language.label')}
          value={locale}
          onValueChange={setLocale}
          options={[
            { value: 'ko', label: t('language.ko'), lang: 'ko' },
            { value: 'en', label: t('language.en'), lang: 'en' },
          ]}
        />
      </div>
    </SidebarSection>
  );
}
