import { renderHook, act } from '@testing-library/react';
import { useLocation } from '../useLocation';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
});

describe('useLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useLocation());

    expect(result.current.location).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.accuracy).toBeNull();
  });

  it('gets current location successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 37.5665,
        longitude: 126.978,
        accuracy: 10,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementation(success => {
      setTimeout(() => success(mockPosition), 100);
    });

    const { result } = renderHook(() => useLocation());

    act(() => {
      result.current.getCurrentLocation();
    });

    expect(result.current.loading).toBe(true);

    // Wait for async operation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.location).toEqual({
      lat: 37.5665,
      lng: 126.978,
    });
    expect(result.current.accuracy).toBe(10);
    expect(result.current.error).toBeNull();
  });

  it('handles geolocation errors', async () => {
    const mockError = {
      code: 1,
      message: 'User denied geolocation',
    };

    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      setTimeout(() => error(mockError), 100);
    });

    const { result } = renderHook(() => useLocation());

    act(() => {
      result.current.getCurrentLocation();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.location).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('starts watching position', () => {
    const watchId = 123;
    mockGeolocation.watchPosition.mockReturnValue(watchId);

    const { result } = renderHook(() => useLocation());

    act(() => {
      result.current.watchPosition();
    });

    expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 300000,
      })
    );
    expect(result.current.watchId).toBe(watchId);
  });

  it('stops watching position', () => {
    const watchId = 123;
    mockGeolocation.watchPosition.mockReturnValue(watchId);

    const { result } = renderHook(() => useLocation());

    act(() => {
      result.current.watchPosition();
    });

    act(() => {
      result.current.stopWatching();
    });

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
    expect(result.current.watchId).toBeNull();
  });

  it('updates location when watching', async () => {
    let watchSuccess: ((position: any) => void) | null = null;

    mockGeolocation.watchPosition.mockImplementation(success => {
      watchSuccess = success;
      return 123;
    });

    const { result } = renderHook(() => useLocation());

    act(() => {
      result.current.watchPosition();
    });

    const newPosition = {
      coords: {
        latitude: 37.57,
        longitude: 126.985,
        accuracy: 15,
      },
    };

    act(() => {
      if (watchSuccess) {
        watchSuccess(newPosition);
      }
    });

    expect(result.current.location).toEqual({
      lat: 37.57,
      lng: 126.985,
    });
    expect(result.current.accuracy).toBe(15);
  });

  it('clears watch on unmount', () => {
    const watchId = 123;
    mockGeolocation.watchPosition.mockReturnValue(watchId);

    const { result, unmount } = renderHook(() => useLocation());

    act(() => {
      result.current.watchPosition();
    });

    unmount();

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
  });

  it('handles geolocation not supported', async () => {
    // Temporarily remove geolocation
    const originalGeolocation = navigator.geolocation;
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() => useLocation());

    act(() => {
      result.current.getCurrentLocation();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(result.current.error).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('not supported'),
      })
    );

    // Restore geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeolocation,
      configurable: true,
    });
  });

  it('accepts custom options', async () => {
    const mockPosition = {
      coords: {
        latitude: 37.5665,
        longitude: 126.978,
        accuracy: 5,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementation(success => {
      success(mockPosition);
    });

    const customOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 600000,
    };

    const { result } = renderHook(() => useLocation(customOptions));

    act(() => {
      result.current.getCurrentLocation();
    });

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      customOptions
    );
  });
});
