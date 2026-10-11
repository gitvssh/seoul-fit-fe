'use client';

import * as React from 'react';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { cn } from '@/shared/lib/utils';

/**
 * 카카오 로그인 디자인 가이드(https://developers.kakao.com/docs/ko/kakaologin/design-guide)의
 * 컨테이너·라벨 색. 디자인 시스템에서 hex 리터럴이 허용되는 유일한 예외다.
 */
const KAKAO_CONTAINER_COLOR = '#FEE500';
const KAKAO_LABEL_COLOR = '#191919';

export interface KakaoLoginButtonProps {
  onClick: () => void;
  /** 버튼 라벨이자 접근성 이름. 생략하면 `sidebar.login` 문구 */
  label?: string;
  className?: string;
  /** default 44px, lg 48px */
  size?: 'default' | 'lg';
  disabled?: boolean;
}

function KakaoSymbol({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      width='18'
      height='18'
      fill='currentColor'
      aria-hidden='true'
      focusable='false'
      className={className}
    >
      <path d='M12 3C6.48 3 2 6.58 2 11c0 2.84 1.86 5.33 4.66 6.74l-.98 3.6c-.09.33.28.6.57.41l4.29-2.86c.48.07.97.11 1.46.11 5.52 0 10-3.58 10-8S17.52 3 12 3Z' />
    </svg>
  );
}

export function KakaoLoginButton({
  onClick,
  label,
  className,
  size = 'default',
  disabled,
}: KakaoLoginButtonProps) {
  const { t } = useI18n();
  const text = label ?? t('sidebar.login');

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label={text}
      data-slot='kakao-login-button'
      style={{ backgroundColor: KAKAO_CONTAINER_COLOR, color: KAKAO_LABEL_COLOR }}
      className={cn(
        'inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg px-4 font-medium outline-none transition-[filter,opacity] duration-fast ease-standard hover:brightness-95 active:brightness-90 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        size === 'lg' ? 'h-12 text-body' : 'h-11 text-body-sm',
        className
      )}
    >
      <KakaoSymbol />
      <span>{text}</span>
    </button>
  );
}
