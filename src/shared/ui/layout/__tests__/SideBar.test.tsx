import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import SideBar from '../SideBar';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { ThemeProvider } from '@/shared/lib/theme';
import { installMatchMedia } from '@/shared/lib/testing/match-media';
import type { FacilityCategory } from '@/lib/types';

interface HarnessProps {
  activeCategories?: FacilityCategory[];
  onCategoryToggle?: (type: FacilityCategory) => void;
  onNavigate?: (href: string) => void;
}

function Harness({
  activeCategories = ['park'],
  onCategoryToggle = () => undefined,
  onNavigate,
}: HarnessProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <ThemeProvider>
      <I18nProvider>
        <button type='button' onClick={() => setOpen(true)}>
          Open menu
        </button>
        <SideBar
          isOpen={open}
          onClose={() => setOpen(false)}
          activeCategories={activeCategories}
          onCategoryToggle={onCategoryToggle}
          onNavigate={onNavigate}
        />
      </I18nProvider>
    </ThemeProvider>
  );
}

function openMenu() {
  const opener = screen.getByRole('button', { name: 'Open menu' });
  opener.focus();
  fireEvent.click(opener);
  return opener;
}

describe('SideBar accessibility', () => {
  beforeEach(() => {
    installMatchMedia(false);
    window.localStorage.clear();
  });

  it('removes the closed dialog from the accessibility tree and restores focus', async () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const opener = openMenu();
    const dialog = screen.getByRole('dialog', { name: '설정' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: '메뉴 닫기' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('keeps Tab inside the dialog in both directions', () => {
    render(<Harness />);
    openMenu();
    const close = screen.getByRole('button', { name: '메뉴 닫기' });
    const last = screen.getByRole('link', { name: /GitHub 저장소/ });

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('closes from the close button and returns focus to the opener', async () => {
    render(<Harness />);
    const opener = openMenu();
    fireEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
  });
});

describe('SideBar settings sections', () => {
  beforeEach(() => {
    installMatchMedia(false);
    window.localStorage.clear();
  });

  it('lists the sections with their headings', () => {
    render(<Harness />);
    openMenu();
    for (const name of ['계정', '지도 마커 설정', '화면 테마', '언어', '둘러보기']) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: '카카오 로그인' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '장소 둘러보기' })).toHaveAttribute('href', '/places');
    expect(screen.getByRole('link', { name: '서비스 소개' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: /GitHub 저장소/ })).toHaveAttribute(
      'href',
      'https://github.com/gitvssh/seoul-fit-fe'
    );
  });

  it('shows marker categories as labelled checkboxes with a selection summary', () => {
    const onCategoryToggle = jest.fn();
    render(<Harness onCategoryToggle={onCategoryToggle} />);
    openMenu();
    const section = screen.getByRole('region', { name: '지도 마커 설정' });

    const park = within(section).getByRole('checkbox', { name: '공원' });
    expect(park).toBeChecked();
    expect(park).toHaveAccessibleDescription('도시공원, 산책로, 쉼터 등');
    expect(within(section).getByRole('checkbox', { name: '지하철' })).not.toBeChecked();
    expect(within(section).getByText('1개 선택')).toBeInTheDocument();

    fireEvent.click(park);
    expect(onCategoryToggle).toHaveBeenCalledWith('park');

    fireEvent.click(within(section).getByText('지하철'));
    expect(onCategoryToggle).toHaveBeenCalledWith('subway');
  });

  it('selects every unselected category with "모두 선택" and clears the selected ones with "모두 해제"', () => {
    const onCategoryToggle = jest.fn();
    render(<Harness onCategoryToggle={onCategoryToggle} />);
    openMenu();
    const section = screen.getByRole('region', { name: '지도 마커 설정' });

    fireEvent.click(within(section).getByRole('button', { name: '모두 선택' }));
    expect(onCategoryToggle).toHaveBeenCalledTimes(7);
    expect(onCategoryToggle).not.toHaveBeenCalledWith('park');

    onCategoryToggle.mockClear();
    fireEvent.click(within(section).getByRole('button', { name: '모두 해제' }));
    expect(onCategoryToggle).toHaveBeenCalledTimes(1);
    expect(onCategoryToggle).toHaveBeenCalledWith('park');
  });

  it('switches the theme and enables the dark-map switch only in the dark theme', () => {
    render(<Harness />);
    openMenu();
    const mapDark = screen.getByRole('switch', { name: '지도도 어둡게' });
    expect(mapDark).toBeDisabled();
    expect(mapDark).toHaveAccessibleDescription('다크 테마일 때 지도 타일을 어둡게 바꿉니다.');

    const themeGroup = screen.getByRole('group', { name: '화면 테마' });
    fireEvent.click(within(themeGroup).getByRole('button', { name: '다크' }));
    expect(within(themeGroup).getByRole('button', { name: '다크' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(document.documentElement).toHaveClass('dark');
    expect(mapDark).toBeEnabled();

    fireEvent.click(mapDark);
    expect(mapDark).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-map-dark', 'true');
  });

  it('switches the language with fixed labels and announces the change', () => {
    render(<Harness />);
    openMenu();
    const languageGroup = screen.getByRole('group', { name: '언어' });
    const english = within(languageGroup).getByRole('button', { name: 'English' });
    expect(english).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(english);
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(within(languageGroup).getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent(
      'Language changed to English.'
    );
  });

  it('reports internal link clicks through onNavigate', () => {
    const onNavigate = jest.fn();
    render(<Harness onNavigate={onNavigate} />);
    openMenu();
    fireEvent.click(screen.getByRole('link', { name: '장소 둘러보기' }));
    expect(onNavigate).toHaveBeenCalledWith('/places');
  });
});
