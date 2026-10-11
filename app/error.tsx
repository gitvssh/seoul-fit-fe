'use client';

import { RouteErrorState } from './_components/RouteErrorState';

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Root route error boundary. */
export default function RouteError(props: RouteErrorProps) {
  return <RouteErrorState {...props} />;
}
