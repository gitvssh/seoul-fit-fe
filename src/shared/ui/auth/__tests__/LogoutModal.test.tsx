import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import LogoutModal from '../LogoutModal';
import { I18nProvider } from '@/shared/i18n/I18nProvider';

function renderModal(overrides: Partial<React.ComponentProps<typeof LogoutModal>> = {}) {
  const props = {
    showLogoutModal: true,
    showLogoutSuccess: false,
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    ...overrides,
  };
  render(
    <I18nProvider>
      <LogoutModal {...props} />
    </I18nProvider>
  );
  return props;
}

describe('LogoutModal', () => {
  it('renders nothing while closed', () => {
    renderModal({ showLogoutModal: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a modal dialog with focus on the cancel button', () => {
    const { onConfirm } = renderModal();
    const dialog = screen.getByRole('dialog', { name: '로그아웃할까요?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(
      '로그아웃하면 이 기기의 지도 마커 설정이 기본값으로 돌아갑니다.'
    );
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel from the cancel button and from Escape', () => {
    const { onCancel } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('shows the signed-out status while the parent redirects', () => {
    renderModal({ showLogoutModal: false, showLogoutSuccess: true });
    const dialog = screen.getByRole('dialog', { name: '로그아웃했습니다' });
    const status = within(dialog).getByRole('status');
    expect(status).toHaveTextContent('로그아웃했습니다');
    expect(status).toHaveTextContent('홈으로 이동합니다.');
    expect(within(dialog).queryByRole('button')).not.toBeInTheDocument();
  });
});
