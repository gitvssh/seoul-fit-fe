// TEMP STUB — replaced at integration by the recommend branch
'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from './button';

export interface KakaoLoginButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  size?: 'default' | 'lg';
}

export function KakaoLoginButton({
  onClick,
  label = '카카오 로그인',
  className,
  size = 'default',
}: KakaoLoginButtonProps) {
  return (
    <Button
      type='button'
      variant='secondary'
      size={size}
      className={cn('w-full', className)}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
