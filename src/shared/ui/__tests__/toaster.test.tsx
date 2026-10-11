import { act, render, screen } from '@testing-library/react';
import { AppToaster } from '../toaster';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { ThemeProvider } from '@/shared/lib/theme';
import { installMatchMedia } from '@/shared/lib/testing/match-media';
import { showSuccessToast } from '@/shared/lib/utils/toast';

describe('AppToaster', () => {
  beforeEach(() => {
    installMatchMedia(false);
  });

  it('hosts a Korean-labelled polite live region and shows dismissible toasts', async () => {
    render(
      <ThemeProvider>
        <I18nProvider>
          <AppToaster />
        </I18nProvider>
      </ThemeProvider>
    );
    const region = screen.getByLabelText(/^알림/);
    expect(region).toHaveAttribute('aria-live', 'polite');

    act(() => {
      showSuccessToast('저장했습니다');
    });

    expect(await screen.findByText('저장했습니다')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '알림 닫기' })).toBeInTheDocument();
  });
});
