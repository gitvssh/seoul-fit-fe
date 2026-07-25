import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '카카오 로그인',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
