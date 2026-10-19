import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { CalendarDays, Clock3, MapPin, Map as MapIcon } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { SiteFooter } from '@/shared/ui/layout/SiteFooter';
import { SiteBreadcrumb, SiteHeader } from '@/shared/ui/layout/SiteHeader';
import {
  externalUrl,
  getPublicPlace,
  getPublicPlaceCategory,
  getPublicPlaceMapHref,
  getPublicPlacePath,
  isPublicPlaceCategory,
  parseClosedPlaceName,
  type PublicPlace,
} from '@/shared/lib/seo/public-places';
import { serializeJsonLd } from '@/shared/lib/seo/structured-data';
import { CategoryGlyph } from '../../_components/CategoryGlyph';
import { PlaceActions } from '../../_components/PlaceActions';
import { formatSourceDate, presentPlace } from '../../_components/place-presentation';

export const dynamic = 'force-dynamic';

interface PlaceDetailPageProps {
  params: Promise<{ category: string; id: string }>;
}

function toId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function hasCoordinates(
  place: PublicPlace
): place is PublicPlace & { latitude: number; longitude: number } {
  return place.latitude !== null && place.longitude !== null;
}

function directionsHref(place: PublicPlace, name: string): string | null {
  if (!hasCoordinates(place)) return null;
  const destination = `${name},${place.latitude},${place.longitude}`;
  return `https://map.kakao.com/link/to/${encodeURIComponent(destination)}`;
}

function schemaType(place: PublicPlace): string {
  if (place.category === 'restaurant') return 'Restaurant';
  if (place.category === 'cultural-event') return 'Event';
  return 'Place';
}

function buildJsonLd(
  place: PublicPlace,
  name: string,
  website: string | null,
  image: string | null
) {
  const isEvent = place.category === 'cultural-event';
  return {
    '@context': 'https://schema.org',
    '@type': schemaType(place),
    name,
    description: place.description || undefined,
    address: place.address || undefined,
    telephone: place.phone || undefined,
    url: website || undefined,
    image: image || undefined,
    geo: hasCoordinates(place)
      ? { '@type': 'GeoCoordinates', latitude: place.latitude, longitude: place.longitude }
      : undefined,
    startDate: place.eventStart || undefined,
    endDate: place.eventEnd || undefined,
    eventAttendanceMode: isEvent ? 'https://schema.org/OfflineEventAttendanceMode' : undefined,
    eventStatus: isEvent ? 'https://schema.org/EventScheduled' : undefined,
    location:
      isEvent && place.address ? { '@type': 'Place', name, address: place.address } : undefined,
  };
}

export async function generateMetadata({ params }: PlaceDetailPageProps): Promise<Metadata> {
  const { category, id: idParam } = await params;
  const id = toId(idParam);
  if (!id || !isPublicPlaceCategory(category)) return {};
  const place = await getPublicPlace(category, id);
  if (!place) return {};
  const categoryInfo = getPublicPlaceCategory(category);
  const image = externalUrl(place.imageUrl);
  const { status, name } = parseClosedPlaceName(place.name);

  const description =
    place.description || place.address || `서울 ${place.categoryLabel} ${name} 정보`;
  return {
    title: name,
    description,
    alternates: { canonical: getPublicPlacePath(category, id) },
    robots: {
      index: (categoryInfo?.indexable ?? false) && status === null,
      follow: true,
    },
    openGraph: {
      title: name,
      description,
      type: place.category === 'cultural-event' ? 'article' : 'website',
      images: image ? [{ url: image, alt: name }] : undefined,
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

  const { status: closedStatus, name } = parseClosedPlaceName(place.name);
  const website = externalUrl(place.website);
  const image = externalUrl(place.imageUrl);
  const { tags, text, rows } = presentPlace(place.category, place.description);
  const schedule = [place.eventStart, place.eventEnd].filter(Boolean).join(' ~ ');
  const sourceDate = formatSourceDate(place.lastModified);

  return (
    <div className='flex min-h-screen flex-col bg-background'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildJsonLd(place, name, website, image)),
        }}
      />
      <SiteHeader />
      <main className='mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10'>
        <SiteBreadcrumb
          items={[
            { label: '장소 둘러보기', href: '/places' },
            { label: categoryInfo.label, href: `/places/${category}` },
            { label: name },
          ]}
        />
        <article className='mt-4 rounded-xl border border-border bg-card p-6 shadow-float-sm sm:p-8'>
          <div className='flex items-center gap-2 text-label text-muted-foreground'>
            <CategoryGlyph category={categoryInfo.facilityCategory} size='sm' />
            <span>{place.categoryLabel}</span>
            {closedStatus && <Badge variant='muted'>{closedStatus}</Badge>}
          </div>
          <h1 className='mt-3 text-display text-foreground'>{name}</h1>
          {tags.length > 0 && (
            <ul className='mt-3 flex flex-wrap gap-1' aria-label='구분'>
              {tags.map(tag => (
                <li key={tag}>
                  <Badge variant='muted'>{tag}</Badge>
                </li>
              ))}
            </ul>
          )}
          {closedStatus && (
            <p className='mt-4 rounded-md bg-muted px-4 py-3 text-body-sm text-muted-foreground'>
              원천 데이터에 {closedStatus} 상태로 등록된 장소예요. 방문 전에 공식 안내를 확인하세요.
            </p>
          )}

          {image && (
            // Provider image hosts change; a plain img avoids rejecting valid public sources at build time.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=''
              className='mt-6 max-h-96 w-full rounded-lg bg-muted object-cover'
              loading='lazy'
            />
          )}

          <dl className='mt-6 space-y-3 text-body-sm'>
            {place.address && (
              <InfoRow
                icon={<MapPin className='size-4' aria-hidden='true' />}
                label='주소'
                value={place.address}
              />
            )}
            {place.openingHours && (
              <InfoRow
                icon={<Clock3 className='size-4' aria-hidden='true' />}
                label='운영 정보'
                value={place.openingHours}
              />
            )}
            {rows.map(row => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
            {schedule && (
              <InfoRow
                icon={<CalendarDays className='size-4' aria-hidden='true' />}
                label='일정'
                value={schedule}
              />
            )}
            {place.district && (
              <InfoRow
                icon={<MapIcon className='size-4' aria-hidden='true' />}
                label='지역'
                value={place.district}
              />
            )}
          </dl>

          {text && (
            <p className='mt-6 whitespace-pre-line text-body leading-relaxed text-foreground'>
              {text}
            </p>
          )}

          <PlaceActions
            category={place.category}
            mapHref={getPublicPlaceMapHref(place)}
            directionsHref={directionsHref(place, name)}
            phone={place.phone}
            website={website}
            reservable={Boolean(place.reservable)}
          />

          <p className='mt-8 border-t border-border pt-4 text-caption text-muted-foreground'>
            출처: 서울 열린데이터광장{sourceDate ? ` · 원천 갱신 ${sourceDate}` : ''}. 운영 여부와
            시간은 실제와 다를 수 있어요.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className='flex gap-3'>
      <dt className='flex w-24 shrink-0 items-center gap-1.5 text-muted-foreground'>
        {icon}
        {label}
      </dt>
      <dd className='min-w-0 text-foreground'>{value}</dd>
    </div>
  );
}
