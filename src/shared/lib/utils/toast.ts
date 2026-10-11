/**
 * 토스트 API. 구현은 `sonner`이고 호스트는 `src/shared/ui/toaster.tsx`의 `<AppToaster />`다.
 * 토스트는 사소한 확인용이다. 복구가 필요한 오류(위치 거부·지도 실패·API 오류)는
 * 자동으로 사라지는 토스트 대신 인라인 배너 + 복구 버튼으로 알린다.
 */
import { toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  /** 표시 시간(ms). 생략하면 유형별 기본값을 쓴다. */
  duration?: number;
}

export const TOAST_DURATION_MS: Record<ToastType, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 5000,
};

function show(message: string, type: ToastType, duration?: number) {
  return sonnerToast[type](message, { duration: duration ?? TOAST_DURATION_MS[type] });
}

export const toast = {
  success: (message: string, options?: ToastOptions) => show(message, 'success', options?.duration),
  error: (message: string, options?: ToastOptions) => show(message, 'error', options?.duration),
  info: (message: string, options?: ToastOptions) => show(message, 'info', options?.duration),
  warning: (message: string, options?: ToastOptions) => show(message, 'warning', options?.duration),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};

export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  return show(message, type, duration);
}

export function showSuccessToast(message: string, duration?: number) {
  return show(message, 'success', duration);
}

export function showErrorToast(message: string, duration?: number) {
  return show(message, 'error', duration);
}

export function showWarningToast(message: string, duration?: number) {
  return show(message, 'warning', duration);
}
