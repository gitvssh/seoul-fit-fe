// components/map/MapControls.tsx
'use client';

import React from 'react';
import { Button } from '@/shared/ui/button';
import {
  RefreshCw,
  Users,
  Cloud,
  CloudRain,
  Sun,
  Navigation,
  Thermometer,
} from 'lucide-react';
import type { CongestionData, WeatherData } from '@/lib/types';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface MapControlsProps {
  // 혼잡도 관련
  showCongestion: boolean;
  congestionData?: CongestionData | null;
  congestionLoading: boolean;
  onToggleCongestion: () => void;

  // 날씨 관련
  showWeather: boolean;
  weatherData?: WeatherData | null;
  weatherLoading: boolean;
  onToggleWeather: () => void;

  // 내 위치
  onMoveToCurrentLocation: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  showCongestion,
  congestionData,
  congestionLoading,
  onToggleCongestion,
  showWeather,
  weatherData,
  weatherLoading,
  onToggleWeather,
  onMoveToCurrentLocation,
}) => {
  const { t } = useI18n();
  // 혼잡도 상태에 따른 아이콘 선택
  const getCongestionIcon = () => {
    if (congestionLoading) return <RefreshCw className='h-4 w-4 animate-spin' />;
    return <Users className='h-4 w-4' />;
  };

  // 혼잡도 레벨에 따른 버튼 색상 클래스
  const getCongestionButtonClass = (level?: string) => {
    if (!showCongestion) {
      return 'bg-white/90 hover:bg-white text-gray-700';
    }

    if (!level) {
      return 'bg-blue-500 hover:bg-blue-600 shadow-blue-200 text-white';
    }

    switch (level) {
      case '여유':
        return 'bg-green-500 hover:bg-green-600 shadow-green-200 text-white';
      case '보통':
        return 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200 text-white';
      case '약간 붐빔':
        return 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 text-white';
      case '붐빔':
        return 'bg-red-500 hover:bg-red-600 shadow-red-200 text-white';
      default:
        return 'bg-blue-500 hover:bg-blue-600 shadow-blue-200 text-white';
    }
  };

  // 혼잡도 레벨에 따른 배지 색상 클래스
  const getCongestionBadgeClass = (level?: string) => {
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
    if (weatherLoading) return <RefreshCw className='h-4 w-4 animate-spin' />;

    if (weatherData) {
      const condition = weatherData.WEATHER_STTS;
      if (condition?.includes('비') || condition?.includes('rain')) {
        return <CloudRain className='h-4 w-4' />;
      } else if (condition?.includes('구름') || condition?.includes('cloud')) {
        return <Cloud className='h-4 w-4' />;
      } else {
        return <Sun className='h-4 w-4' />;
      }
    }

    return <Thermometer className='h-4 w-4' />;
  };

  return (
    <>
      {/* 오른쪽 위 - 혼잡도 아이콘 */}
      <div className='absolute top-4 right-4 z-30'>
        <div className='relative'>
          <Button
            variant={showCongestion ? 'default' : 'secondary'}
            size='sm'
            onClick={onToggleCongestion}
            disabled={congestionLoading}
            className={`
              h-12 w-12 p-0 rounded-full shadow-lg border border-white/20 backdrop-blur-sm
              hover:scale-105 transition-all duration-200 relative group
              ${getCongestionButtonClass(congestionData?.AREA_CONGEST_LVL)}
            `}
            title={showCongestion ? t('map.hideCongestion') : t('map.showCongestion')}
            aria-label={showCongestion ? t('map.hideCongestion') : t('map.showCongestion')}
          >
            {getCongestionIcon()}
          </Button>

          {/* 혼잡도 레벨 표시 */}
          {congestionData?.AREA_CONGEST_LVL && (
            <div
              className={`absolute -top-1 -right-1 text-white text-xs px-1 rounded-full border border-white shadow-sm min-w-[20px] text-center ${getCongestionBadgeClass(
                congestionData.AREA_CONGEST_LVL
              )}`}
            >
              {congestionData.AREA_CONGEST_LVL.slice(0, 2)}
            </div>
          )}

          {/* 연결선 (패널이 활성화된 경우) */}
          {showCongestion && <div className='absolute top-1/2 -right-2 w-2 h-0.5 bg-blue-300' />}
        </div>
      </div>

      {/* 왼쪽 아래 - 날씨 아이콘 */}
      <div className='absolute bottom-24 md:bottom-20 left-4 z-30'>
        <div className='relative'>
          <Button
            variant={showWeather ? 'default' : 'secondary'}
            size='sm'
            onClick={onToggleWeather}
            disabled={weatherLoading}
            className={`
              h-12 w-12 p-0 rounded-full shadow-lg border border-white/20 backdrop-blur-sm
              hover:scale-105 transition-all duration-200 relative group
              ${
                showWeather
                  ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-200 text-white'
                  : 'bg-white/90 hover:bg-white text-gray-700'
              }
            `}
            title={showWeather ? t('map.hideWeather') : t('map.showWeather')}
            aria-label={showWeather ? t('map.hideWeather') : t('map.showWeather')}
          >
            {getWeatherIcon()}
          </Button>

          {/* 온도 표시 */}
          {weatherData && weatherData.TEMP && (
            <div className='absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 rounded-full border border-white shadow-sm min-w-[20px] text-center'>
              {Math.round(Number(weatherData.TEMP))}°
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽 아래 - 내 위치 버튼 */}
      <div className='absolute bottom-24 md:bottom-20 right-4 z-30'>
        <Button
          variant='secondary'
          size='sm'
          onClick={onMoveToCurrentLocation}
          className={`
            h-12 w-12 p-0 rounded-full shadow-lg border border-white/20 backdrop-blur-sm
            bg-white/90 hover:bg-white hover:scale-105 transition-all duration-200
            text-gray-700
          `}
          title={t('map.currentLocation')}
          aria-label={t('map.currentLocation')}
        >
          <Navigation className='h-4 w-4' />
        </Button>
      </div>
    </>
  );
};
