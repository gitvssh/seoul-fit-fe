// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID = 'test-kakao-key'
process.env.NEXT_PUBLIC_BACKEND_URL = 'http://127.0.0.1:8080'

// Mock window.kakao object
global.kakao = {
  maps: {
    LatLng: jest.fn((lat, lng) => ({ lat, lng })),
    Map: jest.fn(),
    Marker: jest.fn(),
    CustomOverlay: jest.fn(),
    MarkerClusterer: jest.fn(),
    InfoWindow: jest.fn(),
    services: {
      Geocoder: jest.fn(),
      Places: jest.fn(),
    },
    event: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    load: jest.fn((callback) => callback()),
  },
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}
