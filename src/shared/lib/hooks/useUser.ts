// hooks/useUser.ts - User management hook
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/shared/model/authStore';
import * as userService from '@/shared/api/user';
import { UserResult, UserInterests } from '@/lib/types';

export interface UseUserReturn {
  // State
  user: UserResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  getUser: (userId: number) => Promise<UserResult>;
  getMyInfo: () => Promise<UserResult>;
  updateUser: (userId: number, updateData: userService.UpdateUserRequest) => Promise<UserResult>;
  deleteUser: (userId: number) => Promise<void>;
  getUserInterests: () => Promise<unknown>;
  updateUserInterests: (interests: UserInterests[]) => Promise<unknown>;

  // Clear functions
  clearUser: () => void;
  clearError: () => void;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuthStore();

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUser = useCallback(
    async (userId: number): Promise<UserResult> => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const userData = await userService.getUser(userId, accessToken);
        setUser(userData);
        return userData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '사용자 조회에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  const getMyInfo = useCallback(
    async (): Promise<UserResult> => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const userData = await userService.getMyInfo(accessToken);
        setUser(userData);
        return userData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '내 정보 조회에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  const updateUser = useCallback(
    async (userId: number, updateData: userService.UpdateUserRequest): Promise<UserResult> => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const updatedUser = await userService.updateUser(userId, updateData, accessToken);
        setUser(updatedUser);
        return updatedUser;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '사용자 정보 수정에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  const deleteUser = useCallback(
    async (userId: number): Promise<void> => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      setIsLoading(true);
      setError(null);

      try {
        await userService.deleteUser(userId, accessToken);
        setUser(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '사용자 삭제에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  const getUserInterests = useCallback(
    async () => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const interests = await userService.getUserInterests(accessToken);
        return interests;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '사용자 관심사 조회에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  const updateUserInterests = useCallback(
    async (interests: UserInterests[]) => {
      if (!accessToken) {
        throw new Error('인증 토큰이 없습니다.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await userService.updateUserInterests({ interests }, accessToken);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : '사용자 관심사 변경에 실패했습니다.';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  return {
    user,
    isLoading,
    error,
    getUser,
    getMyInfo,
    updateUser,
    deleteUser,
    getUserInterests,
    updateUserInterests,
    clearUser,
    clearError,
  };
}
