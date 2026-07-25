import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import { PlaceActionLinks } from '@/features/analytics/ui/PlaceActionLinks';
import {
  externalUrl,
  getPublicPlace,
  getPublicPlaceCategory,
  getPublicPlacePath,
  isPublicPlaceCategory,
} from '@/shared/lib/seo/public-places';

export const dynamic = 'force-dynamic';

interface PlaceDetailPageProps {
  params: Promise<{ category: string; id: string }>;
}

function serializeJsonLd(value: object): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function toId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PlaceDetailPageProps): Promise<Metadata> {
  const { category, id: idParam } = await params;
  const id = toId(idParam);
  if (!id || !isPublicPlaceCategory(category)) return {};
  const place = await getPublicPlace(category, id);
  if (!place) return {};
  const categoryInfo = getPublicPlaceCategory(category);
  const image = externalUrl(place.imageUrl);

  const description =
    place.description || place.address || `서울 ${place.categoryLabel} ${place.name} 정보`;
  return {
    title: place.name,
    description,
    alternates: { canonical: getPublicPlacePath(category, id) },
    robots: {
      index: categoryInfo?.indexable ?? false,
      follow: true,
    },
    openGraph: {
      title: place.name,
      description,
      type: place.category === 'cultural-event' ? 'article' : 'website',
      images: image ? [{ url: image, alt: place.name }] : undefined,
    },
  };
}

export default async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { category, id: idParam } = await params;
  const id = toId(idParam);
  if (!id || !isPublicPlaceCategory(category)) notFound();

  const place = await getPublicPlace(category, id);
  const categoryInfo = getPublicPlaceCategory(category);
  if (!place || !categoryInfo) notFound();

  const website = externalUrl(place.website);
  const image = externalUrl(place.imageUrl);
  const mapHref =
    place.latitude !== null && place.longitude !== null
      ? `/?lat=${place.latitude}&lng=${place.longitude}&place=${place.category}:${place.id}`
      : '/';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':
      place.category === 'restaurant'
        ? 'Restaurant'
        : place.category === 'cultural-event'
          ? 'Event'
          : 'Place',
    name: place.name,
    description: place.description || undefined,
    address: place.address || undefined,
    telephone: place.phone || undefined,
    url: website || undefined,
    image: image || undefined,
    geo:
      place.latitude !== null && place.longitude !== null
        ? { '@type': 'GeoCoordinates', latitude: place.latitude, longitude: place.longitude }
        : undefined,
    startDate: place.eventStart || undefined,
    endDate: place.eventEnd || undefined,
    eventAttendanceMode:
      place.category === 'cultural-event'
        ? 'https://schema.org/OfflineEventAttendanceMode'
        : undefined,
    eventStatus:
      place.category === 'cultural-event' ? 'https://schema.org/EventScheduled' : undefined,
    location:
      place.category === 'cultural-event' && place.address
        ? { '@type': 'Place', name: place.name, address: place.address }
        : undefined,
  };

  return (
    <main className='min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <article className='mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10'>
        <nav className='text-sm font-medium text-blue-700' aria-label='경로'>
          <Link href='/places'>장소 둘러보기</Link> <span className='text-slate-400'>/</span>{' '}
          <Link href={`/places/${category}`}>{categoryInfo.label}</Link>
        </nav>
        <p className='mt-6 text-sm font-semibold text-blue-700'>{place.categoryLabel}</p>
        <h1 className='mt-1 text-3xl font-bold tracking-tight sm:text-4xl'>{place.name}</h1>

        {image && (
          // Provider image URLs are dynamic; an img avoids rejecting valid public source hosts at build time.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=''
            className='mt-8 max-h-96 w-full rounded-xl object-cover'
          />
        )}

        <dl className='mt-8 space-y-4 text-sm'>
          {place.address && (
            <InfoRow icon={<MapPin className='h-4 w-4' />} label='주소' value={place.address} />
          )}
          {place.openingHours && (
            <InfoRow
              icon={<Clock3 className='h-4 w-4' />}
              label='운영 정보'
              value={place.openingHours}
            />
          )}
          {(place.eventStart || place.eventEnd) && (
            <InfoRow
              icon={<CalendarDays className='h-4 w-4' />}
              label='일정'
              value={[place.eventStart, place.eventEnd].filter(Boolean).join(' ~ ')}
            />
          )}
          {place.district && <InfoRow label='지역' value={place.district} />}
        </dl>

        {place.description && (
          <p className='mt-8 whitespace-pre-line leading-7 text-slate-700'>{place.description}</p>
        )}

        <PlaceActionLinks
          category={place.category}
          mapHref={mapHref}
          phone={place.phone}
          reservable={Boolean(place.reservable)}
          website={website}
        />
      </article>
    </main>
  );
}

function InfoRow({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className='flex gap-3'>
      <dt className='flex w-24 shrink-0 items-center gap-1 font-medium text-slate-500'>
        {icon}
        {label}
      </dt>
      <dd className='leading-6 text-slate-800'>{value}</dd>
    </div>
  );
}
