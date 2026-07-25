'use client';

import React from 'react';
import {
  BellRing,
  Bookmark,
  Clock3,
  Loader2,
  MapPin,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useAuthStore } from '@/shared/model/authStore';
import { useNotificationStore } from '@/shared/model/notificationStore';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { readLocalFavorites } from '@/features/favorites/model/local-favorites';
import {
  createAlertSubscription,
  createSavedZone,
  deleteAlertSubscription,
  deleteFavoritePlace,
  deleteSavedZone,
  evaluateAlertSubscriptions,
  getAlertSubscriptions,
  getFavoritePlaces,
  getRecentPlaces,
  getSavedZones,
  saveFavoritePlace,
  updateAlertSubscription,
  updateSavedZone,
} from '../api/engagement';
import type {
  AlertEvaluation,
  AlertRuleType,
  AlertSubscription,
  AlertSubscriptionRequest,
  SavedPlace,
  SavedZone,
  Weekday,
} from '../model/types';
import { toEngagementPlaceRequest } from '../model/types';
import { useFocusTrap } from '@/shared/lib/hooks/useFocusTrap';

const ALL_DAYS: Weekday[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const ALERT_TYPES: Array<{ value: AlertRuleType; label: string }> = [
  { value: 'AIR_QUALITY', label: '미세먼지 나쁨' },
  { value: 'EXTREME_HEAT', label: '폭염·고온' },
  { value: 'HEAVY_RAIN', label: '강한 비' },
  { value: 'BIKE_SHORTAGE', label: '따릉이 부족' },
  { value: 'BIKE_FULL', label: '반납소 포화' },
  { value: 'CULTURAL_EVENT', label: '근처 문화행사' },
  { value: 'RESERVATION_OPEN', label: '예약 기회' },
];

interface EngagementPanelProps {
  isOpen: boolean;
  currentLocation: { lat: number; lng: number };
  onClose: () => void;
}

function placeHref(place: Pick<SavedPlace, 'latitude' | 'longitude'>): string {
  const params = new URLSearchParams({
    lat: String(place.latitude),
    lng: String(place.longitude),
  });
  return `/?${params.toString()}`;
}

function subscriptionRequest(
  subscription: AlertSubscription,
  active: boolean
): AlertSubscriptionRequest {
  return {
    zoneId: subscription.zoneId,
    alertType: subscription.alertType,
    activeDays: subscription.activeDays,
    activeStart: subscription.activeStart,
    activeEnd: subscription.activeEnd,
    quietStart: subscription.quietStart,
    quietEnd: subscription.quietEnd,
    cooldownMinutes: subscription.cooldownMinutes,
    active,
  };
}

export function EngagementPanel({
  isOpen,
  currentLocation,
  onClose,
}: EngagementPanelProps) {
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const { fetchNotificationHistory, fetchUnreadCount } = useNotificationStore();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLElement>(null);
  const [favorites, setFavorites] = React.useState<SavedPlace[]>([]);
  const [recentPlaces, setRecentPlaces] = React.useState<SavedPlace[]>([]);
  const [zones, setZones] = React.useState<SavedZone[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<AlertSubscription[]>([]);
  const [zoneLabel, setZoneLabel] = React.useState('내 생활권');
  const [radiusMeters, setRadiusMeters] = React.useState(1500);
  const [selectedZoneId, setSelectedZoneId] = React.useState<number | ''>('');
  const [alertType, setAlertType] = React.useState<AlertRuleType>('AIR_QUALITY');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMutating, setIsMutating] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [evaluation, setEvaluation] = React.useState<AlertEvaluation | null>(null);

  const load = React.useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setMessage('');
    try {
      const localFavorites = readLocalFavorites();
      if (localFavorites.length > 0) {
        await Promise.allSettled(
          localFavorites.map(favorite =>
            saveFavoritePlace(
              accessToken,
              toEngagementPlaceRequest({
                id: favorite.facilityId,
                category: favorite.category,
                name: favorite.name,
                address: favorite.address,
                position: favorite.position,
              })
            )
          )
        );
      }
      const [nextFavorites, nextRecent, nextZones, nextSubscriptions] =
        await Promise.all([
          getFavoritePlaces(accessToken),
          getRecentPlaces(accessToken),
          getSavedZones(accessToken),
          getAlertSubscriptions(accessToken),
        ]);
      setFavorites(nextFavorites);
      setRecentPlaces(nextRecent);
      setZones(nextZones);
      setSubscriptions(nextSubscriptions);
      setSelectedZoneId(current =>
        current && nextZones.some(zone => zone.id === current)
          ? current
          : (nextZones[0]?.id ?? '')
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '내 생활 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useFocusTrap(panelRef, isOpen, onClose, closeButtonRef);

  React.useEffect(() => {
    if (isOpen && isAuthenticated && accessToken) void load();
  }, [accessToken, isAuthenticated, isOpen, load]);

  if (!isOpen) return null;

  const mutate = async (operation: () => Promise<void>, successMessage: string) => {
    setIsMutating(true);
    setMessage('');
    try {
      await operation();
      setMessage(successMessage);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요청을 처리하지 못했습니다.');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <>
      <button
        type='button'
        className='fixed inset-0 z-40 cursor-default bg-black/40'
        onClick={onClose}
        aria-label='내 생활 패널 닫기'
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role='dialog'
        aria-modal='true'
        aria-labelledby='engagement-panel-title'
        className='fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl'
      >
        <div className='sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3'>
          <div>
            <h2 id='engagement-panel-title' className='font-semibold text-gray-950'>
              내 생활
            </h2>
            <p className='text-xs text-gray-500'>저장한 장소와 생활권 알림을 관리합니다.</p>
          </div>
          <Button
            ref={closeButtonRef}
            type='button'
            variant='ghost'
            size='icon'
            onClick={onClose}
            aria-label='닫기'
          >
            <X className='h-5 w-5' aria-hidden='true' />
          </Button>
        </div>

        {!isAuthenticated || !accessToken ? (
          <div className='p-6 text-center'>
            <Bookmark className='mx-auto h-8 w-8 text-blue-600' aria-hidden='true' />
            <p className='mt-3 font-medium text-gray-900'>로그인하면 여러 기기에서 이어집니다.</p>
            <p className='mt-2 text-sm leading-6 text-gray-600'>
              로그인 전 저장한 장소는 이 기기에 안전하게 남아 있습니다. 왼쪽 메뉴에서 로그인해
              주세요.
            </p>
          </div>
        ) : (
          <div className='space-y-6 p-4'>
            <div className='flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2'>
              <p className='text-sm text-blue-900'>
                <strong>{user?.nickname || '사용자'}</strong>님의 생활 정보
              </p>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={() => void load()}
                disabled={isLoading || isMutating}
              >
                <RefreshCw className='mr-1 h-4 w-4' aria-hidden='true' />
                새로고침
              </Button>
            </div>

            {message && (
              <p className='rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700' role='status'>
                {message}
              </p>
            )}
            {isLoading && (
              <p className='flex items-center justify-center gap-2 py-6 text-sm text-gray-500'>
                <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' />
                불러오는 중
              </p>
            )}

            <section aria-labelledby='favorite-places-title'>
              <h3
                id='favorite-places-title'
                className='flex items-center gap-2 text-sm font-semibold text-gray-900'
              >
                <Bookmark className='h-4 w-4 text-blue-600' aria-hidden='true' />
                저장한 장소 {favorites.length}
              </h3>
              <div className='mt-2 space-y-2'>
                {favorites.slice(0, 20).map(place => (
                  <div
                    key={place.id}
                    className='flex items-center gap-2 rounded-xl border border-gray-200 p-3'
                  >
                    <a className='min-w-0 flex-1' href={placeHref(place)}>
                      <p className='truncate text-sm font-medium text-gray-900'>{place.name}</p>
                      <p className='truncate text-xs text-gray-500'>{place.address || '주소 미확인'}</p>
                    </a>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      disabled={isMutating}
                      onClick={() =>
                        void mutate(
                          () => deleteFavoritePlace(accessToken, place.id),
                          '저장한 장소에서 삭제했습니다.'
                        )
                      }
                      aria-label={`${place.name} 저장 삭제`}
                    >
                      <Trash2 className='h-4 w-4' aria-hidden='true' />
                    </Button>
                  </div>
                ))}
                {!isLoading && favorites.length === 0 && (
                  <p className='rounded-lg bg-gray-50 p-3 text-sm text-gray-500'>
                    장소 상세에서 ‘저장’을 눌러 보세요.
                  </p>
                )}
              </div>
            </section>

            <section aria-labelledby='recent-places-title'>
              <h3
                id='recent-places-title'
                className='flex items-center gap-2 text-sm font-semibold text-gray-900'
              >
                <Clock3 className='h-4 w-4 text-slate-600' aria-hidden='true' />
                최근 본 장소
              </h3>
              <div className='mt-2 flex gap-2 overflow-x-auto pb-1'>
                {recentPlaces.slice(0, 10).map(place => (
                  <a
                    key={place.id}
                    href={placeHref(place)}
                    className='w-40 shrink-0 rounded-xl border border-gray-200 p-3'
                  >
                    <p className='truncate text-sm font-medium text-gray-900'>{place.name}</p>
                    <p className='mt-1 truncate text-xs text-gray-500'>{place.category}</p>
                  </a>
                ))}
                {!isLoading && recentPlaces.length === 0 && (
                  <p className='text-sm text-gray-500'>아직 본 장소가 없습니다.</p>
                )}
              </div>
            </section>

            <section aria-labelledby='saved-zones-title'>
              <h3
                id='saved-zones-title'
                className='flex items-center gap-2 text-sm font-semibold text-gray-900'
              >
                <MapPin className='h-4 w-4 text-emerald-600' aria-hidden='true' />
                생활권
              </h3>
              <div className='mt-2 grid grid-cols-[1fr_7rem] gap-2'>
                <div>
                  <Label htmlFor='zone-label' className='sr-only'>
                    생활권 이름
                  </Label>
                  <Input
                    id='zone-label'
                    value={zoneLabel}
                    maxLength={40}
                    onChange={event => setZoneLabel(event.target.value)}
                    placeholder='예: 집, 회사'
                  />
                </div>
                <div>
                  <Label htmlFor='zone-radius' className='sr-only'>
                    반경
                  </Label>
                  <select
                    id='zone-radius'
                    value={radiusMeters}
                    onChange={event => setRadiusMeters(Number(event.target.value))}
                    className='h-10 w-full rounded-md border border-gray-300 bg-white px-2 text-sm'
                  >
                    <option value={500}>500m</option>
                    <option value={1000}>1km</option>
                    <option value={1500}>1.5km</option>
                    <option value={3000}>3km</option>
                    <option value={5000}>5km</option>
                  </select>
                </div>
              </div>
              <Button
                type='button'
                className='mt-2 w-full'
                disabled={isMutating || !zoneLabel.trim()}
                onClick={() =>
                  void mutate(async () => {
                    await createSavedZone(accessToken, {
                      label: zoneLabel.trim(),
                      latitude: currentLocation.lat,
                      longitude: currentLocation.lng,
                      radiusMeters,
                    });
                    trackEvent('area_saved', { action_type: 'save' });
                  }, '현재 위치를 생활권으로 저장했습니다.')
                }
              >
                현재 위치를 생활권으로 저장
              </Button>
              <div className='mt-2 space-y-2'>
                {zones.map(zone => (
                  <div
                    key={zone.id}
                    className='flex items-center gap-2 rounded-xl border border-gray-200 p-3'
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium'>{zone.label}</p>
                      <p className='text-xs text-gray-500'>반경 {zone.radiusMeters / 1000}km</p>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={isMutating}
                      onClick={() =>
                        void mutate(
                          () =>
                            updateSavedZone(accessToken, zone.id, {
                              label: zone.label,
                              latitude: currentLocation.lat,
                              longitude: currentLocation.lng,
                              radiusMeters: zone.radiusMeters,
                            }).then(() => undefined),
                          '생활권 중심을 현재 위치로 갱신했습니다.'
                        )
                      }
                    >
                      위치 갱신
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      disabled={isMutating}
                      onClick={() =>
                        void mutate(
                          () => deleteSavedZone(accessToken, zone.id),
                          '생활권과 연결된 알림을 삭제했습니다.'
                        )
                      }
                      aria-label={`${zone.label} 생활권 삭제`}
                    >
                      <Trash2 className='h-4 w-4' aria-hidden='true' />
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby='alert-rules-title'>
              <h3
                id='alert-rules-title'
                className='flex items-center gap-2 text-sm font-semibold text-gray-900'
              >
                <BellRing className='h-4 w-4 text-violet-600' aria-hidden='true' />
                생활 알림
              </h3>
              {zones.length > 0 ? (
                <>
                  <div className='mt-2 grid grid-cols-2 gap-2'>
                    <Label className='sr-only' htmlFor='alert-zone'>
                      생활권
                    </Label>
                    <select
                      id='alert-zone'
                      value={selectedZoneId}
                      onChange={event => setSelectedZoneId(Number(event.target.value))}
                      className='h-10 rounded-md border border-gray-300 bg-white px-2 text-sm'
                    >
                      {zones.map(zone => (
                        <option key={zone.id} value={zone.id}>
                          {zone.label}
                        </option>
                      ))}
                    </select>
                    <Label className='sr-only' htmlFor='alert-type'>
                      알림 조건
                    </Label>
                    <select
                      id='alert-type'
                      value={alertType}
                      onChange={event => setAlertType(event.target.value as AlertRuleType)}
                      className='h-10 rounded-md border border-gray-300 bg-white px-2 text-sm'
                    >
                      {ALERT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type='button'
                    className='mt-2 w-full'
                    variant='outline'
                    disabled={isMutating || selectedZoneId === ''}
                    onClick={() =>
                      void mutate(async () => {
                        await createAlertSubscription(accessToken, {
                          zoneId: Number(selectedZoneId),
                          alertType,
                          activeDays: ALL_DAYS,
                          activeStart: null,
                          activeEnd: null,
                          quietStart: '22:00',
                          quietEnd: '07:00',
                          cooldownMinutes: 60,
                          active: true,
                        });
                        trackEvent('alert_rule_changed', { action_type: 'save' });
                      }, '알림 규칙을 만들었습니다. 기본 방해 금지는 22:00~07:00입니다.')
                    }
                  >
                    알림 규칙 추가
                  </Button>
                </>
              ) : (
                <p className='mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-500'>
                  알림을 만들려면 생활권을 먼저 저장하세요.
                </p>
              )}

              <div className='mt-2 space-y-2'>
                {subscriptions.map(subscription => (
                  <div
                    key={subscription.id}
                    className='flex items-center gap-2 rounded-xl border border-gray-200 p-3'
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium'>
                        {ALERT_TYPES.find(type => type.value === subscription.alertType)?.label ||
                          subscription.alertType}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {zones.find(zone => zone.id === subscription.zoneId)?.label || '생활권'} ·
                        방해 금지 {subscription.quietStart || '없음'}~
                        {subscription.quietEnd || '없음'}
                      </p>
                    </div>
                    <Button
                      type='button'
                      variant={subscription.active ? 'secondary' : 'outline'}
                      size='sm'
                      disabled={isMutating}
                      aria-pressed={subscription.active}
                      onClick={() =>
                        void mutate(
                          () =>
                            updateAlertSubscription(
                              accessToken,
                              subscription.id,
                              subscriptionRequest(subscription, !subscription.active)
                            ).then(() => undefined),
                          subscription.active ? '알림을 껐습니다.' : '알림을 켰습니다.'
                        )
                      }
                    >
                      {subscription.active ? '켜짐' : '꺼짐'}
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      disabled={isMutating}
                      onClick={() =>
                        void mutate(
                          () => deleteAlertSubscription(accessToken, subscription.id),
                          '알림 규칙을 삭제했습니다.'
                        )
                      }
                      aria-label='알림 규칙 삭제'
                    >
                      <Trash2 className='h-4 w-4' aria-hidden='true' />
                    </Button>
                  </div>
                ))}
              </div>

              {subscriptions.length > 0 && (
                <Button
                  type='button'
                  variant='outline'
                  className='mt-3 w-full'
                  disabled={isMutating}
                  onClick={() =>
                    void mutate(async () => {
                      const result = await evaluateAlertSubscriptions(accessToken);
                      setEvaluation(result);
                      if (user) {
                        await Promise.all([
                          fetchNotificationHistory(user.id, accessToken),
                          fetchUnreadCount(user.id, accessToken),
                        ]);
                      }
                    }, '현재 조건으로 알림을 확인했습니다.')
                  }
                >
                  지금 조건 확인
                </Button>
              )}
              {evaluation && (
                <p className='mt-2 text-xs text-gray-600' role='status'>
                  평가 {evaluation.evaluated}개 · 새 알림 {evaluation.generated}개 · 대기{' '}
                  {evaluation.deferred}개
                </p>
              )}
              <p className='mt-2 text-xs leading-5 text-gray-500'>
                현재는 인앱 알림만 생성합니다. 외부 푸시 제공자 연결은 마지막 배포 단계에서
                활성화합니다.
              </p>
            </section>
          </div>
        )}
      </aside>
    </>
  );
}
