'use client';

import Link from 'next/link';
import { ExternalLink, MapPin, Phone } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics/analytics';

interface PlaceActionLinksProps {
  category: string;
  mapHref: string;
  phone: string | null;
  reservable: boolean;
  website: string | null;
}

export function PlaceActionLinks({
  category,
  mapHref,
  phone,
  reservable,
  website,
}: PlaceActionLinksProps) {
  return (
    <div className='mt-10 flex flex-wrap gap-3'>
      <Link
        href={mapHref}
        onClick={() => trackEvent('facility_action_clicked', { action_type: 'map', category })}
        className='inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800'
      >
        <MapPin className='h-4 w-4' /> 지도에서 보기
      </Link>
      {phone && (
        <a
          href={`tel:${phone}`}
          onClick={() => trackEvent('facility_action_clicked', { action_type: 'phone', category })}
          className='inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50'
        >
          <Phone className='h-4 w-4' /> 전화하기
        </a>
      )}
      {website && (
        <a
          href={website}
          target='_blank'
          rel='noreferrer'
          onClick={() =>
            trackEvent('facility_action_clicked', { action_type: 'website', category })
          }
          className='inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50'
        >
          <ExternalLink className='h-4 w-4' /> {reservable ? '예약·공식 페이지' : '공식 페이지'}
        </a>
      )}
    </div>
  );
}
