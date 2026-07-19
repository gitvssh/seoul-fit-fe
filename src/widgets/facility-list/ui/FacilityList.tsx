// components/map/FacilityList.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { X, Star, Navigation, Clock, MapPin, Bookmark, ExternalLink } from 'lucide-react';

import type { Facility } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';

interface FacilityListProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onFacilitySelect: (facility: Facility) => void;
  onFacilityHover: (facility: Facility | null, isHover: boolean) => void;
  onClose: () => void;
  markersCount: number;
}

export const FacilityList: React.FC<FacilityListProps> = ({
  facilities,
  selectedFacility,
  onFacilitySelect,
  onFacilityHover,
  onClose,
  markersCount,
}) => {
  return (
    <Card className='shadow-lg'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg'>주변 시설</CardTitle>
            <p className='text-sm text-gray-600 mt-1'>{markersCount}개 시설이 표시되고 있습니다</p>
          </div>
          <Button variant='ghost' size='sm' onClick={onClose}>
            <X className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        {facilities.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <MapPin className='h-8 w-8 mx-auto mb-2 opacity-50' />
            <p>표시할 시설이 없습니다</p>
            <p className='text-xs mt-1'>필터를 조정해보세요</p>
          </div>
        ) : (
          <ScrollArea className='h-80'>
            <div className='space-y-2'>
              {facilities.map(facility => {
                const config = FACILITY_CONFIGS[facility.category];
                const isSelected = selectedFacility?.id === facility.id;

                return (
                  <div
                    key={facility.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => onFacilitySelect(facility)}
                    onMouseEnter={() => onFacilityHover(facility, true)}
                    onMouseLeave={() => onFacilityHover(facility, false)}
                  >
                    {/* 시설 헤더 */}
                    <div className='flex items-start justify-between mb-2'>
                      <div className='flex items-center gap-2 flex-1 min-w-0'>
                        <div className={`w-3 h-3 rounded-full ${config.color} flex-shrink-0`} />
                        <div className='min-w-0 flex-1'>
                          <h4 className='font-medium text-gray-900 truncate'>{facility.name}</h4>
                          <p className='text-xs text-gray-500 truncate'>{config.label}</p>
                        </div>
                      </div>

                      {/* 즐겨찾기 버튼 */}
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0 flex-shrink-0'
                        onClick={e => {
                          e.stopPropagation();
                          // TODO: 즐겨찾기 기능 구현
                        }}
                      >
                        <Bookmark className='h-3 w-3' />
                      </Button>
                    </div>

                    {/* 주소 */}
                    <p className='text-sm text-gray-600 mb-2 line-clamp-2'>{facility.address}</p>

                    {/* 메타 정보 */}
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center gap-3 text-xs'>
                        {/* 평점 */}
                        {facility.rating && (
                          <div className='flex items-center gap-1'>
                            <Star className='h-3 w-3 text-yellow-500 fill-current' />
                            <span className='text-gray-700'>{facility.rating}</span>
                          </div>
                        )}

                        {/* 거리 */}
                        {facility.distance && (
                          <div className='flex items-center gap-1'>
                            <Navigation className='h-3 w-3 text-blue-500' />
                            <span className='text-gray-700'>{facility.distance}km</span>
                          </div>
                        )}

                        {/* 운영시간 */}
                        {facility.operatingHours && (
                          <div className='flex items-center gap-1'>
                            <Clock className='h-3 w-3 text-green-500' />
                            <span className='text-gray-700 truncate max-w-20'>
                              {facility.operatingHours}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 혼잡도 */}
                      <Badge
                        variant={
                          facility.congestionLevel === 'low'
                            ? 'default'
                            : facility.congestionLevel === 'medium'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className='text-xs'
                      >
                        {facility.congestionLevel === 'low'
                          ? '여유'
                          : facility.congestionLevel === 'medium'
                            ? '보통'
                            : '혼잡'}
                      </Badge>
                    </div>

                    {/* 설명 */}
                    {facility.description && (
                      <p className='text-xs text-gray-500 line-clamp-2 mb-2'>
                        {facility.description}
                      </p>
                    )}

                    {/* 액션 버튼들 */}
                    <div className='flex items-center gap-2'>
                      {facility.isReservable && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='text-xs h-7'
                          onClick={e => {
                            e.stopPropagation();
                            // TODO: 예약 기능 구현
                          }}
                        >
                          예약
                        </Button>
                      )}

                      {facility.website && (
                        <Button
                          size='sm'
                          variant='ghost'
                          className='text-xs h-7 p-1'
                          onClick={e => {
                            e.stopPropagation();
                            window.open(facility.website, '_blank');
                          }}
                        >
                          <ExternalLink className='h-3 w-3' />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
