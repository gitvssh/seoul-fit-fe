import { act, renderHook, waitFor } from '@testing-library/react'
import { useGeolocation } from '../useGeolocation'

type SuccessCallback = (position: GeolocationPosition) => void
type ErrorCallback = (error: GeolocationPositionError) => void

function makePosition(lat: number, lng: number): GeolocationPosition {
  return { coords: { latitude: lat, longitude: lng, accuracy: 20 }, timestamp: Date.now() } as GeolocationPosition
}

function makeError(code: number): GeolocationPositionError {
  return { code, message: 'x', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError
}

describe('useGeolocation', () => {
  const originalGeolocation = navigator.geolocation
  const originalPermissions = (navigator as Navigator & { permissions?: unknown }).permissions

  afterEach(() => {
    Object.defineProperty(navigator, 'geolocation', { value: originalGeolocation, configurable: true })
    Object.defineProperty(navigator, 'permissions', { value: originalPermissions, configurable: true })
  })

  function installGeolocation(impl: { getCurrentPosition: jest.Mock; watchPosition?: jest.Mock; clearWatch?: jest.Mock }) {
    Object.defineProperty(navigator, 'geolocation', {
      value: { watchPosition: jest.fn(), clearWatch: jest.fn(), ...impl },
      configurable: true,
    })
  }

  it('does not request a position until asked, then resolves it', async () => {
    const getCurrentPosition = jest.fn(
      (success: SuccessCallback, _error?: ErrorCallback, _options?: PositionOptions) =>
        success(makePosition(37.55, 126.99))
    )
    installGeolocation({ getCurrentPosition })
    const { result } = renderHook(() => useGeolocation())

    expect(getCurrentPosition).not.toHaveBeenCalled()
    expect(result.current.status).toBe('idle')

    let resolved: unknown
    await act(async () => {
      resolved = await result.current.request()
    })
    expect(resolved).toEqual({ lat: 37.55, lng: 126.99 })
    expect(result.current.status).toBe('granted')
    expect(getCurrentPosition.mock.calls[0][2]).toMatchObject({ enableHighAccuracy: false })
  })

  it('maps permission denial and timeouts to statuses', async () => {
    const getCurrentPosition = jest
      .fn()
      .mockImplementationOnce((_s: SuccessCallback, error: ErrorCallback) => error(makeError(1)))
      .mockImplementationOnce((_s: SuccessCallback, error: ErrorCallback) => error(makeError(3)))
    installGeolocation({ getCurrentPosition })
    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      await result.current.request()
    })
    expect(result.current.status).toBe('denied')
    await act(async () => {
      await result.current.request()
    })
    expect(result.current.status).toBe('timeout')
  })

  it('reads an already-denied permission from the Permissions API', async () => {
    installGeolocation({ getCurrentPosition: jest.fn() })
    const permissionStatus = { state: 'denied', addEventListener: jest.fn(), removeEventListener: jest.fn() }
    Object.defineProperty(navigator, 'permissions', {
      value: { query: jest.fn().mockResolvedValue(permissionStatus) },
      configurable: true,
    })
    const { result } = renderHook(() => useGeolocation())
    await waitFor(() => expect(result.current.permission).toBe('denied'))
    expect(result.current.status).toBe('denied')
  })

  it('watches without moving anything and clears the watch on unmount', () => {
    const clearWatch = jest.fn()
    const watchPosition = jest.fn((success: SuccessCallback) => {
      success(makePosition(37.6, 127.0))
      return 42
    })
    installGeolocation({ getCurrentPosition: jest.fn(), watchPosition, clearWatch })
    const { result, unmount } = renderHook(() => useGeolocation())

    act(() => result.current.startWatch())
    expect(result.current.position).toEqual({ lat: 37.6, lng: 127.0 })
    unmount()
    expect(clearWatch).toHaveBeenCalledWith(42)
  })
})
