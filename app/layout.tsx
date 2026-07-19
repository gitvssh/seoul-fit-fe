import type { Metadata } from 'next';
import { AuthProvider } from '@/shared/ui/auth/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Seoul Fit Map',
  description: 'AI 기반 공공시설 통합 네비게이터',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body className='antialiased'>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
