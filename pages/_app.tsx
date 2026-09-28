import type { AppProps } from 'next/app';
import { AuthProvider } from '@/shared/ui/auth/AuthProvider';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import '../app/globals.css';

export default function PagesApp({ Component, pageProps }: AppProps) {
  return (
    <I18nProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </I18nProvider>
  );
}
