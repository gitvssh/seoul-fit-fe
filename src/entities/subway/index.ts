/**
 * @fileoverview Subway Entity Public API
 * @description 지하철 엔티티 공개 인터페이스
 */

// API exports
export {
  fetchSubwayArrivalData,
  formatArrivalData,
  validateApiResponse,
  getUpstreamErrorCode,
  ensureSubwayStationCache,
  transformSubwayStation,
  fetchAllSubwayStations,
} from './api';

// Utility exports
export { formatArrivalMessage, formatTime, cleanStationName } from './lib/formatter';

// Type exports
export type {
  SubwayArrivalRow,
  SubwayArrivalApiResponse,
  FormattedSubwayArrival,
  SubwayStation,
  SubwayStationListResult,
} from './model/types';
