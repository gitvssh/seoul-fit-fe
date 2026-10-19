'use client';

import Link from 'next/link';
import { ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { trackEvent } from '@/shared/lib/analytics/analytics';

export interface PlaceActionsProps {
  category: string;
  /** In-app deep link that opens the same place on the map. */
  mapHref: string;
  /** Kakao Map directions URL, when coordinates exist. */
  directionsHref: string | null;
  phone: string | null;
  website: string | null;
  reservable: boolean;
}

export function PlaceActions({
  category,
  mapHref,
  directionsHref,
  phone,
  website,
  reservable,
}: Readonly<PlaceActionsProps>) {
  return (
    <div className='mt-8 flex flex-wrap gap-3'>
      <Button asChild size='lg'>
        <Link
          href={mapHref}
          onClick={() => trackEvent('facility_action_clicked', { action_type: 'map', category })}
        >
          <MapPin aria-hidden='true' />
          지도에서 보기
        </Link>
      </Button>
      {directionsHref && (
        <Button asChild variant='outline' size='lg'>
          <a
            href={directionsHref}
            target='_blank'
            rel='noreferrer'
            onClick={() =>
              trackEvent('facility_action_clicked', { action_type: 'navigation', category })
            }
          >
            <Navigation aria-hidden='true' />
            카카오맵 길찾기
          </a>
        </Button>
      )}
      {phone && (
        <Button asChild variant='outline' size='lg'>
          <a
            href={`tel:${phone}`}
            onClick={() =>
              trackEvent('facility_action_clicked', { action_type: 'phone', category })
            }
          >
            <Phone aria-hidden='true' />
            전화하기
          </a>
        </Button>
      )}
      {website && (
        <Button asChild variant='outline' size='lg'>
          <a
            href={website}
            target='_blank'
            rel='noreferrer'
            onClick={() =>
              trackEvent('facility_action_clicked', {
                action_type: reservable ? 'reservation' : 'website',
                category,
              })
            }
          >
            <ExternalLink aria-hidden='true' />
            {reservable ? '예약·공식 페이지' : '공식 페이지'}
          </a>
        </Button>
      )}
    </div>
  );
}
