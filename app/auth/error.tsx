'use client';

import { RouteErrorState } from '../_components/RouteErrorState';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Segment error boundary for /auth/*: runtime failures of the callback screen itself. */
export default function AuthError(props: Readonly<AuthErrorProps>) {
  const { t } = useI18n();
  return (
    <RouteErrorState
      {...props}
      title={t('auth.boundaryTitle')}
      description={t('auth.boundaryDescription')}
    />
  );
}
