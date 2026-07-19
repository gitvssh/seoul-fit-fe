// services/user.ts - User management service implementation
import { UserResult, UserInterests } from '@/lib/types';
import { env } from '@/config/environment';

const BASE_URL = env.publicBackendUrl;

export interface UpdateUserRequest {
  nickname?: string;
  profileImageUrl?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  interests?: UserInterests[];
}

export interface UserInterestRequest {
  userId: number;
  interests: UserInterests[];
}

/**
 * 사용자 조회
 */
export async function getUser(userId: number, accessToken: string): Promise<UserResult> {
  const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`사용자 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 내 정보 조회
 */
export async function getMyInfo(oauthUserId: string, oauthProvider: string, accessToken: string): Promise<UserResult> {
  const response = await fetch(`${BASE_URL}/api/users/me?oauthUserId=${oauthUserId}&oauthProvider=${oauthProvider}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`내 정보 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 사용자 정보 수정
 */
export async function updateUser(
  userId: number,
  updateData: UpdateUserRequest,
  accessToken: string
): Promise<UserResult> {
  const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(`사용자 정보 수정 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 사용자 삭제
 */
export async function deleteUser(userId: number, accessToken: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`사용자 삭제 실패: ${response.status}`);
  }
}

/**
 * 사용자 관심사 조회
 */
export async function getUserInterests(userId: number, accessToken: string) {
  const response = await fetch(`${BASE_URL}/api/users/interests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userId),
  });

  if (!response.ok) {
    throw new Error(`사용자 관심사 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 사용자 관심사 변경
 */
export async function updateUserInterests(request: UserInterestRequest, accessToken: string) {
  const response = await fetch(`${BASE_URL}/api/users/interests`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`사용자 관심사 변경 실패: ${response.status}`);
  }

  return response.json();
}
