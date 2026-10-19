import Link from 'next/link';
import type { FacilityCategory } from '@/lib/types';
import { Badge } from '@/shared/ui/badge';
import { getPublicPlacePath, type PublicPlaceSummary } from '@/shared/lib/seo/public-places';
import { CategoryGlyph } from './CategoryGlyph';
import { presentPlace, visibleTags } from './place-presentation';

export interface PlaceCardProps {
  place: PublicPlaceSummary;
  facilityCategory: FacilityCategory;
}

/** List card. The whole card is the link target; the title carries the accessible name. */
export function PlaceCard({ place, facilityCategory }: Readonly<PlaceCardProps>) {
  const { tags, text } = presentPlace(place.category, place.description);
  const { shown, hidden } = visibleTags(tags);

  return (
    <article className='relative flex gap-4 rounded-lg border border-border bg-card p-4 shadow-float-sm transition-[border-color,box-shadow] duration-fast ease-standard focus-within:ring-[3px] focus-within:ring-ring/50 hover:border-input/60 hover:shadow-float-md'>
      <CategoryGlyph category={facilityCategory} />
      <div className='min-w-0 flex-1'>
        <h2 className='text-section text-foreground'>
          <Link
            href={getPublicPlacePath(place.category, place.id)}
            className='outline-none after:absolute after:inset-0 after:rounded-lg after:content-[""]'
          >
            {place.name}
          </Link>
        </h2>
        {place.address && (
          <p className='mt-1 text-body-sm text-muted-foreground'>{place.address}</p>
        )}
        {shown.length > 0 && (
          <ul className='mt-2 flex flex-wrap gap-1' aria-label='구분'>
            {shown.map(tag => (
              <li key={tag}>
                <Badge variant='muted'>{tag}</Badge>
              </li>
            ))}
            {hidden > 0 && (
              <li>
                <Badge variant='muted' aria-label={`외 ${hidden}개`}>
                  +{hidden}
                </Badge>
              </li>
            )}
          </ul>
        )}
        {text && <p className='mt-2 line-clamp-2 text-body-sm text-muted-foreground'>{text}</p>}
      </div>
    </article>
  );
}
