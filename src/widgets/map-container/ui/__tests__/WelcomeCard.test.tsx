import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { WELCOME_STORAGE_KEY, WelcomeCard } from '../WelcomeCard';

describe('WelcomeCard', () => {
  beforeEach(() => window.localStorage.clear());

  it('shows once, applies a preset and remembers dismissal', async () => {
    const user = userEvent.setup();
    const onPreset = jest.fn();
    render(
      <I18nProvider>
        <WelcomeCard onPreset={onPreset} />
      </I18nProvider>
    );
    expect(await screen.findByRole('button', { name: '비 오는 날' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '비 오는 날' }));
    expect(onPreset).toHaveBeenCalledWith('rainy_day');
    expect(window.localStorage.getItem(WELCOME_STORAGE_KEY)).toBe('dismissed');
    expect(screen.queryByRole('button', { name: '안내 닫기' })).not.toBeInTheDocument();
  });

  it('stays hidden after it was dismissed', () => {
    window.localStorage.setItem(WELCOME_STORAGE_KEY, 'dismissed');
    render(
      <I18nProvider>
        <WelcomeCard onPreset={jest.fn()} />
      </I18nProvider>
    );
    expect(screen.queryByRole('button', { name: '안내 닫기' })).not.toBeInTheDocument();
  });
});
