import {
  createSavedZone,
  deleteFavoritePlace,
  getFavoritePlaces,
} from '../engagement';

global.fetch = jest.fn();

describe('engagement API', () => {
  const token = 'access-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads favorites from the authenticated /api/me scope', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await getFavoritePlaces(token);

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8080/api/me/places/favorites',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
      })
    );
  });

  it('creates a saved zone without putting a user id in the request', async () => {
    const zone = {
      label: '집',
      latitude: 37.56,
      longitude: 126.97,
      radiusMeters: 1500,
    };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 1, ...zone, createdAt: '2026-07-25T00:00:00' }),
    });

    await createSavedZone(token, zone);

    const request = (fetch as jest.Mock).mock.calls[0][1];
    expect(JSON.parse(request.body)).toEqual(zone);
    expect(request.body).not.toContain('userId');
  });

  it('uses a scoped delete endpoint', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204 });

    await deleteFavoritePlace(token, 7);

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8080/api/me/places/favorites/7',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
