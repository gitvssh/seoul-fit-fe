import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  I18nProvider,
  LOCALE_STORAGE_KEY,
  useI18n,
} from '../I18nProvider';

function Harness() {
  const { locale, setLocale, t } = useI18n();
  return (
    <button type='button' onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')}>
      {t('explorer.noPlaces')}
    </button>
  );
}

describe('I18nProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = 'ko';
  });

  it('restores English and updates the document language', async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    render(
      <I18nProvider>
        <Harness />
      </I18nProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole('button')).toHaveTextContent(
        'No places match this map and filters.'
      )
    );
    expect(document.documentElement.lang).toBe('en');
  });

  it('persists a user language change', () => {
    render(
      <I18nProvider>
        <Harness />
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(screen.getByRole('button')).toHaveTextContent(
      'No places match this map and filters.'
    );
  });
});
