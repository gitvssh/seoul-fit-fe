import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeToggle } from '../theme-toggle';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { THEME_STORAGE_KEY, ThemeProvider } from '@/shared/lib/theme';
import { installMatchMedia } from '@/shared/lib/testing/match-media';

function renderToggle(variant: 'segmented' | 'icon') {
  return render(
    <ThemeProvider>
      <I18nProvider>
        <ThemeToggle variant={variant} />
      </I18nProvider>
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    installMatchMedia(false);
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('segmented: shows fixed labels, marks the current preference and applies a new one', () => {
    renderToggle('segmented');
    const group = screen.getByRole('group', { name: '화면 테마' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map(button => button.textContent)).toEqual(['시스템', '라이트', '다크']);
    expect(within(group).getByRole('button', { name: '시스템' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    fireEvent.click(within(group).getByRole('button', { name: '다크' }));
    expect(within(group).getByRole('button', { name: '다크' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(group).getByRole('button', { name: '시스템' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('icon: cycles system, light and dark with a fixed name and the current value as description', () => {
    renderToggle('icon');
    const button = screen.getByRole('button', { name: '화면 테마' });
    expect(button).toHaveAttribute('aria-description', '현재 시스템 (라이트)');

    fireEvent.click(button);
    expect(button).toHaveAccessibleName('화면 테마');
    expect(button).toHaveAttribute('aria-description', '현재 라이트');
    expect(document.documentElement).not.toHaveClass('dark');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-description', '현재 다크');
    expect(document.documentElement).toHaveClass('dark');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-description', '현재 시스템 (라이트)');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('follows the system preference while set to system', () => {
    const media = installMatchMedia(true);
    renderToggle('icon');
    expect(screen.getByRole('button', { name: '화면 테마' })).toHaveAttribute(
      'aria-description',
      '현재 시스템 (다크)'
    );
    act(() => media.setMatches(false));
    expect(screen.getByRole('button', { name: '화면 테마' })).toHaveAttribute(
      'aria-description',
      '현재 시스템 (라이트)'
    );
  });
});
