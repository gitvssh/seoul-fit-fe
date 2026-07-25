'use client';

import React from 'react';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { enMessages, koMessages, type MessageKey } from './messages';

export type Locale = 'ko' | 'en';
export const LOCALE_STORAGE_KEY = 'seoul-fit.locale.v1';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

function readLocale(): Locale {
  if (typeof window === 'undefined') return 'ko';
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY) === 'en' ? 'en' : 'ko';
  } catch {
    return 'ko';
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>('ko');

  React.useEffect(() => {
    setLocaleState(readLocale());
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = React.useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // The current page can still use the selected locale when storage is unavailable.
    }
    trackEvent('language_changed', { language: nextLocale });
  }, []);

  const t = React.useCallback(
    (key: MessageKey, values: Record<string, string | number> = {}) => {
      const messages = locale === 'en' ? enMessages : koMessages;
      return Object.entries(values).reduce(
        (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
        messages[key]
      );
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
      <span className='sr-only' role='status' aria-live='polite'>
        {t('language.changed')}
      </span>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = React.useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
