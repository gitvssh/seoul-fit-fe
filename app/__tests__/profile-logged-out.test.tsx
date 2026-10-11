import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { ProfileScreen } from '../profile/_components/ProfileScreen';

const push = jest.fn();
const kakaoLogin = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/shared/api/login', () => ({
  kakaoLogin: () => kakaoLogin(),
  kakaoLogout: jest.fn(),
  consumeOAuthState: jest.fn(),
}));

describe('profile route when logged out', () => {
  it('shows a real screen with a Kakao CTA instead of redirecting', async () => {
    render(
      <I18nProvider>
        <ProfileScreen />
      </I18nProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        '로그인하면 관심사와 알림이 계정에 저장돼요'
      )
    );
    expect(screen.getByText('로그인 없이도 저장은 이 기기에 남아요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '로그인 없이 지도 보기' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '카카오로 로그인' }));
    expect(kakaoLogin).toHaveBeenCalledTimes(1);
  });
});
