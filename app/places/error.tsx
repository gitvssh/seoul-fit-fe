'use client';

import { RouteErrorState } from '../_components/RouteErrorState';

interface PlacesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Backend failures while loading public place data land here (a 404 from the
 * backend still renders not-found). Retry re-requests the segment.
 */
export default function PlacesError(props: PlacesErrorProps) {
  return (
    <RouteErrorState
      {...props}
      title='장소 정보를 불러오지 못했어요'
      description='데이터 서버가 잠시 응답하지 않아요. 다시 시도하거나 지도에서 찾아보세요.'
    />
  );
}
