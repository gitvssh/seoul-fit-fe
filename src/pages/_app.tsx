import type { AppProps } from 'next/app';
import { AnalyticsProvider } from '@/shared/ui/analytics/AnalyticsProvider';
import { AuthProvider } from '@/shared/ui/auth/AuthProvider';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import '../../app/globals.css';

export default function PagesApp({ Component, pageProps }: AppProps) {
  return (
    <AnalyticsProvider>
      <I18nProvider>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </I18nProvider>
    </AnalyticsProvider>
  );
}
