/**
 * @fileoverview UI 컴포넌트 관련 타입 정의
 * @author Seoul Fit Team
 * @since 2.0.0
 */

import type { ReactNode, MouseEvent, KeyboardEvent, FocusEvent } from 'react';
import type { BaseComponentProps } from './common';
import type { Facility, ClusteredFacility } from './facility';
import type { User } from './user';

// ===== 기본 UI 타입 =====

// 크기 타입
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 색상 변형 타입
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

// 버튼 변형 타입
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

// 정렬 타입
export type Alignment = 'left' | 'center' | 'right';

// 방향 타입
export type Direction = 'horizontal' | 'vertical';

// 위치 타입
export type Position =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

// ===== 이벤트 핸들러 타입 =====

// 클릭 이벤트 핸들러
export type ClickHandler<T = HTMLElement> = (event: MouseEvent<T>) => void;

// 키보드 이벤트 핸들러
export type KeyboardHandler<T = HTMLElement> = (event: KeyboardEvent<T>) => void;

// 포커스 이벤트 핸들러
export type FocusHandler<T = HTMLElement> = (event: FocusEvent<T>) => void;

// 값 변경 핸들러
export type ChangeHandler<T = string> = (value: T) => void;

// ===== 컴포넌트 Props 타입 =====

// 버튼 Props
export interface ButtonProps extends BaseComponentProps {
  /** 버튼 변형 */
  variant?: ButtonVariant;
  /** 버튼 크기 */
  size?: Size;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 로딩 중 여부 */
  loading?: boolean;
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
  /** 아이콘 (왼쪽) */
  leftIcon?: ReactNode;
  /** 아이콘 (오른쪽) */
  rightIcon?: ReactNode;
  /** 클릭 핸들러 */
  onClick?: ClickHandler<HTMLButtonElement>;
  /** 자식 요소 */
  children: ReactNode;
}

// 입력 필드 Props
export interface InputProps extends BaseComponentProps {
  /** 입력 타입 */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** 입력값 */
  value?: string;
  /** 기본값 */
  defaultValue?: string;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 읽기 전용 여부 */
  readOnly?: boolean;
  /** 필수 입력 여부 */
  required?: boolean;
  /** 에러 상태 */
  error?: boolean;
  /** 에러 메시지 */
  errorMessage?: string;
  /** 도움말 텍스트 */
  helperText?: string;
  /** 라벨 */
  label?: string;
  /** 크기 */
  size?: Size;
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
  /** 값 변경 핸들러 */
  onChange?: ChangeHandler<string>;
  /** 포커스 핸들러 */
  onFocus?: FocusHandler<HTMLInputElement>;
  /** 블러 핸들러 */
  onBlur?: FocusHandler<HTMLInputElement>;
}

// 모달 Props
export interface ModalProps extends BaseComponentProps {
  /** 모달 열림 여부 */
  open: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 모달 제목 */
  title?: string;
  /** 모달 크기 */
  size?: Size;
  /** 배경 클릭으로 닫기 가능 여부 */
  closeOnBackdropClick?: boolean;
  /** ESC 키로 닫기 가능 여부 */
  closeOnEscape?: boolean;
  /** 자식 요소 */
  children: ReactNode;
}

// 드롭다운 Props
export interface DropdownProps extends BaseComponentProps {
  /** 드롭다운 열림 여부 */
  open: boolean;
  /** 드롭다운 열기/닫기 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 트리거 요소 */
  trigger: ReactNode;
  /** 드롭다운 내용 */
  children: ReactNode;
  /** 위치 */
  placement?: Position;
  /** 오프셋 */
  offset?: number;
}

// 토스트 Props
export interface ToastProps extends BaseComponentProps {
  /** 토스트 타입 */
  type?: ColorVariant;
  /** 토스트 제목 */
  title?: string;
  /** 토스트 메시지 */
  message: string;
  /** 자동 닫기 시간 (ms) */
  duration?: number;
  /** 닫기 가능 여부 */
  closable?: boolean;
  /** 닫기 핸들러 */
  onClose?: () => void;
  /** 액션 버튼 */
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ===== 지도 컴포넌트 Props =====

// 지도 컨테이너 Props
export interface MapContainerProps extends BaseComponentProps {
  /** 사용자 선호도 */
  preferences?: import('./user').UserPreferences;
  /** 선호도 토글 핸들러 */
  onPreferenceToggle?: (category: import('./facility').FacilityCategory) => void;
  /** 지도 클릭 핸들러 */
  onMapClick?: () => void;
  /** 위치 리셋 핸들러 */
  onLocationReset?: () => void;
}

// 시설 카드 Props
export interface FacilityCardProps extends BaseComponentProps {
  /** 시설 정보 */
  facility: Facility;
  /** 선택된 상태 */
  selected?: boolean;
  /** 클릭 핸들러 */
  onClick?: (facility: Facility) => void;
  /** 즐겨찾기 토글 핸들러 */
  onBookmarkToggle?: (facility: Facility) => void;
  /** 즐겨찾기 상태 */
  bookmarked?: boolean;
}

// 클러스터 카드 Props
export interface ClusterCardProps extends BaseComponentProps {
  /** 클러스터 정보 */
  cluster: ClusteredFacility;
  /** 클릭 핸들러 */
  onClick?: (cluster: ClusteredFacility) => void;
}

// 검색 입력 Props
export interface SearchInputProps extends BaseComponentProps {
  /** 검색 쿼리 */
  value: string;
  /** 검색 쿼리 변경 핸들러 */
  onChange: ChangeHandler<string>;
  /** 검색 실행 핸들러 */
  onSearch: (query: string) => void;
  /** 검색 초기화 핸들러 */
  onClear: () => void;
  /** 로딩 중 여부 */
  loading?: boolean;
  /** 플레이스홀더 */
  placeholder?: string;
}

// 필터 Props
export interface FilterProps extends BaseComponentProps {
  /** 선택된 카테고리 */
  selectedCategories: import('./facility').FacilityCategory[];
  /** 카테고리 변경 핸들러 */
  onCategoryChange: (categories: import('./facility').FacilityCategory[]) => void;
  /** 검색 반경 */
  radius: number;
  /** 반경 변경 핸들러 */
  onRadiusChange: (radius: number) => void;
  /** 필터 리셋 핸들러 */
  onReset: () => void;
}

// ===== 레이아웃 컴포넌트 Props =====

// 헤더 Props
export interface HeaderProps extends BaseComponentProps {
  /** 사용자 정보 */
  user?: User;
  /** 검색 쿼리 */
  searchQuery: string;
  /** 검색 쿼리 변경 핸들러 */
  onSearchChange: ChangeHandler<string>;
  /** 검색 실행 핸들러 */
  onSearch: (query: string) => void;
  /** 검색 초기화 핸들러 */
  onSearchClear: () => void;
  /** 사이드바 토글 핸들러 */
  onSidebarToggle: () => void;
  /** 로그인 핸들러 */
  onLogin: () => void;
  /** 로그아웃 핸들러 */
  onLogout: () => void;
}

// 사이드바 Props
export interface SidebarProps extends BaseComponentProps {
  /** 사이드바 열림 여부 */
  open: boolean;
  /** 사이드바 닫기 핸들러 */
  onClose: () => void;
  /** 사용자 정보 */
  user?: User;
  /** 사용자 선호도 */
  preferences?: import('./user').UserPreferences;
  /** 선호도 토글 핸들러 */
  onPreferenceToggle?: (category: import('./facility').FacilityCategory) => void;
  /** 로그인 핸들러 */
  onLogin: () => void;
  /** 로그아웃 핸들러 */
  onLogout: () => void;
}

// 바텀시트 Props
export interface BottomSheetProps extends BaseComponentProps {
  /** 바텀시트 열림 여부 */
  open: boolean;
  /** 바텀시트 닫기 핸들러 */
  onClose: () => void;
  /** 바텀시트 제목 */
  title?: string;
  /** 스냅 포인트 */
  snapPoints?: number[];
  /** 초기 스냅 인덱스 */
  initialSnap?: number;
  /** 자식 요소 */
  children: ReactNode;
}

// ===== 상태 관리 타입 =====

// 로딩 상태 Props
export interface LoadingStateProps extends BaseComponentProps {
  /** 로딩 중 여부 */
  loading: boolean;
  /** 에러 메시지 */
  error?: string | null;
  /** 재시도 핸들러 */
  onRetry?: () => void;
  /** 로딩 메시지 */
  loadingMessage?: string;
  /** 에러 메시지 커스터마이징 */
  errorMessage?: string;
  /** 자식 요소 */
  children: ReactNode;
}

// 빈 상태 Props
export interface EmptyStateProps extends BaseComponentProps {
  /** 제목 */
  title: string;
  /** 설명 */
  description?: string;
  /** 아이콘 */
  icon?: ReactNode;
  /** 액션 버튼 */
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ===== 애니메이션 타입 =====

// 애니메이션 타입
export type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce' | 'flip' | 'zoom';

// 애니메이션 방향
export type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'in' | 'out';

// 애니메이션 Props
export interface AnimationProps {
  /** 애니메이션 타입 */
  type?: AnimationType;
  /** 애니메이션 방향 */
  direction?: AnimationDirection;
  /** 애니메이션 지속 시간 (ms) */
  duration?: number;
  /** 애니메이션 지연 시간 (ms) */
  delay?: number;
  /** 애니메이션 반복 횟수 */
  repeat?: number;
  /** 애니메이션 이징 */
  easing?: string;
}
