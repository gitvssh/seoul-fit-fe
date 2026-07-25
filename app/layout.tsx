import type { Metadata } from 'next';
import { AuthProvider } from '@/shared/ui/auth/AuthProvider';
import { AnalyticsProvider } from '@/shared/ui/analytics/AnalyticsProvider';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from '@/shared/lib/seo/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} | 서울 공공시설 지도`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 서울 공공시설 지도`,
    description: SITE_DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: `${SITE_NAME} | 서울 공공시설 지도`,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body className='antialiased'>
        <AnalyticsProvider>
          <I18nProvider>
            <AuthProvider>{children}</AuthProvider>
          </I18nProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
