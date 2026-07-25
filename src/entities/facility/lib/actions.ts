import type { Facility } from '@/lib/types';

export function getSafeExternalUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function getFacilityReservationUrl(facility: Facility): string | undefined {
  return getSafeExternalUrl(
    facility.reservationUrl ||
      facility.sportsFacility?.reservationUrl ||
      facility.culturalEvent?.reservationUrl
  );
}

export function getKakaoDirectionsUrl(facility: Facility): string {
  const destination = encodeURIComponent(
    `${facility.name},${facility.position.lat},${facility.position.lng}`
  );
  return `https://map.kakao.com/link/to/${destination}`;
}

export function getFacilityShareUrl(facility: Facility): string {
  const params = new URLSearchParams({
    lat: String(facility.position.lat),
    lng: String(facility.position.lng),
  });
  const publicId = String(facility.id).match(/^public:([a-z-]+):(\d+)$/);
  if (publicId) params.set('place', `${publicId[1]}:${publicId[2]}`);
  const path = `/?${params.toString()}`;
  return typeof window === 'undefined' ? path : new URL(path, window.location.origin).toString();
}
