import { act, renderHook, waitFor } from '@testing-library/react';
import { useAuthStore } from '@/shared/model/authStore';
import { getUserInterests, updateUserInterests } from '@/shared/api/preference';
import {
  DEFAULT_ACTIVE_CATEGORIES,
  PREFERENCES_STORAGE_KEY,
  interestsToCategories,
  usePreferences,
  usePreferencesStore,
} from '../usePreferences';

jest.mock('@/shared/api/preference', () => ({
  getUserInterests: jest.fn(),
  updateUserInterests: jest.fn(),
}));

const mockedGetInterests = getUserInterests as jest.MockedFunction<typeof getUserInterests>;
const mockedUpdateInterests = updateUserInterests as jest.MockedFunction<
  typeof updateUserInterests
>;

const user = {
  id: 7,
  email: 'a@b.c',
  nickname: '시민',
  status: 'ACTIVE',
  oauthProvider: 'kakao',
  oauthUserId: '1',
  profileImageUrl: '',
  interests: [],
};

const interestsResponse = (categories: string[]) => ({
  userId: 7,
  interests: categories.map(category => ({
    category,
    displayName: category,
    description: '',
    emoji: '',
    isLocationBased: false,
    isRealtimeNotificationRequired: false,
  })),
  totalCount: categories.length,
  lastUpdated: '2026-07-25T00:00:00Z',
  isCompleted: true,
});

describe('preferences store', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: false, accessToken: null, user: null });
    usePreferencesStore.setState({
      activeCategories: [...DEFAULT_ACTIVE_CATEGORIES],
      showWarning: false,
      syncedUserId: null,
      isLoaded: true,
    });
  });

  it('starts with every category active and persists guest changes to localStorage', async () => {
    expect(usePreferencesStore.getState().activeCategories).toEqual(DEFAULT_ACTIVE_CATEGORIES);

    await act(async () => {
      expect(await usePreferencesStore.getState().togglePreference('library')).toBe(true);
    });

    expect(usePreferencesStore.getState().activeCategories).not.toContain('library');
    const persisted = JSON.parse(window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}');
    expect(persisted.state.activeCategories).not.toContain('library');
    expect(mockedUpdateInterests).not.toHaveBeenCalled();
  });

  it('keeps at least one category active and raises the warning instead', async () => {
    expect(usePreferencesStore.getState().setCategories(['park'])).toBe(true);

    await act(async () => {
      expect(await usePreferencesStore.getState().togglePreference('park')).toBe(false);
    });

    expect(usePreferencesStore.getState().activeCategories).toEqual(['park']);
    expect(usePreferencesStore.getState().showWarning).toBe(true);
    expect(usePreferencesStore.getState().setCategories([])).toBe(false);
    usePreferencesStore.getState().setShowWarning(false);
    expect(usePreferencesStore.getState().showWarning).toBe(false);
  });

  it('normalises order and ignores unknown values when setting categories', () => {
    usePreferencesStore.getState().setCategories(['subway', 'park', 'park']);
    expect(usePreferencesStore.getState().activeCategories).toEqual(['park', 'subway']);
    usePreferencesStore.getState().resetPreferences();
    expect(usePreferencesStore.getState().activeCategories).toEqual(DEFAULT_ACTIVE_CATEGORIES);
  });

  it('maps server interest codes and Korean display names back to categories', () => {
    expect(
      interestsToCategories([
        { category: 'PARK' },
        { category: '도서관' },
        { interestCategory: 'BIKE' },
        { category: 'UNKNOWN' },
      ])
    ).toEqual(['library', 'park', 'bike']);
  });

  it('syncs the logged-in user once and saves toggles to the server', async () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: 'token', user });
    mockedGetInterests.mockResolvedValue(interestsResponse(['PARK', 'LIBRARY']));
    mockedUpdateInterests.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePreferences());

    await waitFor(() => expect(result.current.activeCategories).toEqual(['library', 'park']));
    expect(mockedGetInterests).toHaveBeenCalledTimes(1);
    expect(result.current.preferences).toMatchObject({
      library: true,
      park: true,
      subway: false,
      preferredCategories: ['library', 'park'],
    });

    await act(async () => {
      await result.current.togglePreference('subway');
    });
    expect(mockedUpdateInterests).toHaveBeenCalledWith(['LIBRARY', 'PARK', 'SUBWAY']);
    expect(result.current.activeCategories).toEqual(['library', 'park', 'subway']);

    await act(async () => {
      await usePreferencesStore.getState().syncFromServer(7);
    });
    expect(mockedGetInterests).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refreshPreferences();
    });
    expect(mockedGetInterests).toHaveBeenCalledTimes(2);
  });

  it('reverts a toggle when the server rejects it and keeps local choices when the server is empty', async () => {
    useAuthStore.setState({ isAuthenticated: true, accessToken: 'token', user });
    mockedGetInterests.mockResolvedValue(interestsResponse([]));
    mockedUpdateInterests.mockRejectedValue(new Error('500'));
    usePreferencesStore.getState().setCategories(['park', 'library']);

    await act(async () => {
      await usePreferencesStore.getState().syncFromServer(7);
    });
    expect(usePreferencesStore.getState().activeCategories).toEqual(['library', 'park']);

    await act(async () => {
      expect(await usePreferencesStore.getState().togglePreference('library')).toBe(false);
    });
    expect(usePreferencesStore.getState().activeCategories).toEqual(['library', 'park']);
  });
});
