import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { KakaoLoginButton } from '../kakao-login-button';

describe('KakaoLoginButton', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uses the official container colour, a 44px target and the default label', () => {
    const onClick = jest.fn();
    render(
      <I18nProvider>
        <KakaoLoginButton onClick={onClick} />
      </I18nProvider>
    );

    const button = screen.getByRole('button', { name: '카카오 로그인' });
    expect(button).toHaveStyle({ backgroundColor: '#FEE500', color: '#191919' });
    expect(button.className).toContain('h-11');
    expect(button.className).toContain('rounded-lg');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('accepts a custom label, the large size and disabled state', () => {
    render(
      <I18nProvider>
        <KakaoLoginButton onClick={() => undefined} label='카카오로 계속하기' size='lg' disabled />
      </I18nProvider>
    );

    const button = screen.getByRole('button', { name: '카카오로 계속하기' });
    expect(button).toBeDisabled();
    expect(button.className).toContain('h-12');
  });
});
