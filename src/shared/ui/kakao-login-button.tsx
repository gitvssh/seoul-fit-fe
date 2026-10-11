'use client';

import { cn } from '@/shared/lib/utils';

export interface KakaoLoginButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

/**
 * Kakao login button following the Kakao Login design guide: brand yellow
 * #FEE500, near-black label, 12px radius and the speech-bubble symbol. The
 * brand colours are the one sanctioned exception to the token-only rule.
 */
export function KakaoLoginButton({
  onClick,
  label = '카카오로 로그인',
  className,
}: KakaoLoginButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-5 text-body font-medium text-[#191919] outline-none transition-[filter] duration-fast ease-standard hover:brightness-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      <svg aria-hidden='true' viewBox='0 0 24 24' className='size-5 shrink-0' fill='currentColor'>
        <path d='M12 3C6.48 3 2 6.58 2 10.98c0 2.83 1.86 5.31 4.66 6.72l-1.19 4.4a.3.3 0 0 0 .46.33l5.14-3.43c.3.03.61.04.93.04 5.52 0 10-3.58 10-8.06S17.52 3 12 3Z' />
      </svg>
      {label}
    </button>
  );
}
