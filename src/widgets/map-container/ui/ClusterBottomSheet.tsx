import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ClusteredFacility, Facility, FacilityCategory } from '@/lib/types';
import { getFacilityIcon } from '@/shared/lib/icons/facility';
import { X, MapPin, ArrowLeft, Clock, Phone, Info } from 'lucide-react';
import { trackEvent } from '@/shared/lib/analytics/analytics';

const FACILITY_LABELS = {
  sports: '체육시설',
  culture: '문화시설',
  restaurant: '맛집',
  library: '도서관',
  park: '공원',
  subway: '지하철',
  bike: '따릉이',
  cooling_shelter: '무더위쉼터',
  cultural_event: '문화행사',
  cultural_reservation: '문화예약',
} as const;

interface ClusterBottomSheetProps {
  cluster: ClusteredFacility;
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'list' | 'detail';

const ClusterBottomSheet = React.memo(function ClusterBottomSheet({
  cluster,
  isOpen,
  onClose,
}: ClusterBottomSheetProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');

  const handleFacilityClick = useCallback((facility: Facility) => {
    trackEvent('facility_detail_viewed', {
      category: facility.category,
      selection_source: 'cluster',
    });
    setSelectedFacility(facility);
    setViewMode('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedFacility(null);
  }, []);

  const handleClose = useCallback(() => {
    setViewMode('list');
    setSelectedFacility(null);
    onClose();
  }, [onClose]);

  const groupedByCategory = useMemo(() => {
    console.log('[ClusterBottomSheet] cluster?.facilities:', cluster?.facilities);
    if (!cluster?.facilities) {
      console.log('[ClusterBottomSheet] facilities가 없음');
      return {};
    }
    const grouped = cluster.facilities.reduce(
      (acc, facility) => {
        if (!acc[facility.category]) {
          acc[facility.category] = [];
        }
        acc[facility.category].push(facility);
        return acc;
      },
      {} as Record<string, Facility[]>
    );
    console.log('[ClusterBottomSheet] groupedByCategory:', Object.keys(grouped));
    return grouped;
  }, [cluster?.facilities]);

  // isOpen 상태가 변경될 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setViewMode('list');
      setSelectedFacility(null);
      setImageModalOpen(false);
      setModalImageSrc('');
    }
  }, [isOpen]);

  console.log('[ClusterBottomSheet] 렌더링 조건:', { isOpen, hasCluster: !!cluster });

  if (!isOpen || !cluster) {
    console.log('[ClusterBottomSheet] 렌더링하지 않음 - isOpen:', isOpen, 'cluster:', !!cluster);
    return null;
  }

  console.log('[ClusterBottomSheet] UI 렌더링 시작');

  return (
    <div className='fixed inset-0 z-50 flex items-end'>
      <div className='absolute inset-0 bg-black/20' onClick={onClose} />

      <div className='relative w-full bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-hidden'>
        <div className='sticky top-0 bg-white border-b border-gray-200 p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              {viewMode === 'detail' ? (
                <button
                  onClick={handleBackToList}
                  className='p-1 hover:bg-gray-100 rounded-full transition-colors'
                >
                  <ArrowLeft className='w-5 h-5 text-gray-600' />
                </button>
              ) : (
                <MapPin className='w-5 h-5 text-gray-600' />
              )}
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>
                  {viewMode === 'detail' && selectedFacility
                    ? selectedFacility.name
                    : `${cluster.count}개 시설 그룹`}
                </h2>
                <p className='text-sm text-gray-500'>
                  {viewMode === 'detail' && selectedFacility
                    ? FACILITY_LABELS[selectedFacility.category as keyof typeof FACILITY_LABELS]
                    : `총 ${cluster.count}개 시설`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>

        <div className='overflow-y-auto max-h-[calc(80vh-120px)]'>
          {viewMode === 'list' ? (
            <div className='p-4 space-y-4'>
              {Object.entries(groupedByCategory).map(([category, facilities]) => {
                const icon = getFacilityIcon(category as FacilityCategory);
                const label = FACILITY_LABELS[category as keyof typeof FACILITY_LABELS];

                return (
                  <div key={category} className='space-y-2'>
                    <div className='flex items-center gap-2 pb-2 border-b border-gray-100'>
                      <div
                        className='w-6 h-6 rounded-full flex items-center justify-center'
                        style={{ backgroundColor: icon.color }}
                      >
                        <div
                          className='w-4 h-4 text-white'
                          dangerouslySetInnerHTML={{ __html: icon.svg }}
                        />
                      </div>
                      <h3 className='font-medium text-gray-900'>
                        {label} ({facilities.length}개)
                      </h3>
                    </div>

                    <div className='space-y-2'>
                      {facilities.map(facility => (
                        <button
                          key={facility.id}
                          onClick={() => handleFacilityClick(facility)}
                          className='w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors'
                        >
                          <div className='font-medium text-gray-900 mb-1'>{facility.name}</div>
                          {facility.address && (
                            <div className='text-sm text-gray-600'>{facility.address}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className='p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]'>
              {selectedFacility && (
                <>
                  {/* 기본 정보 */}
                  <div className='space-y-3'>
                    {selectedFacility.address && (
                      <div className='flex items-start space-x-3'>
                        <MapPin className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                        <p className='text-gray-700 text-sm leading-relaxed'>
                          {selectedFacility.address}
                        </p>
                      </div>
                    )}

                    {selectedFacility.operatingHours && (
                      <div className='flex items-start space-x-3'>
                        <Clock className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                        <p className='text-gray-700 text-sm leading-relaxed'>
                          {selectedFacility.operatingHours}
                        </p>
                      </div>
                    )}

                    {selectedFacility.phone && (
                      <div className='flex items-start space-x-3'>
                        <Phone className='w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0' />
                        <a
                          href={`tel:${selectedFacility.phone}`}
                          onClick={() =>
                            trackEvent('facility_action_clicked', {
                              action_type: 'phone',
                              category: selectedFacility.category,
                            })
                          }
                          className='text-blue-600 hover:text-blue-800 text-sm transition-colors'
                        >
                          {selectedFacility.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* 문화행사 전용 정보는 새로운 타입 시스템에서 제거됨 */}

                  {/* 기타 시설 정보 */}
                  <div className='border-t pt-4'>
                    <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                      <Info className='w-4 h-4 mr-2' />
                      시설 정보
                    </h4>
                    <div className='grid grid-cols-1 gap-3 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>카테고리:</span>
                        <span className='text-gray-900 font-medium'>
                          {
                            FACILITY_LABELS[
                              selectedFacility.category as keyof typeof FACILITY_LABELS
                            ]
                          }
                        </span>
                      </div>
                      {selectedFacility.distance && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>거리:</span>
                          <span className='text-gray-900 font-medium'>
                            {selectedFacility.distance.toFixed(1)}km
                          </span>
                        </div>
                      )}
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>예약:</span>
                        <span className='text-gray-900 font-medium'>
                          {selectedFacility.isReservable ? '가능' : '불가'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 설명 */}
                  {selectedFacility.description && (
                    <div className='border-t pt-4'>
                      <h4 className='font-medium text-gray-900 mb-3'>설명</h4>
                      <p className='text-gray-700 text-sm leading-relaxed'>
                        {selectedFacility.description}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 이미지 모달 */}
      {imageModalOpen && (
        <div
          className='fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4'
          onClick={() => setImageModalOpen(false)}
        >
          <div className='relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center'>
            <Image
              src={modalImageSrc}
              alt='확대 이미지'
              width={800}
              height={600}
              className='max-w-full max-h-full object-contain rounded-lg'
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setImageModalOpen(false)}
              className='absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10'
            >
              <X className='w-6 h-6' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export { ClusterBottomSheet };
