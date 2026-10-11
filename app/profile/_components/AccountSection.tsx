'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { deleteUser } from '@/shared/api/user';
import { useAuthStore } from '@/shared/model/authStore';
import { useKakaoLogin } from '@/shared/lib/hooks/useKakaoLogin';
import { toast } from '@/shared/lib/utils/toast';
import { useI18n } from '@/shared/i18n/I18nProvider';
import { LogoutModal } from '@/features/auth';

/** Logout (same confirmation flow as the map) and an inline, two-step account deletion. */
export function AccountSection() {
  const { t } = useI18n();
  const router = useRouter();
  const { logout } = useKakaoLogin();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    setConfirmLogout(false);
    await logout();
    router.push('/');
  };

  const handleDelete = async () => {
    const { user, accessToken, clearAuth } = useAuthStore.getState();
    if (!user?.id || !accessToken) {
      toast.error(t('profile.account.noUser'));
      return;
    }
    setDeleting(true);
    try {
      await deleteUser(user.id, accessToken);
      clearAuth();
      localStorage.removeItem('kakao_auth_token');
      localStorage.removeItem('refresh_token');
      toast.success(t('profile.account.deleted'));
      router.push('/');
    } catch (error) {
      console.error('account deletion failed', error);
      toast.error(t('profile.account.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section
      aria-labelledby='account-heading'
      className='rounded-xl border border-border bg-card p-6 shadow-float-sm'
    >
      <h2 id='account-heading' className='text-section text-foreground'>
        {t('profile.account.title')}
      </h2>
      <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
        <Button variant='outline' size='lg' onClick={() => setConfirmLogout(true)}>
          <LogOut aria-hidden='true' />
          {t('profile.account.logout')}
        </Button>
        <Button
          variant='ghost'
          size='lg'
          className='text-destructive hover:text-destructive'
          aria-expanded={confirmDelete}
          aria-controls='delete-account-panel'
          onClick={() => setConfirmDelete(current => !current)}
        >
          <Trash2 aria-hidden='true' />
          {t('profile.account.delete')}
        </Button>
      </div>
      {confirmDelete && (
        <div
          id='delete-account-panel'
          role='region'
          aria-label={t('profile.account.delete')}
          className='mt-4 rounded-lg border border-destructive/40 bg-muted p-4'
        >
          <p className='text-body-sm text-foreground'>{t('profile.account.deleteDescription')}</p>
          <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
            <Button variant='destructive' onClick={handleDelete} disabled={deleting}>
              {t('profile.account.deleteConfirm')}
            </Button>
            <Button variant='outline' onClick={() => setConfirmDelete(false)} disabled={deleting}>
              {t('profile.account.deleteCancel')}
            </Button>
          </div>
        </div>
      )}
      <LogoutModal
        showLogoutModal={confirmLogout}
        showLogoutSuccess={false}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
    </section>
  );
}
