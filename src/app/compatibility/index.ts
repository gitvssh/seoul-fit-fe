/**
 * @fileoverview FSD 호환성 레이어
 * @description 기존 코드와 FSD 구조 간의 브릿지 역할
 */

// Re-export from FSD structure with original paths
// 이렇게 하면 기존 import 경로를 유지하면서 점진적으로 마이그레이션 가능

export { MapContainer } from '@/widgets/map-container';
export { Header } from '@/widgets/header';
export { SideBar } from '@/widgets/sidebar';

// Features re-exports
export { useMapMarkers } from '@/features/map-markers';

// Shared UI re-exports
export * from '@/shared/ui';
