import { fireEvent, render, screen } from '@testing-library/react';
import WarningModal from '../warning-modal';
import { I18nProvider } from '@/shared/i18n/I18nProvider';

function renderModal(isOpen = true) {
  const onClose = jest.fn();
  render(
    <I18nProvider>
      <WarningModal isOpen={isOpen} onClose={onClose} />
    </I18nProvider>
  );
  return onClose;
}

describe('WarningModal', () => {
  it('renders nothing while closed', () => {
    renderModal(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('explains the rule in a modal dialog and closes from the confirm button', () => {
    const onClose = renderModal();
    const dialog = screen.getByRole('dialog', { name: '카테고리를 하나 이상 선택해 주세요' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(
      '지도에 장소를 표시하려면 카테고리가 최소 하나 필요합니다.'
    );
    const confirm = screen.getByRole('button', { name: '확인' });
    expect(confirm).toHaveFocus();

    fireEvent.click(confirm);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    const onClose = renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
