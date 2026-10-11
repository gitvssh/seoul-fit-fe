import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { RouteErrorState } from '../_components/RouteErrorState';

describe('RouteErrorState', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('offers retry and a way home, and shows the digest for support', () => {
    const reset = jest.fn();
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });

    render(
      <I18nProvider>
        <RouteErrorState error={error} reset={reset} />
      </I18nProvider>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '문제가 생겨 화면을 표시하지 못했어요'
    );
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '지도로 가기' })).toHaveAttribute('href', '/');

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
