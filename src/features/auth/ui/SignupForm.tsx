/**
 * @fileoverview Auth Signup Form UI
 * @description 회원가입 폼 UI 컴포넌트 (관심사 선택)
 */

'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { FACILITY_CONFIGS } from '@/shared/lib/icons/facility';
import type { UserInfo } from '../model/types';

interface SignupFormProps {
  userInfo: UserInfo;
  onSignUp: (interests: string[]) => Promise<void>;
}

// 관심사 옵션 (기존 코드에서 가져옴)
const INTEREST_OPTIONS = [
  { value: 'SPORTS', category: 'sports' as const },
  { value: 'CULTURE', category: 'culture' as const },
  { value: 'RESTAURANTS', category: 'restaurant' as const },
  { value: 'LIBRARY', category: 'library' as const },
  { value: 'PARK', category: 'park' as const },
  { value: 'BIKE', category: 'bike' as const },
  { value: 'COOLING_SHELTER', category: 'cooling_shelter' as const },
  { value: 'CULTURAL_EVENT', category: 'cultural_event' as const },
  { value: 'CULTURAL_RESERVATION', category: 'cultural_reservation' as const },
];

export const SignupForm = ({ userInfo, onSignUp }: SignupFormProps) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInterestChange = (value: string) => {
    setSelectedInterests(prev =>
      prev.includes(value) 
        ? prev.filter(item => item !== value) 
        : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onSignUp(selectedInterests);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">관심사 선택</h2>
          <p className="text-gray-600">관심사를 선택하여 맞춤 정보를 받아보세요</p>
          <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {selectedInterests.length}개 선택
          </div>
        </div>

        <div className="mb-8">
          <div className="space-y-3">
            {INTEREST_OPTIONS.map((option) => {
              const config = FACILITY_CONFIGS[option.category];
              const isSelected = selectedInterests.includes(option.value);

              return (
                <div
                  key={option.value}
                  className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] ${
                    isSelected
                      ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                  onClick={() => handleInterestChange(option.value)}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110`}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 group-hover:text-gray-900 text-base transition-colors duration-200">
                        {config.label}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        {config.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white scale-110'
                        : 'border-gray-300 group-hover:border-gray-400 group-hover:scale-105'
                    }`}
                  >
                    <Check
                      className={`w-4 h-4 transition-all duration-200 ${
                        isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={selectedInterests.length === 0 || isLoading}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
        >
          {isLoading ? '처리중...' : '회원가입 완료'}
        </button>

        <p className="text-sm text-gray-500 text-center mt-4">
          최소 1개 이상의 관심사를 선택해주세요
        </p>
      </div>
    </div>
  );
};
