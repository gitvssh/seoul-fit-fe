import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { LoadingStates } from '../LoadingStates';

describe('auth state screens', () => {
  it('announces the loading state', () => {
    render(
      <I18nProvider>
        <LoadingStates.Loading />
      </I18nProvider>
    );
    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent(
      '카카오 로그인을 확인하고 있어요'
    );
  });

  it('shows the failure as an alert with retry and home actions, without a timer', () => {
    const onRetry = jest.fn();
    render(
      <I18nProvider>
        <LoadingStates.Error message='인가 코드가 없습니다.' onRetry={onRetry} />
      </I18nProvider>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('인가 코드가 없습니다.');
    expect(screen.getByRole('link', { name: '로그인 없이 지도 보기' })).toHaveAttribute(
      'href',
      '/'
    );
    fireEvent.click(screen.getByRole('button', { name: '카카오로 다시 로그인' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
