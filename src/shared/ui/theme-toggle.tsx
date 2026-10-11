'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

import { useI18n } from '@/shared/i18n/I18nProvider';
import { THEME_PREFERENCES, useTheme, type ThemePreference } from '@/shared/lib/theme';
import { cn } from '@/shared/lib/utils';
import { Button } from './button';
import { SegmentedControl } from './segmented-control';

interface ThemeToggleProps {
  /** `segmented`: 시스템/라이트/다크 3단(설정 메뉴). `icon`: 순환 아이콘 버튼(헤더). */
  variant?: 'segmented' | 'icon';
  className?: string;
}

const PREFERENCE_ICONS: Record<ThemePreference, React.ReactNode> = {
  system: <Monitor className='size-4' aria-hidden='true' />,
  light: <Sun className='size-4' aria-hidden='true' />,
  dark: <Moon className='size-4' aria-hidden='true' />,
};

export function ThemeToggle({ variant = 'segmented', className }: ThemeToggleProps) {
  const { preference, resolved, setPreference } = useTheme();
  const { t } = useI18n();

  const preferenceLabel = (value: ThemePreference) => t(`theme.${value}`);
  const currentValue =
    preference === 'system'
      ? `${preferenceLabel('system')} (${preferenceLabel(resolved)})`
      : preferenceLabel(preference);
  const currentText = t('theme.current', { value: currentValue });

  if (variant === 'icon') {
    const cycle = () => {
      const index = THEME_PREFERENCES.indexOf(preference);
      setPreference(THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length]);
    };
    const ResolvedIcon = resolved === 'dark' ? Moon : Sun;
    return (
      <Button
        type='button'
        variant='ghost'
        size='icon-lg'
        className={className}
        onClick={cycle}
        aria-label={t('theme.label')}
        aria-description={currentText}
      >
        <ResolvedIcon className='size-5' aria-hidden='true' />
        <span className='sr-only'>{currentText}</span>
      </Button>
    );
  }

  return (
    <SegmentedControl
      aria-label={t('theme.label')}
      value={preference}
      onValueChange={setPreference}
      className={cn(className)}
      options={THEME_PREFERENCES.map(value => ({
        value,
        label: preferenceLabel(value),
        icon: PREFERENCE_ICONS[value],
      }))}
    />
  );
}
