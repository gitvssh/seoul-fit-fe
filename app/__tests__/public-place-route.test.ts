/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../api/public/places/[category]/[id]/route';
import { PublicPlaceUnavailableError, getPublicPlace } from '@/shared/lib/seo/public-places';

jest.mock('@/shared/lib/seo/public-places', () => {
  const actual = jest.requireActual('@/shared/lib/seo/public-places');
  return { ...actual, getPublicPlace: jest.fn() };
});

const mockedGetPublicPlace = getPublicPlace as jest.MockedFunction<typeof getPublicPlace>;

const call = (category: string, id: string) =>
  GET(new NextRequest('http://localhost/api/public/places/x/1'), {
    params: Promise.resolve({ category, id }),
  });

describe('GET /api/public/places/[category]/[id]', () => {
  beforeEach(() => mockedGetPublicPlace.mockReset());

  it('rejects unknown categories and non-positive ids without touching the backend', async () => {
    expect((await call('unknown', '1')).status).toBe(400);
    expect((await call('library', '0')).status).toBe(400);
    expect(mockedGetPublicPlace).not.toHaveBeenCalled();
  });

  it('returns the place from the internal backend', async () => {
    mockedGetPublicPlace.mockResolvedValue({ id: 17738, name: '강남구립못골도서관' } as never);
    const response = await call('library', '17738');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 17738 });
    expect(mockedGetPublicPlace).toHaveBeenCalledWith('library', 17738);
  });

  it('answers 404 for a missing place and 503 when the backend is unreachable', async () => {
    mockedGetPublicPlace.mockResolvedValue(null);
    expect((await call('library', '1')).status).toBe(404);
    mockedGetPublicPlace.mockRejectedValue(new PublicPlaceUnavailableError('backend unreachable'));
    expect((await call('library', '1')).status).toBe(503);
  });
});
