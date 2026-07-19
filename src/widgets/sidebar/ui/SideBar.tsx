// components/layout/SideBar.tsx - Improved version with better animations
'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Check, LogOut, Settings, User } from 'lucide-react';
import { X } from 'lucide-react';
import type { UserPreferences, FacilityCategory } from '@/lib/types';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import { useAuthStore } from '@/shared/model/authStore';
import WarningModal from '@/shared/ui/warning-modal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onPreferenceToggle: (type: FacilityCategory) => void;
  onLogin?: () => void;
  onLogout?: () => void;
  onPreferencesRefresh?: () => void;
  showWarning?: boolean;
  onWarningClose?: () => void;
}

export default function SideBar({
  isOpen,
  onClose,
  preferences,
  onPreferenceToggle,
  onLogin,
  onLogout,
  onPreferencesRefresh,
  showWarning,
  onWarningClose,
}: SidebarProps) {
  const { isAuthenticated, user } = useAuthStore();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 사이드바 열릴 때 사용자 관심사 조회 (디바운싱 적용 및 중복 호출 방지)
  useEffect(() => {
    if (isOpen && isAuthenticated && onPreferencesRefresh) {
      const timeoutId = setTimeout(() => {
        onPreferencesRefresh();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isAuthenticated]); // onPreferencesRefresh 의존성 제거

  // 키보드 접근성 및 포커스 관리
  useEffect(() => {
    if (isOpen) {
      // 사이드바가 열리면 첫 번째 포커스 가능한 요소에 포커스
      const focusableElements = sidebarRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }

      // ESC 키로 닫기
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // 선택된 항목 수 계산 (메모화)
  const selectedCount = React.useMemo(
    () => Object.values(preferences).filter(Boolean).length,
    [preferences]
  );

  // 선호도 토글 핸들러 (최적화)
  const handleToggle = useCallback(
    (type: FacilityCategory) => {
      onPreferenceToggle(type);
    },
    [onPreferenceToggle]
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

  return (
    <>
      {/* 오버레이 배경 (개선된 애니메이션) */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 bg-black transition-all duration-300 ease-out z-[59] ${
          isOpen
            ? 'opacity-30 backdrop-blur-sm'
            : 'opacity-0 pointer-events-none backdrop-blur-none'
        }`}
        onClick={handleOverlayClick}
        aria-hidden='true'
      />

      {/* 사이드바 (개선된 애니메이션과 접근성) */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 right-0 z-[60] w-80 max-w-[85vw] md:w-96 bg-white border-l border-gray-200 shadow-2xl transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
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
                  선호도 설정
                </h2>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium transition-colors'>
                  {selectedCount}개 선택
                </div>
                <button
                  onClick={onClose}
                  className='p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  aria-label='메뉴 닫기'
                >
                  <X className='w-5 h-5 text-gray-600' />
                </button>
              </div>
            </div>

            {/* 로그인 영역 */}
            {!isAuthenticated ? (
              <button
                onClick={onLogin}
                className='w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-yellow-600 transform hover:scale-[1.02] active:scale-[0.98]'
              >
                <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z' />
                </svg>
                <span>카카오로 로그인</span>
              </button>
            ) : (
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 transition-colors duration-200'>
                <div className='flex items-center space-x-3'>
                  {user?.profileImageUrl ? (
                    <Image
                      src={user.profileImageUrl}
                      alt='프로필'
                      width={40}
                      height={40}
                      className='w-10 h-10 rounded-full ring-2 ring-blue-200'
                    />
                  ) : (
                    <div className='w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center'>
                      <User className='w-5 h-5 text-white' />
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-gray-900 truncate'>
                      {user?.nickname || '사용자'}
                    </p>
                    <p id='sidebar-description' className='text-xs text-gray-500 mt-1'>
                      관심사를 선택하여 맞춤 정보를 받아보세요
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 선호도 목록 (개선된 스크롤과 애니메이션) */}
          <div
            className='flex-1 p-6 overflow-y-auto overscroll-contain'
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className='space-y-3'>
              {Object.keys(FACILITY_CONFIGS).map((type, index) => {
                const facilityType = type as FacilityCategory;
                const config = FACILITY_CONFIGS[facilityType];
                const isSelected = preferences.preferredCategories?.includes(facilityType) ?? false;

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
                          {config.label}
                        </h3>
                        <p className='text-sm text-gray-500 mt-1 leading-relaxed'>
                          {config.description}
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
            {isAuthenticated ? (
              <div className='flex items-center justify-between'>
                <button className='flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400'>
                  <User className='w-4 h-4' />
                  <span>프로필 설정</span>
                </button>
                <button
                  onClick={onLogout}
                  className='flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors duration-200 p-2 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400'
                >
                  <LogOut className='w-4 h-4' />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <div className='text-center'>
                <p className='text-sm text-gray-500 leading-relaxed'>
                  로그인하면 더 많은 기능을 이용할 수 있어요
                </p>
              </div>
            )}
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
