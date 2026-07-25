import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SideBar from '../SideBar';
import { I18nProvider } from '@/shared/i18n/I18nProvider';

function Harness() {
  const [open, setOpen] = React.useState(false);
  return (
    <I18nProvider>
      <button type='button' onClick={() => setOpen(true)}>
        Open menu
      </button>
      <SideBar
        isOpen={open}
        onClose={() => setOpen(false)}
        activeCategories={['park']}
        onCategoryToggle={() => undefined}
      />
    </I18nProvider>
  );
}

describe('SideBar accessibility', () => {
  it('removes the closed dialog from the accessibility tree and restores focus', () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open menu' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: '지도 마커 설정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '메뉴 닫기' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
