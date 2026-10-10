/**
 * @fileoverview Cooling Shelter Entity Public API
 * @description 무더위 쉼터 엔티티 공개 인터페이스
 */

// Types
export type {
  CoolingShelter,
  CoolingShelterSearchParams,
  CoolingShelterSearchResult,
} from './model/types';

// API Functions
export { fetchNearbyCoolingShelters, validateLocationParams } from './api';
