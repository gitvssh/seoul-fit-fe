// components/map/FacilityBottomSheet.tsx - Improved version with better drag handling
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  ChevronUp,
  ChevronDown,
  MapPin,
  Clock,
  Phone,
  Users,
  Cloud,
  Info,
  MessageCircleMore,
  Train,
  Navigation,
  Share2,
  Bookmark,
  ExternalLink,
  Database,
  TicketCheck,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { Facility, CongestionData, WeatherData, SubwayArrivalData } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import { SubwayStationIcon } from './SubwayStationIcon';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { getFacilityOpenState } from '@/features/place-filter/lib/place-filter';
import { useLocalFacilityFavorite } from '@/features/favorites/lib/useLocalFacilityFavorite';
import {
  getFacilityReservationUrl,
  getFacilityShareUrl,
  getKakaoDirectionsUrl,
  getSafeExternalUrl,
} from '@/entities/facility/lib/actions';
import { getFacilityProvenance } from '@/entities/facility/lib/provenance';
import type { FacilityRecommendation } from '@/features/recommendation/model/types';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';
import { useFocusTrap } from '@/shared/lib/hooks/useFocusTrap';

interface FacilityBottomSheetProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  weatherData?: WeatherData | null;
  congestionData?: CongestionData | null;
  alternatives?: FacilityRecommendation[];
  decisionSummary?: FacilityRecommendation;
  onAlternativeSelect?: (recommendation: FacilityRecommendation) => void;
}

// 드래그 상태 타입
interface DragState {
  isDragging: boolean;
  startY: number;
  currentY: number;
  startTime: number;
}

export const FacilityBottomSheet: React.FC<FacilityBottomSheetProps> = ({
  facility,
  isOpen,
  onClose,
  weatherData: propWeatherData,
  congestionData: propCongestionData,
  alternatives = [],
  decisionSummary,
  onAlternativeSelect,
}) => {
  const { locale, t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startY: 0,
    currentY: 0,
    startTime: 0,
  });
  const [subwayArrival, setSubwayArrival] = useState<SubwayArrivalData | null>(null);
  const [isLoadingArrival, setIsLoadingArrival] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const {
    isFavorite,
    isSaving: isFavoriteSaving,
    error: favoriteError,
    toggleFavorite,
  } = useLocalFacilityFavorite(facility);

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, isOpen);

  // 시설이 변경되면 확장 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setIsExpanded(false);
      setDragState({
        isDragging: false,
        startY: 0,
        currentY: 0,
        startTime: 0,
      });
      setSubwayArrival(null);
      setShareMessage('');
    }
  }, [isOpen, facility]);

  // 지하철역인 경우 실시간 도착 정보 가져오기
  useEffect(() => {
    if (facility?.category === 'subway' && facility.name && isOpen) {
      const fetchSubwayArrival = async () => {
        setIsLoadingArrival(true);
        try {
          const response = await fetch(
            `/api/subway/arrival?stationName=${encodeURIComponent(facility.name)}`
          );
          const result = await response.json();

          if (result.success) {
            setSubwayArrival(result.data);
          }
        } catch (error) {
          console.error('지하철 도착 정보 조회 실패:', error);
        } finally {
          setIsLoadingArrival(false);
        }
      };

      fetchSubwayArrival();
    }
  }, [facility, isOpen]);

  // 드래그 시작 처리
  const handleDragStart = useCallback((clientY: number) => {
    setDragState({
      isDragging: true,
      startY: clientY,
      currentY: clientY,
      startTime: Date.now(),
    });
  }, []);

  // 드래그 중 처리
  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!dragState.isDragging) return;

      setDragState(prev => ({
        ...prev,
        currentY: clientY,
      }));
    },
    [dragState.isDragging]
  );

  // 드래그 종료 처리 (개선된 로직)
  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging) return;

    const deltaY = dragState.currentY - dragState.startY;
    const deltaTime = Date.now() - dragState.startTime;
    const velocity = Math.abs(deltaY) / deltaTime; // px/ms

    // 빠른 스와이프 감지 (속도 기반)
    const isQuickSwipe = velocity > 0.5;

    // 임계값 설정
    const threshold = isQuickSwipe ? 30 : 80;

    if (deltaY > threshold) {
      // 아래로 드래그
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
    } else if (deltaY < -threshold) {
      // 위로 드래그
      if (!isExpanded) {
        setIsExpanded(true);
      }
    }

    // 드래그 상태 초기화
    setDragState({
      isDragging: false,
      startY: 0,
      currentY: 0,
      startTime: 0,
    });
  }, [dragState, isExpanded, onClose]);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragState.isDragging) {
        e.preventDefault();
        handleDragMove(e.touches[0].clientY);
      }
    },
    [dragState.isDragging, handleDragMove]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleDragEnd();
    },
    [handleDragEnd]
  );

  // 마우스 이벤트 핸들러
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // 키보드 접근성
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowUp' && !isExpanded) {
        setIsExpanded(true);
      } else if (e.key === 'ArrowDown' && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExpanded, onClose]);

  const handleShare = useCallback(async () => {
    if (!facility) return;

    const url = getFacilityShareUrl(facility);
    try {
      if (navigator.share) {
        await navigator.share({
          title: facility.name,
          text: `${facility.name} 위치를 확인해 보세요.`,
          url,
        });
        setShareMessage('공유했습니다.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareMessage('링크를 복사했습니다.');
      } else {
        setShareMessage('이 브라우저에서는 링크 복사를 지원하지 않습니다.');
        return;
      }
      trackEvent('facility_action_clicked', {
        action_type: 'share',
        category: facility.category,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareMessage('공유하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }, [facility]);

  if (!facility || !isOpen) return null;

  const config = FACILITY_CONFIGS[facility.category];
  const openState = getFacilityOpenState(facility.operatingHours);
  const openStatus =
    openState === 'open'
      ? { label: t('explorer.open'), dotClass: 'bg-green-500' }
      : openState === 'closed'
        ? { label: t('explorer.closed'), dotClass: 'bg-red-500' }
        : { label: t('explorer.hoursUnknown'), dotClass: 'bg-gray-500' };
  const provenance = getFacilityProvenance(facility);
  const sourceUrl = getSafeExternalUrl(provenance.sourceUrl);
  const websiteUrl = getSafeExternalUrl(facility.website);
  const reservationUrl = getFacilityReservationUrl(facility);
  const directionsUrl = getKakaoDirectionsUrl(facility);

  // 드래그 중 변환 계산 (부드러운 애니메이션)
  const translateY = dragState.isDragging ? Math.max(0, dragState.currentY - dragState.startY) : 0;

  // 높이 계산
  const sheetHeight = isExpanded ? '80vh' : 'auto';
  const maxHeight = isExpanded ? '80vh' : '50vh';

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden='true'
      />

      {/* 바텀 시트 */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 transition-all duration-300 ease-out focus:outline-none ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          transform: `translateY(${translateY}px)`,
          height: sheetHeight,
          maxHeight: maxHeight,
        }}
        role='dialog'
        aria-modal='true'
        aria-labelledby='facility-title'
        tabIndex={-1}
      >
        {/* 드래그 핸들 */}
        <button
          type='button'
          className='flex justify-center py-4 cursor-grab active:cursor-grabbing select-none'
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onClick={() => setIsExpanded(current => !current)}
          aria-label={t('facility.drag')}
        >
          <div className='w-14 h-1.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full transition-all hover:scale-x-125' />
        </button>

        {/* 헤더 */}
        <div className='flex items-center justify-between px-6 pb-4'>
          <div className='flex items-center space-x-4 flex-1 min-w-0'>
            {facility.category === 'subway' ? (
              <SubwayStationIcon
                route={undefined} // 새 타입 시스템에서는 route 정보가 별도 처리 필요
                size='lg'
                className='flex-shrink-0'
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl ${config.color} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}
              >
                {config.icon}
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <h3 id='facility-title' className='text-xl font-bold text-gray-900 truncate'>
                {facility.name}
              </h3>
              <p className='text-sm text-gray-500 truncate flex items-center gap-1 mt-1'>
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${openStatus.dotClass}`}
                />
                {t(`category.${facility.category}` as MessageKey)} · {openStatus.label}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-2 flex-shrink-0'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsExpanded(!isExpanded)}
              className='p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-110'
              aria-label={isExpanded ? t('facility.collapse') : t('facility.expand')}
            >
              {isExpanded ? (
                <ChevronDown className='w-5 h-5 text-gray-600' />
              ) : (
                <ChevronUp className='w-5 h-5 text-gray-600' />
              )}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='p-2.5 hover:bg-red-50 rounded-xl transition-all hover:scale-110 group'
              aria-label={t('facility.close')}
            >
              <X className='w-5 h-5 text-gray-600 group-hover:text-red-500' />
            </Button>
          </div>
        </div>

        {/* 내용 */}
        <div
          ref={contentRef}
          className={`px-6 pb-6 overflow-y-auto overscroll-contain ${
            isExpanded ? 'max-h-[calc(80vh-120px)]' : 'max-h-[calc(50vh-120px)]'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
          }}
        >
          {decisionSummary && (
            <section className='mb-4 rounded-2xl border border-violet-100 bg-violet-50 p-4'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <p className='text-xs font-medium text-violet-700'>
                    {t('facility.decision')}
                  </p>
                  <p className='mt-1 text-sm font-semibold text-gray-900'>
                    {decisionSummary.reasonCodes[0]
                      ? t(`reason.${decisionSummary.reasonCodes[0]}` as MessageKey)
                      : t('facility.genericDecision')}
                  </p>
                </div>
                <span className='rounded-full bg-white px-3 py-1 text-sm font-bold text-violet-700'>
                  {decisionSummary.score}점
                </span>
              </div>
              {decisionSummary.reasons.length > 1 && (
                <p className='mt-2 text-xs text-violet-800'>
                  {decisionSummary.reasonCodes
                    .slice(1)
                    .map(code => t(`reason.${code}` as MessageKey))
                    .join(' · ')}
                </p>
              )}
              {decisionSummary.warnings.length > 0 && (
                <p className='mt-2 text-xs font-medium text-amber-700'>
                  {t('explorer.check', {
                    warning: decisionSummary.warningCodes
                      .map(code => t(`warning.${code}` as MessageKey))
                      .join(' · '),
                  })}
                </p>
              )}
              <p className='mt-2 text-[11px] text-gray-500'>
                {t('facility.referenceScore')}
              </p>
            </section>
          )}

          <div className='mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4'>
            <Button asChild variant='default' className='h-10'>
              <a
                href={directionsUrl}
                target='_blank'
                rel='noopener noreferrer'
                onClick={() =>
                  trackEvent('facility_action_clicked', {
                    action_type: 'navigation',
                    category: facility.category,
                  })
                }
              >
                <Navigation className='h-4 w-4' aria-hidden='true' />
                {t('facility.directions')}
              </a>
            </Button>
            <Button type='button' variant='outline' className='h-10' onClick={handleShare}>
              <Share2 className='h-4 w-4' aria-hidden='true' />
              {t('facility.share')}
            </Button>
            <Button
              type='button'
              variant={isFavorite ? 'secondary' : 'outline'}
              className='h-10'
              aria-pressed={isFavorite}
              disabled={isFavoriteSaving}
              onClick={async () => {
                const nextFavorite = await toggleFavorite();
                trackEvent('favorite_changed', {
                  action_type: 'save',
                  category: facility.category,
                  favorite_state: nextFavorite ? 'saved' : 'removed',
                });
              }}
            >
              <Bookmark
                className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`}
                aria-hidden='true'
              />
              {isFavorite ? t('facility.saved') : t('facility.save')}
            </Button>
            {reservationUrl ? (
              <Button asChild variant='outline' className='h-10'>
                <a
                  href={reservationUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={() =>
                    trackEvent('facility_action_clicked', {
                      action_type: 'reservation',
                      category: facility.category,
                    })
                  }
                >
                  <TicketCheck className='h-4 w-4' aria-hidden='true' />
                  {t('facility.reservation')}
                </a>
              </Button>
            ) : websiteUrl ? (
              <Button asChild variant='outline' className='h-10'>
                <a
                  href={websiteUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={() =>
                    trackEvent('facility_action_clicked', {
                      action_type: 'website',
                      category: facility.category,
                    })
                  }
                >
                  <ExternalLink className='h-4 w-4' aria-hidden='true' />
                  {t('facility.website')}
                </a>
              </Button>
            ) : (
              <Button type='button' variant='outline' className='h-10' disabled>
                {t('facility.noLink')}
              </Button>
            )}
          </div>
          {favoriteError && (
            <p className='mt-2 text-xs text-amber-700' role='status'>
              {favoriteError}
            </p>
          )}
          <p className='sr-only' role='status' aria-live='polite'>
            {shareMessage}
          </p>

          {/* 따릉이 설명 (우선 표시) */}
          {facility.category === 'bike' && facility.description && (
            <div className='mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl'>
              <p className='text-green-800 text-sm font-medium flex items-center'>
                <span className='mr-2'>🚲</span>
                {facility.description}
              </p>
            </div>
          )}

          {/* 기본 정보 */}
          <div className='space-y-4 mb-6'>
            {facility.address && (
              <div className='flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'>
                <div className='w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm'>
                  <MapPin className='w-5 h-5 text-blue-500' />
                </div>
                <div className='flex-1'>
                  <p className='mb-1 text-xs text-gray-600'>{t('facility.address')}</p>
                  <p className='text-gray-900 text-sm font-medium leading-relaxed'>
                    {facility.address}
                  </p>
                </div>
              </div>
            )}

            {facility.operatingHours && (
              <div className='flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'>
                <div className='w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm'>
                  <Clock className='w-5 h-5 text-green-500' />
                </div>
                <div className='flex-1'>
                  <p className='mb-1 text-xs text-gray-600'>{t('facility.hours')}</p>
                  <p className='text-gray-900 text-sm font-medium leading-relaxed'>
                    {facility.operatingHours}
                  </p>
                </div>
              </div>
            )}

            {facility.phone && (
              <div className='flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors'>
                <div className='w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm'>
                  <Phone className='w-5 h-5 text-purple-500' />
                </div>
                <div className='flex-1'>
                  <p className='mb-1 text-xs text-gray-600'>{t('facility.contact')}</p>
                  <a
                    href={`tel:${facility.phone}`}
                    onClick={() =>
                      trackEvent('facility_action_clicked', {
                        action_type: 'phone',
                        category: facility.category,
                      })
                    }
                    className='text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors underline decoration-dotted'
                  >
                    {facility.phone}
                  </a>
                </div>
              </div>
            )}

            <div className='flex items-start space-x-3 rounded-xl bg-gray-50 p-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm'>
                <Database className='h-5 w-5 text-slate-600' aria-hidden='true' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-xs text-gray-600'>{t('facility.source')}</p>
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm font-medium text-blue-700 underline decoration-dotted'
                  >
                    {provenance.sourceLabel}
                  </a>
                ) : (
                  <p className='text-sm font-medium text-gray-900'>{provenance.sourceLabel}</p>
                )}
                <p className='mt-1 text-xs text-gray-600'>
                  {t('facility.lastUpdated', {
                    freshness: t(`freshness.${provenance.freshness}` as MessageKey),
                    time:
                      facility.sourceUpdatedAt &&
                      Number.isFinite(Date.parse(facility.sourceUpdatedAt))
                        ? new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(facility.sourceUpdatedAt))
                        : t('facility.unknown'),
                  })}
                </p>
                {provenance.freshness === 'stale' && (
                  <p className='mt-1 text-xs font-medium text-amber-700'>
                    {t('facility.staleWarning')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {alternatives.length > 0 && (
            <section className='mb-6' aria-labelledby='nearby-alternatives-title'>
              <div className='mb-2 flex items-center justify-between'>
                <h4 id='nearby-alternatives-title' className='text-sm font-semibold text-gray-900'>
                  {t('facility.alternatives')}
                </h4>
                <span className='text-xs text-gray-600'>{t('facility.within5km')}</span>
              </div>
              <div className='grid gap-2 sm:grid-cols-3'>
                {alternatives.map(alternative => (
                  <button
                    key={`${alternative.facility.category}:${alternative.facility.id}`}
                    type='button'
                    onClick={() => {
                      trackEvent('alternative_selected', {
                        category: alternative.facility.category,
                        reason_code: alternative.reasonCodes[0],
                      });
                      onAlternativeSelect?.(alternative);
                    }}
                    className='rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <p className='truncate text-sm font-semibold text-gray-900'>
                        {alternative.facility.name}
                      </p>
                      <span className='shrink-0 text-xs font-bold text-blue-700'>
                        {t('explorer.score', { score: alternative.score })}
                      </span>
                    </div>
                    <p className='mt-1 text-xs text-gray-500'>
                      {alternative.facility.distance?.toFixed(1)}km ·{' '}
                      {alternative.reasonCodes[0]
                        ? t(`reason.${alternative.reasonCodes[0]}` as MessageKey)
                        : t('explorer.nearbyInfo')}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 지하철 실시간 도착 정보 */}
          {facility.category === 'subway' && (
            <div className='mb-6'>
              <h4 className='font-semibold text-gray-900 mb-3 flex items-center'>
                <div className='w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3'>
                  <Train className='w-4 h-4 text-indigo-600' />
                </div>
                {t('facility.realtimeArrival')}
              </h4>
              {isLoadingArrival ? (
                <div className='flex items-center justify-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl'>
                  <div className='flex flex-col items-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-3 border-indigo-200 border-t-indigo-600' />
                    <span className='mt-3 text-sm text-gray-600'>
                      {t('facility.loadingArrival')}
                    </span>
                  </div>
                </div>
              ) : subwayArrival ? (
                <div className='bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700'>
                      {subwayArrival.lineName}
                    </span>
                    <span className='px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full'>
                      실시간
                    </span>
                  </div>
                  {subwayArrival.arrivalTime && (
                    <div className='flex items-center justify-between bg-white/70 rounded-xl p-3'>
                      <span className='text-sm text-gray-600'>다음 열차</span>
                      <span className='text-lg font-bold text-indigo-600'>
                        {subwayArrival.arrivalTime}분 후
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className='bg-gray-50 rounded-2xl p-6 text-center'>
                  <p className='text-sm text-gray-500'>현재 도착 정보가 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 확장된 내용 */}
          {isExpanded && (
            <div className='space-y-4 animate-in fade-in duration-200'>
              {/* 혼잡도 정보 */}
              <div className='border-t border-gray-100 pt-4'>
                <h4 className='font-semibold text-gray-900 mb-3 flex items-center'>
                  <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3'>
                    <Users className='w-4 h-4 text-orange-600' />
                  </div>
                  혼잡도 정보
                </h4>
                {propCongestionData ? (
                  <div className='bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-gray-600'>현재 혼잡도</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          propCongestionData.AREA_CONGEST_LVL === '여유'
                            ? 'bg-green-100 text-green-700'
                            : propCongestionData.AREA_CONGEST_LVL === '보통'
                              ? 'bg-yellow-100 text-yellow-700'
                              : propCongestionData.AREA_CONGEST_LVL === '약간 붐빔'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {propCongestionData.AREA_CONGEST_LVL}
                      </span>
                    </div>
                    <div className='text-xs text-gray-700 leading-relaxed'>
                      {propCongestionData.AREA_CONGEST_MSG}
                    </div>
                  </div>
                ) : (
                  <div className='bg-gray-50 rounded-xl p-4'>
                    <p className='text-sm text-gray-500 text-center'>
                      혼잡도 정보를 불러올 수 없습니다
                    </p>
                  </div>
                )}
              </div>

              {/* 날씨 정보 */}
              <div className='border-t border-gray-100 pt-4'>
                <h4 className='font-semibold text-gray-900 mb-3 flex items-center'>
                  <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3'>
                    <Cloud className='w-4 h-4 text-blue-600' />
                  </div>
                  날씨 정보
                </h4>
                {propWeatherData ? (
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3'>
                      <div className='flex items-center justify-between mb-1'>
                        <span className='text-xs text-gray-600'>기온</span>
                        <span className='text-2xl font-bold text-blue-600'>
                          {propWeatherData.TEMP}°
                        </span>
                      </div>
                      <div className='text-xs text-gray-500'>
                        체감 {propWeatherData.SENSIBLE_TEMP}°
                      </div>
                    </div>
                    <div className='bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3'>
                      <div className='flex items-center justify-between mb-1'>
                        <span className='text-xs text-gray-600'>습도</span>
                        <span className='text-2xl font-bold text-purple-600'>
                          {propWeatherData.HUMIDITY}%
                        </span>
                      </div>
                      <div className='text-xs text-gray-500'>
                        미세먼지 {propWeatherData.PM10_INDEX}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='bg-gray-50 rounded-xl p-4'>
                    <p className='text-sm text-gray-500 text-center'>
                      날씨 정보를 불러올 수 없습니다
                    </p>
                  </div>
                )}
              </div>

              {/* 기본 시설 정보 */}
              <div className='border-t pt-4'>
                <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                  <Info className='w-4 h-4 mr-2' />
                  시설 정보
                </h4>
                <div className='grid grid-cols-1 gap-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>카테고리:</span>
                    <span className='text-gray-900 font-medium'>{config.label}</span>
                  </div>
                  {facility.distance && (
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>거리:</span>
                      <span className='text-gray-900 font-medium'>
                        {facility.distance.toFixed(1)}km
                      </span>
                    </div>
                  )}
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>예약:</span>
                    <span className='text-gray-900 font-medium'>
                      {facility.isReservable ? '가능' : '불가'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 문화행사 전용 정보 */}
              {facility.category === 'cultural_event' && facility.culturalEvent && (
                <div className='border-t pt-4'>
                  <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                    <MessageCircleMore className='w-4 h-4 mr-2' />
                    행사 정보
                  </h4>
                  <div className='space-y-3 text-sm'>
                    {facility.culturalEvent.codeName && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>장르:</span>
                        <span className='text-gray-900 font-medium'>
                          {facility.culturalEvent.codeName}
                        </span>
                      </div>
                    )}
                    {facility.culturalEvent.useFee && (
                      <div className='flex flex-col space-y-1'>
                        <span className='text-gray-500'>요금:</span>
                        <span className='text-gray-900 text-xs leading-relaxed'>
                          {facility.culturalEvent.useFee}
                        </span>
                      </div>
                    )}
                    {facility.culturalEvent.useTarget && (
                      <div className='flex flex-col space-y-1'>
                        <span className='text-gray-500'>이용대상:</span>
                        <span className='text-gray-900 text-xs'>
                          {facility.culturalEvent.useTarget}
                        </span>
                      </div>
                    )}
                    {facility.culturalEvent.ticket && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>예매:</span>
                        <span className='text-gray-900 font-medium'>
                          {facility.culturalEvent.ticket}
                        </span>
                      </div>
                    )}
                    {facility.culturalEvent.isFree && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>구분:</span>
                        <span
                          className={`font-medium ${
                            facility.culturalEvent.isFree === '무료'
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {facility.culturalEvent.isFree}
                        </span>
                      </div>
                    )}
                  </div>
                  {facility.culturalEvent.mainImg && (
                    <div className='mt-4'>
                      <Image
                        src={facility.culturalEvent.mainImg}
                        alt={facility.name}
                        width={400}
                        height={128}
                        className='w-full h-32 object-cover rounded-lg'
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {facility.description && facility.category !== 'cultural_event' && (
                <div className='border-t pt-4'>
                  <h4 className='font-medium text-gray-900 mb-3 flex items-center'>
                    <MessageCircleMore className='w-4 h-4 mr-2' />
                    설명
                  </h4>
                  <p className='text-gray-700 text-sm leading-relaxed'>{facility.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
