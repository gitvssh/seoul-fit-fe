/**
 * @fileoverview Home Page
 * @description 홈 페이지 (지도 메인 화면)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { MapContainer } from '@/widgets/map-container';
import { Header } from '@/widgets/header';
import { SideBar } from '@/widgets/sidebar';
import type { UserPreferences, FacilityCategory } from '@/lib/types';

interface HomePageProps {
  initialPreferences?: UserPreferences;
}

export const HomePage: React.FC<HomePageProps> = ({ initialPreferences }) => {
  const [showSidebar, setShowSidebar] = useState(false);

  // 사용자 선호도 상태 관리
  const [preferences, setPreferences] = useState<UserPreferences>(
    initialPreferences || {
      language: 'ko',
      theme: 'light',
      preferredCategories: [
        'sports',
        'culture',
        'restaurant',
        'library',
        'park',
      ] as FacilityCategory[],
    }
  );

  // 카테고리 토글 핸들러
  const handlePreferenceToggle = useCallback((category: FacilityCategory) => {
    setPreferences(prev => {
      const currentCategories = prev.preferredCategories || [];
      const isSelected = currentCategories.includes(category);

      const newCategories = isSelected
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category];

      console.log('카테고리 토글:', category, '새로운 카테고리:', newCategories);

      return {
        ...prev,
        preferredCategories: newCategories,
      };
    });
  }, []);

  return (
    <div className='h-screen flex flex-col'>
      <Header
        searchQuery=''
        onSearchChange={() => {}}
        onMenuClick={() => setShowSidebar(!showSidebar)}
      />
      <div className='flex-1 relative'>
        <MapContainer
          preferences={preferences}
          onPreferenceToggle={handlePreferenceToggle}
          initialCenter={{ lat: 37.5665, lng: 126.978 }}
          initialZoom={3}
        />
        <SideBar
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          activeCategories={
            Object.keys(preferences).filter(
              key => preferences[key as keyof typeof preferences]
            ) as FacilityCategory[]
          }
          onCategoryToggle={handlePreferenceToggle}
        />
      </div>
    </div>
  );
};

// Next.js pages 라우터용 default export
export default HomePage;
