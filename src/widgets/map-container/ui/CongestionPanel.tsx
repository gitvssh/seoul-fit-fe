import React from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { RefreshCw, Users, TrendingUp, Clock } from 'lucide-react';
import { CongestionData } from '@/lib/types';
import { getCongestionClass, getCongestionColor } from '@/shared/api/congestion';
import { getLiveDataStatus } from '@/features/recommendation/lib/live-data';

interface CongestionPanelProps {
  showCongestion: boolean;
  congestionData: CongestionData | null;
  congestionLoading: boolean;
  congestionError: string | null;
  onRefresh: () => void;
}

export const CongestionPanel: React.FC<CongestionPanelProps> = ({
  showCongestion,
  congestionData,
  congestionLoading,
  congestionError,
  onRefresh,
}) => {
  if (!showCongestion) return null;

  return (
    <div className='bg-white rounded-lg shadow-xl border border-gray-200 w-80 animate-in slide-in-from-right-5 duration-300'>
      {/* 헤더 */}
      <div className='flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white rounded-t-lg'>
        <div className='flex items-center gap-2'>
          <div className='h-2 w-2 bg-blue-500 rounded-full animate-pulse' />
          <h4 className='text-sm font-semibold text-gray-800'>실시간 근처 주요 장소 혼잡도</h4>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={onRefresh}
          disabled={congestionLoading}
          className='h-6 w-6 p-0 hover:bg-blue-100'
        >
          <RefreshCw
            className={`h-3 w-3 ${congestionLoading ? 'animate-spin text-blue-500' : 'text-gray-500'}`}
          />
        </Button>
      </div>

      {/* 컨텐츠 */}
      <div className='p-3'>
        {congestionLoading ? (
          <LoadingState />
        ) : congestionData ? (
          <CongestionContent data={congestionData} />
        ) : congestionError ? (
          <ErrorState />
        ) : (
          <EmptyState />
        )}

        <CongestionLegend />
      </div>
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className='flex items-center justify-center py-6'>
    <div className='flex items-center gap-2 text-sm text-gray-500'>
      <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500' />
      <span>혼잡도 조회중...</span>
    </div>
  </div>
);

const CongestionContent: React.FC<{ data: CongestionData }> = ({ data }) => {
  
  // API 응답 형식 처리 (AREA_CONGEST_LVL 또는 level)
  const congestionLevel = data.AREA_CONGEST_LVL || data.level || '보통';
  const areaName = data.AREA_NM || data.facilityId || '현재 위치 주변';
  const congestionMessage = data.AREA_CONGEST_MSG || '';
  const status = getLiveDataStatus(data.timestamp);
  
  return (
    <div className='space-y-3'>
      {/* 장소 정보 */}
      <div className='flex items-center gap-2 p-2 bg-gray-50 rounded-lg'>
        <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
          <Users className='h-4 w-4 text-blue-600' />
        </div>
        <div className='flex-1 min-w-0'>
          <div className='text-sm font-semibold text-gray-900'>{areaName}</div>
          <div className='text-xs text-gray-500 flex items-center gap-1'>
            <Clock className='h-3 w-3' />
            {status.label} · {status.referenceTimeLabel}
          </div>
        </div>
      </div>

      {/* 혼잡도 레벨 */}
      <div className='flex items-center justify-between p-2 bg-gradient-to-r from-gray-50 to-white rounded-lg border'>
        <span className='text-sm font-medium text-gray-700'>현재 상태</span>
        <Badge
          className={`${getCongestionClass(congestionLevel)} text-xs font-medium px-3 py-1 border`}
        >
          <TrendingUp className='h-3 w-3 mr-1' />
          {congestionLevel}
        </Badge>
      </div>

      {/* 혼잡도 메시지 */}
      <div className='p-2 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg'>
        <div className='text-xs text-blue-800 leading-relaxed'>
          💬 {congestionMessage || `${areaName} 지역의 현재 혼잡도는 "${congestionLevel}" 수준입니다.`}
        </div>
      </div>
    </div>
  );
};

const ErrorState: React.FC = () => (
  <div className='flex flex-col items-center py-6 text-center'>
    <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2'>
      <Users className='h-6 w-6 text-red-500' />
    </div>
    <div className='text-sm text-red-600 font-medium'>연결 실패</div>
    <div className='text-xs text-red-500 mt-1'>혼잡도 정보를 불러올 수 없습니다</div>
  </div>
);

const EmptyState: React.FC = () => (
  <div className='flex flex-col items-center py-6 text-center'>
    <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2'>
      <Users className='h-6 w-6 text-gray-400' />
    </div>
    <div className='text-sm text-gray-600 font-medium'>데이터 없음</div>
    <div className='text-xs text-gray-500 mt-1'>현재 혼잡도 정보가 없습니다</div>
  </div>
);

const CongestionLegend: React.FC = () => (
  <div className='mt-4 pt-3 border-t border-gray-200'>
    <div className='text-xs font-medium text-gray-600 mb-2 flex items-center gap-1'>
      <div className='h-1 w-1 bg-gray-400 rounded-full' />
      혼잡도 범례
    </div>
    <div className='grid grid-cols-2 gap-2 text-xs'>
      {[
        { level: '여유', color: getCongestionColor('여유') },
        { level: '보통', color: getCongestionColor('보통') },
        { level: '약간 붐빔', color: getCongestionColor('약간 붐빔') },
        { level: '붐빔', color: getCongestionColor('붐빔') },
      ].map(({ level, color }) => (
        <div key={level} className='flex items-center gap-2 p-1 hover:bg-gray-50 rounded'>
          <div
            className='w-3 h-3 rounded-full border border-white shadow-sm'
            style={{ backgroundColor: color }}
          />
          <span className='text-gray-600 flex-1'>{level}</span>
        </div>
      ))}
    </div>
  </div>
);
