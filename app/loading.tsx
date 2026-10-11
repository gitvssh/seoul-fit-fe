import { AppShellSkeleton } from '@/shared/ui/app-shell-skeleton';

/** Route-level loading state shaped like the app shell so navigation does not flash a blank page. */
export default function Loading() {
  return <AppShellSkeleton label='화면을 준비하고 있어요' />;
}
