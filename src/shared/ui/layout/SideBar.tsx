// components/layout/SideBar.tsx - Improved version with better animations
'use client';

import React, { useCallback, useRef } from 'react';
import Image from 'next/image';
import { Check, LogOut, Settings, User } from 'lucide-react';
import { X } from 'lucide-react';
import type { FacilityCategory } from '@/lib/types';
import { FACILITY_CATEGORIES } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import { useAuthStore } from '@/shared/model/authStore';
import WarningModal from '@/shared/ui/warning-modal';
import { useFocusTrap } from '@/shared/lib/hooks/useFocusTrap';
import { useI18n } from '@/shared/i18n/I18nProvider';
import type { MessageKey } from '@/shared/i18n/messages';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategories: FacilityCategory[];
  onCategoryToggle: (type: FacilityCategory) => void;
  onLogin?: () => void;
  onLogout?: () => void;
  showWarning?: boolean;
  onWarningClose?: () => void;
}

export default function SideBar({
  isOpen,
  onClose,
  activeCategories,
  onCategoryToggle,
  onLogin,
  onLogout,
  showWarning,
  onWarningClose,
}: SidebarProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { t } = useI18n();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sidebarRef, isOpen, onClose);

  // 선택된 항목 수 계산 (메모화)
  const selectedCount = React.useMemo(
    () => activeCategories.length,
    [activeCategories]
  );

  // 카테고리 토글 핸들러 (최적화)
  const handleToggle = useCallback(
    (type: FacilityCategory) => {
      onCategoryToggle(type);
    },
    [onCategoryToggle]
  );

  // 키보드 접근성을 위한 핸들러
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, type: FacilityCategory) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle(type);
      }
    },
    [handleToggle]
  );

  // 오버레이 클릭 핸들러 (이벤트 버블링 방지)
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // 사이드바 클릭 시 이벤트 전파 방지
  const handleSidebarClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) {
    return <WarningModal isOpen={showWarning || false} onClose={onWarningClose || (() => {})} />;
  }

  return (
    <>
      {/* 오버레이 배경 (개선된 애니메이션) */}
      <div
        ref={overlayRef}
        className='fixed inset-0 z-[59] bg-black opacity-30 backdrop-blur-sm'
        onClick={handleOverlayClick}
        aria-hidden='true'
      />

      {/* 사이드바 (개선된 애니메이션과 접근성) */}
      <aside
        ref={sidebarRef}
        className='fixed inset-y-0 right-0 z-[60] w-80 max-w-[85vw] md:w-96 bg-white border-l border-gray-200 shadow-2xl'
        onClick={handleSidebarClick}
        role='dialog'
        aria-modal='true'
        aria-labelledby='sidebar-title'
        aria-describedby='sidebar-description'
      >
        <div className='h-full flex flex-col'>
          {/* 헤더 */}
          <div className='p-6 border-b border-gray-200 bg-gray-50'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-3'>
                <Settings className='w-6 h-6 text-gray-600' />
                <h2 id='sidebar-title' className='text-xl font-semibold text-gray-800'>
                  {t('sidebar.title')}
                </h2>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium transition-colors'>
                  {t('sidebar.selected', { count: selectedCount })}
                </div>
                <button
                  onClick={onClose}
                  className='p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  aria-label={t('sidebar.close')}
                >
                  <X className='w-5 h-5 text-gray-600' />
                </button>
              </div>
            </div>

            {/* 설명 영역 */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 transition-colors duration-200'>
              <p id='sidebar-description' className='text-sm text-gray-700'>
                {t('sidebar.description')}
              </p>
            </div>
          </div>

          {/* 카테고리 목록 (개선된 스크롤과 애니메이션) */}
          <div
            className='flex-1 p-6 overflow-y-auto overscroll-contain'
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className='space-y-3'>
              {/* 카테고리 순서 재정의 및 필터링 */}
              {[
                FACILITY_CATEGORIES.SUBWAY,
                FACILITY_CATEGORIES.BIKE,
                FACILITY_CATEGORIES.LIBRARY,
                FACILITY_CATEGORIES.PARK,
                FACILITY_CATEGORIES.COOLING_SHELTER,
                FACILITY_CATEGORIES.CULTURE,
                FACILITY_CATEGORIES.CULTURAL_EVENT,
                FACILITY_CATEGORIES.CULTURAL_RESERVATION,
                // FACILITY_CATEGORIES.SPORTS - hidden 처리
                // FACILITY_CATEGORIES.RESTAURANT - 제거
              ].map((facilityType, index) => {
                const config = FACILITY_CONFIGS[facilityType];
                const isSelected = activeCategories.includes(facilityType);
                const categoryLabelKey = `category.${facilityType}` as MessageKey;
                const categoryDescriptionKey =
                  `categoryDescription.${facilityType}` as MessageKey;

                return (
                  <div
                    key={facilityType}
                    className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
                      isSelected
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onClick={() => handleToggle(facilityType)}
                    role='checkbox'
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={e => handleKeyDown(e, facilityType)}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: isOpen ? 'slideInRight 0.3s ease-out forwards' : 'none',
                    }}
                  >
                    {/* 시설 정보 */}
                    <div className='flex items-center space-x-4'>
                      <div
                        className={`w-14 h-14 rounded-full ${config.color} flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110`}
                      >
                        {config.icon}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-gray-800 group-hover:text-gray-900 text-base transition-colors duration-200'>
                          {t(categoryLabelKey)}
                        </h3>
                        <p className='text-sm text-gray-500 mt-1 leading-relaxed'>
                          {t(categoryDescriptionKey)}
                        </p>
                      </div>
                    </div>

                    {/* 체크박스 (개선된 애니메이션) */}
                    <div
                      className={`w-7 h-7 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white scale-110'
                          : 'border-gray-300 group-hover:border-gray-400 group-hover:scale-105'
                      }`}
                    >
                      <Check
                        className={`w-5 h-5 transition-all duration-200 ${
                          isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 푸터 (개선된 레이아웃) */}
          <div className='p-6 border-t border-gray-200 bg-gray-50'>
            <div className='flex items-center justify-between'>
              {isAuthenticated ? (
                <>
                  <div className='flex items-center space-x-3'>
                    {user?.profileImageUrl ? (
                      <Image
                        src={user.profileImageUrl}
                        alt={t('sidebar.profile')}
                        width={32}
                        height={32}
                        className='w-8 h-8 rounded-full'
                      />
                    ) : (
                      <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                        <User className='w-4 h-4 text-white' />
                      </div>
                    )}
                    <span className='text-sm font-medium text-gray-700'>
                      {user?.nickname || t('sidebar.defaultUser')}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className='flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors duration-200 p-2 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400'
                  >
                    <LogOut className='w-4 h-4' />
                    <span>{t('sidebar.logout')}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={onLogin}
                  className='w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-yellow-600'
                >
                  <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z' />
                  </svg>
                  <span>{t('sidebar.login')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      <WarningModal isOpen={showWarning || false} onClose={onWarningClose || (() => {})} />

      {/* 애니메이션 키프레임 추가 */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
