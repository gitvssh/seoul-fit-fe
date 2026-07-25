// components/map/WeatherPanel.tsx
import React from 'react';
import { Button } from '@/shared/ui/button';
import { RefreshCw, CloudRain, Sun, Cloud, Thermometer, Wind, Droplets } from 'lucide-react';
import { WeatherData } from '@/lib/types';
import { getLiveDataStatus } from '@/features/recommendation/lib/live-data';

interface WeatherPanelProps {
  showWeather: boolean;
  weatherData: WeatherData | null;
  weatherLoading: boolean;
  weatherError: string | null;
  onRefresh: () => void;
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({
  showWeather,
  weatherData,
  weatherLoading,
  weatherError,
  onRefresh,
}) => {
  if (!showWeather) return null;

  return (
    <div className='bg-white rounded-lg shadow-xl border border-gray-200 w-80 animate-in slide-in-from-left-5 duration-300'>
      {/* 헤더 */}
      <div className='flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white rounded-t-lg'>
        <div className='flex items-center gap-2'>
          <div className='h-2 w-2 bg-orange-500 rounded-full' />
          <h4 className='text-sm font-semibold text-gray-800'>날씨 정보</h4>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={onRefresh}
          disabled={weatherLoading}
          className='h-6 w-6 p-0 hover:bg-orange-100'
        >
          <RefreshCw
            className={`h-3 w-3 ${weatherLoading ? 'animate-spin text-orange-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>

      {/* 컨텐츠 */}
      <div className='p-3'>
        {weatherLoading ? (
          <WeatherLoadingState />
        ) : weatherData ? (
          <WeatherContent data={weatherData} />
        ) : weatherError ? (
          <WeatherErrorState />
        ) : (
          <WeatherEmptyState />
        )}
      </div>
    </div>
  );
};

const WeatherLoadingState: React.FC = () => (
  <div className='flex items-center justify-center py-6'>
    <div className='flex items-center gap-2 text-sm text-gray-500'>
      <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500' />
      <span>날씨 정보 조회중...</span>
    </div>
  </div>
);

const getWeatherIcon = (data: WeatherData) => {
  const condition = data.WEATHER_STTS || '';
  if (condition.includes('비') || condition.includes('rain')) {
    return <CloudRain className='h-6 w-6 text-blue-500' />;
  } else if (condition.includes('구름') || condition.includes('cloud')) {
    return <Cloud className='h-6 w-6 text-gray-500' />;
  } else {
    return <Sun className='h-6 w-6 text-yellow-500' />;
  }
};

const WeatherContent: React.FC<{ data: WeatherData }> = ({ data }) => {
  const status = getLiveDataStatus(data.timestamp);
  return (
  <div className='space-y-3'>
    {/* 장소 정보 */}
    <div className='flex items-center gap-2 p-2 bg-gray-50 rounded-lg'>
      <div className='flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
        {getWeatherIcon(data)}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='text-sm font-medium text-gray-900 truncate'>{data.AREA_NM}</div>
        <div className='text-xs text-gray-500'>
          서울시 도시데이터 · {status.label} {status.referenceTimeLabel}
        </div>
      </div>
    </div>

    {/* 현재 기온 */}
    {data.TEMP && (
      <div className='grid grid-cols-2 gap-2'>
        <div className='p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-center'>
          <div className='flex items-center justify-center mb-1'>
            <Thermometer className='h-4 w-4 text-blue-600' />
          </div>
          <div className='text-lg font-bold text-blue-800'>{data.TEMP}°</div>
          <div className='text-xs text-blue-600'>현재 기온</div>
        </div>
        <div className='p-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg text-center'>
          <div className='flex items-center justify-center mb-1'>
            <Thermometer className='h-4 w-4 text-orange-600' />
          </div>
          <div className='text-lg font-bold text-orange-800'>{data.SENSIBLE_TEMP}°</div>
          <div className='text-xs text-orange-600'>체감 기온</div>
        </div>
      </div>
    )}

    {/* 최고/최저 기온 */}
    {(data.MAX_TEMP || data.MIN_TEMP) && (
      <div className='flex justify-between p-2 bg-gray-50 rounded-lg'>
        {data.MAX_TEMP && (
          <div className='text-center flex-1'>
            <div className='text-xs text-gray-500 mb-1'>최고</div>
            <div className='text-sm font-semibold text-red-600'>{data.MAX_TEMP}°</div>
          </div>
        )}
        {data.MIN_TEMP && (
          <div className='text-center flex-1'>
            <div className='text-xs text-gray-500 mb-1'>최저</div>
            <div className='text-sm font-semibold text-blue-600'>{data.MIN_TEMP}°</div>
          </div>
        )}
      </div>
    )}

    {/* 날씨 메시지 */}
    {data.PCP_MSG && (
      <div className='p-2 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg'>
        <div className='text-xs text-blue-800 leading-relaxed'>
          <Droplets className='h-3 w-3 inline mr-1' />
          {data.PCP_MSG}
          {data.UV_MSG && (
            <div className='mt-1'>
              <Sun className='h-3 w-3 inline mr-1' />
              {data.UV_MSG}
            </div>
          )}
        </div>
      </div>
    )}

    {/* 미세먼지 정보 */}
    {(data.PM25_INDEX || data.PM10_INDEX) && (
      <div className='p-2 bg-green-50 rounded-lg'>
        <div className='text-xs text-green-800'>
          <Wind className='h-3 w-3 inline mr-1' />
          <strong>대기질:</strong>
          {data.PM10_INDEX && <span className='ml-1'>미세먼지 {data.PM10_INDEX}</span>}
          {data.PM25_INDEX && <span className='ml-2'>초미세먼지 {data.PM25_INDEX}</span>}
        </div>
      </div>
    )}
  </div>
  );
};

const WeatherErrorState: React.FC = () => (
  <div className='flex flex-col items-center py-6 text-center'>
    <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2'>
      <Cloud className='h-6 w-6 text-red-500' />
    </div>
    <div className='text-sm text-red-600 font-medium'>연결 실패</div>
    <div className='text-xs text-red-500 mt-1'>날씨 정보를 불러올 수 없습니다</div>
  </div>
);

const WeatherEmptyState: React.FC = () => (
  <div className='flex flex-col items-center py-6 text-center'>
    <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2'>
      <Cloud className='h-6 w-6 text-gray-400' />
    </div>
    <div className='text-sm text-gray-600 font-medium'>데이터 없음</div>
    <div className='text-xs text-gray-500 mt-1'>현재 날씨 정보가 없습니다</div>
  </div>
);
