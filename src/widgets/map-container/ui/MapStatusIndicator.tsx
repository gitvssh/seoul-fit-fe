// components/map/MapStatusIndicator.tsx
'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import type { CongestionData, WeatherData } from '@/lib/types';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface MapStatusIndicatorProps {
  showCongestion: boolean;
  congestionData?: CongestionData | null;
  showWeather: boolean;
  weatherData?: WeatherData | null;
  markersCount: number;
}

export const MapStatusIndicator: React.FC<MapStatusIndicatorProps> = ({
  showCongestion,
  congestionData,
  showWeather,
  weatherData,
  markersCount,
}) => {
  const { t } = useI18n();
  // 혼잡도 레벨에 따른 색상 클래스
  const getCongestionColorClass = (level?: string) => {
    if (!level) return 'bg-gray-500';
    switch (level) {
      case '여유':
        return 'bg-green-500';
      case '보통':
        return 'bg-yellow-500';
      case '약간 붐빔':
        return 'bg-orange-500';
      case '붐빔':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 날씨 상태에 따른 아이콘 선택
  const getWeatherIcon = () => {
    if (!weatherData) return null;

    const condition = weatherData.WEATHER_STTS;
    if (condition?.includes('비') || condition?.includes('rain')) {
      return '🌧️';
    } else if (condition?.includes('구름') || condition?.includes('cloud')) {
      return '☁️';
    } else {
      return '☀️';
    }
  };

  return (
    <>
      {/* 마커 수 표시 */}
      <div className='absolute bottom-4 right-4 z-30'>
        <div className='bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm text-xs text-gray-600 border border-white/20 flex items-center gap-2'>
          <MapPin className='h-3 w-3 text-blue-500' />
          <span className='font-medium'>{t('map.facilityCount', { count: markersCount })}</span>
        </div>
      </div>

      {/* 빠른 상태 표시 (하단 중앙) */}
      <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30'>
        <div className='flex items-center gap-2'>
          {/* 혼잡도 미니 상태 */}
          {showCongestion && congestionData && (
            <div className='bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm text-xs flex items-center gap-1 border border-white/20'>
              <div
                className={`h-2 w-2 rounded-full ${getCongestionColorClass(congestionData.AREA_CONGEST_LVL)}`}
              />
              <span className='text-gray-600'>{congestionData.AREA_CONGEST_LVL}</span>
            </div>
          )}

          {/* 날씨 미니 상태 */}
          {showWeather && weatherData && weatherData.TEMP && (
            <div className='bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm text-xs flex items-center gap-1 border border-white/20'>
              <span>{getWeatherIcon()}</span>
              <span className='text-gray-600'>{Math.round(Number(weatherData.TEMP))}°C</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
