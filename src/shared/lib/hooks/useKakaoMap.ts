// hooks/useKakaoMap.ts
import { useState, useEffect, useCallback } from 'react';
import type { KakaoMap, WindowWithKakao } from '@/shared/lib/kakao';
import { KAKAO_MAP_API_KEY } from '@/config/kakao';

interface MapPosition {
  lat: number;
  lng: number;
}

interface UseKakaoMapOptions {
  containerId: string;
  center: MapPosition;
  level?: number;
}

export const useKakaoMap = ({ containerId, center, level = 3 }: UseKakaoMapOptions) => {
  const [mapInstance, setMapInstance] = useState<KakaoMap | null>(null);
  const [mapStatus, setMapStatus] = useState({
    loading: true,
    success: false,
    error: null as string | null,
  });

  const createMap = useCallback(() => {
    console.log('[useKakaoMap] createMap 호출됨', { containerId });
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('[useKakaoMap] 컨테이너를 찾을 수 없음:', containerId);
        setMapStatus({ loading: false, success: false, error: '지도 컨테이너를 찾을 수 없습니다' });
        return;
      }
      console.log('[useKakaoMap] 컨테이너 찾음:', container)

      const windowWithKakao = window as WindowWithKakao;
      if (!windowWithKakao.kakao?.maps) {
        console.error('[useKakaoMap] kakao.maps 없음');
        setMapStatus({ loading: false, success: false, error: '카카오맵 API를 찾을 수 없습니다' });
        return;
      }
      console.log('[useKakaoMap] kakao.maps 확인됨')

      const kakaoMaps = windowWithKakao.kakao.maps;
      const map = new kakaoMaps.Map(container, {
        center: new kakaoMaps.LatLng(center.lat, center.lng),
        level: level,
        scrollwheel: true,
        disableDoubleClick: false,
        disableDoubleClickZoom: false,
      });

      // 부드러운 줌 애니메이션 설정
      map.setZoomable(true);

      console.log('[useKakaoMap] 지도 생성 성공:', map);
      setMapInstance(map);
      setMapStatus({ loading: false, success: true, error: null });
    } catch (error) {
      console.error('[useKakaoMap] 지도 생성 오류:', error);
      setMapStatus({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : '지도 생성 실패',
      });
    }
  }, [containerId, center.lat, center.lng, level]);

  const initializeMap = useCallback(async () => {
    console.log('[useKakaoMap] initializeMap 호출됨');
    if (typeof window === 'undefined') {
      console.log('[useKakaoMap] window 객체 없음, SSR 환경');
      return;
    }

    // DOM이 렌더링될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      setMapStatus({ loading: true, success: false, error: null });

      // 이미 로드되어 있으면 바로 지도 생성
      const windowWithKakao = window as WindowWithKakao;
      if (windowWithKakao.kakao?.maps) {
        console.log('[useKakaoMap] 카카오맵 이미 로드됨, 바로 지도 생성');
        createMap();
        return;
      }

      // 기존 스크립트 태그 확인
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        console.log('[useKakaoMap] 기존 스크립트 태그 발견, 로드 대기');
        // 이미 스크립트가 있으면 로드 대기
        let checkCount = 0;
        const checkKakaoMaps = setInterval(() => {
          checkCount++;
          const windowWithKakao = window as WindowWithKakao;
          if (windowWithKakao.kakao?.maps) {
            console.log('[useKakaoMap] 카카오맵 로드 확인 (시도:', checkCount, ')');
            clearInterval(checkKakaoMaps);
            windowWithKakao.kakao.maps.load(() => {
              createMap();
            });
          } else if (checkCount > 50) {
            console.error('[useKakaoMap] 카카오맵 로드 타임아웃');
            clearInterval(checkKakaoMaps);
            setMapStatus({ loading: false, success: false, error: '카카오맵 로드 타임아웃' });
          }
        }, 100);
        return;
      }

      // 스크립트 로드
      console.log('[useKakaoMap] 카카오맵 스크립트 로드 시작');
      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&autoload=false`;
      script.async = true;

      script.onload = () => {
        console.log('[useKakaoMap] 스크립트 로드 성공');
        const windowWithKakao = window as WindowWithKakao;
        if (windowWithKakao.kakao?.maps) {
          console.log('[useKakaoMap] kakao.maps.load 호출');
          windowWithKakao.kakao.maps.load(() => {
            console.log('[useKakaoMap] kakao.maps.load 콜백 실행');
            createMap();
          });
        } else {
          console.error('[useKakaoMap] 스크립트 로드 후 kakao.maps 없음');
        }
      };

      script.onerror = (error) => {
        console.error('[useKakaoMap] 스크립트 로드 실패:', error);
        setMapStatus({ loading: false, success: false, error: '카카오맵 로드 실패' });
      };

      document.head.appendChild(script);
    } catch (error) {
      setMapStatus({
        loading: false,
        success: false,
        error: error instanceof Error ? error.message : '지도 초기화 실패',
      });
    }
  }, [createMap]);

  useEffect(() => {
    initializeMap();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      setMapInstance(null);
      setMapStatus({ loading: false, success: false, error: null });
    };
  }, [initializeMap]);

  const setCenter = useCallback(
    (position: MapPosition) => {
      if (mapInstance && typeof window !== 'undefined') {
        const windowWithKakao = window as WindowWithKakao;
        if (windowWithKakao.kakao?.maps) {
          const newCenter = new windowWithKakao.kakao.maps.LatLng(position.lat, position.lng);
          mapInstance.setCenter(newCenter);
        }
      }
    },
    [mapInstance]
  );

  const setLevel = useCallback(
    (newLevel: number) => {
      if (mapInstance) {
        mapInstance.setLevel(newLevel);
      }
    },
    [mapInstance]
  );

  return {
    mapInstance,
    mapStatus,
    setCenter,
    setLevel,
  };
};
