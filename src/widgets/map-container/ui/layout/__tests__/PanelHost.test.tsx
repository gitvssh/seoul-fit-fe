import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ClusteredFacility, Facility } from '@/lib/types';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { koMessages as labels } from '@/shared/i18n/messages';
import { MobileSheet, sheetVisibleHeight, type SheetSnap } from '../MobileSheet';
import { PanelHost, type PanelHostHandle } from '../PanelHost';

const place: Facility = {
  id: 'park',
  name: '서울 공원',
  category: 'park',
  address: '서울',
  position: { lat: 37.5665, lng: 126.978 },
  congestionLevel: 'low',
};
const mockFacility = {
  selectedFacility: null as Facility | null,
  selectedCluster: null as ClusteredFacility | null,
  clearSelection: jest.fn(),
  selectFacility: jest.fn(),
};
const mockMap = { setBottomInset: jest.fn(), revealPosition: jest.fn() };
const mockExplore = { isListOpen: false };
let mockDesktop = true;
jest.mock('../../providers/FacilityProvider', () => ({ useFacilityContext: () => mockFacility }));
jest.mock('../../providers/MapProvider', () => ({ useMapContext: () => mockMap }));
jest.mock('../../providers/ExploreProvider', () => ({ useExploreContext: () => mockExplore }));
jest.mock('@/shared/lib/hooks/useMediaQuery', () => ({
  useMediaQuery: () => mockDesktop,
  DESKTOP_QUERY: 'desktop',
}));
jest.mock('../../ExplorerPanelConnected', () => ({
  ExplorerPanelConnected: ({ compact, onLogin }: { compact: boolean; onLogin?: () => void }) => (
    <div data-testid='explorer' data-compact={compact}>
      <button onClick={onLogin}>로그인</button>
    </div>
  ),
}));
jest.mock('../../facility-detail/FacilityDetail', () => ({
  FacilityDetail: ({
    facility,
    onBack,
    compact,
  }: {
    facility: Facility;
    onBack: () => void;
    compact: boolean;
  }) => (
    <div data-testid='detail' data-compact={compact}>
      {facility.name}
      <button onClick={onBack}>돌아가기</button>
    </div>
  ),
}));

const originalResizeObserver = global.ResizeObserver;
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterAll(() => {
  global.ResizeObserver = originalResizeObserver;
});
beforeEach(() => {
  jest.clearAllMocks();
  mockDesktop = true;
  mockFacility.selectedFacility = null;
  mockFacility.selectedCluster = null;
  mockExplore.isListOpen = false;
});
const mount = (props: React.ComponentProps<typeof PanelHost> = {}) =>
  render(
    <I18nProvider>
      <PanelHost {...props} />
    </I18nProvider>
  );

it('uses one desktop panel for exploration, detail and grouped cluster selection', () => {
  const onLogin = jest.fn();
  let handle!: PanelHostHandle;
  const props = {
    onLogin,
    onReady: (value: PanelHostHandle) => {
      handle = value;
    },
  };
  const view = mount(props);
  expect(screen.getByRole('complementary', { name: labels['map.panelLabel'] })).toHaveAttribute(
    'data-panel-mode',
    'explore'
  );
  expect(mockMap.setBottomInset).toHaveBeenCalledWith(0);
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  expect(onLogin).toHaveBeenCalled();
  act(() => handle.onMapTap());
  expect(mockFacility.clearSelection).not.toHaveBeenCalled();
  mockFacility.selectedFacility = place;
  view.rerender(
    <I18nProvider>
      <PanelHost {...props} />
    </I18nProvider>
  );
  expect(screen.getByTestId('detail')).toHaveTextContent(place.name);
  fireEvent.click(screen.getByRole('button', { name: '돌아가기' }));
  expect(mockFacility.clearSelection).toHaveBeenCalledTimes(1);
  mockFacility.selectedFacility = null;
  mockFacility.selectedCluster = {
    id: 'cluster',
    count: 3,
    radius: 1,
    position: place.position,
    primaryCategory: 'park',
    facilities: [
      place,
      { ...place, id: 'second', name: '두 번째 공원', address: '' },
      { ...place, id: 'library', name: '도서관', category: 'library' },
    ],
  };
  view.rerender(
    <I18nProvider>
      <PanelHost {...props} />
    </I18nProvider>
  );
  expect(screen.getByRole('complementary')).toHaveAttribute('data-panel-mode', 'cluster');
  fireEvent.click(screen.getByRole('button', { name: /두 번째 공원/ }));
  expect(mockFacility.selectFacility).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'second' }),
    'cluster'
  );
  expect(mockMap.revealPosition).toHaveBeenCalledWith(place.position);
  fireEvent.click(screen.getByRole('button', { name: labels['map.sheet.back'] }));
  expect(mockFacility.clearSelection).toHaveBeenCalledTimes(2);
});

it('expands mobile detail, folds on map tap, then clears selection on a second tap', () => {
  mockDesktop = false;
  mockFacility.selectedFacility = place;
  let handle!: PanelHostHandle;
  const view = mount({
    onReady: value => {
      handle = value;
    },
  });
  expect(screen.getByRole('dialog', { name: labels['map.panelLabel'] })).toHaveAttribute(
    'data-panel-mode',
    'detail'
  );
  expect(screen.getByTestId('detail')).toHaveAttribute('data-compact', 'false');
  expect(mockMap.setBottomInset).toHaveBeenLastCalledWith(Math.round(window.innerHeight * 0.55));
  act(() => handle.onMapTap());
  expect(screen.getByTestId('detail')).toHaveAttribute('data-compact', 'true');
  expect(mockMap.setBottomInset).toHaveBeenLastCalledWith(168);
  act(() => handle.onMapTap());
  expect(mockFacility.clearSelection).toHaveBeenCalledTimes(1);
  fireEvent(window, new Event('resize'));
  expect(mockMap.setBottomInset).toHaveBeenLastCalledWith(168);
  view.unmount();
});

it('keeps mobile exploration compact until its place list opens', () => {
  mockDesktop = false;
  const view = mount();
  expect(screen.getByTestId('explorer')).toHaveAttribute('data-compact', 'true');
  mockExplore.isListOpen = true;
  view.rerender(
    <I18nProvider>
      <PanelHost />
    </I18nProvider>
  );
  expect(screen.getByTestId('explorer')).toHaveAttribute('data-compact', 'false');
});

it('supports keyboard and button movement through all three sheet sizes', () => {
  const dismiss = jest.fn();
  function Sheet() {
    const [snap, setSnap] = React.useState<SheetSnap>('peek');
    return (
      <I18nProvider>
        <MobileSheet
          snap={snap}
          onSnapChange={setSnap}
          onDismissAttempt={dismiss}
          label='장소 시트'
        >
          <output>{snap}</output>
        </MobileSheet>
      </I18nProvider>
    );
  }
  render(<Sheet />);
  const handle = screen.getByRole('button', { name: labels['map.sheet.handle'] });
  expect(handle).toHaveAttribute('aria-expanded', 'false');
  fireEvent.keyDown(handle, { key: 'ArrowDown' });
  expect(screen.getByText('peek')).toBeInTheDocument();
  fireEvent.keyDown(handle, { key: 'ArrowUp' });
  expect(screen.getByText('half')).toBeInTheDocument();
  fireEvent.keyDown(handle, { key: 'ArrowUp' });
  expect(screen.getByText('full')).toBeInTheDocument();
  fireEvent.keyDown(handle, { key: 'ArrowUp' });
  expect(screen.getByText('full')).toBeInTheDocument();
  fireEvent.keyDown(handle, { key: 'ArrowDown' });
  expect(screen.getByText('half')).toBeInTheDocument();
  fireEvent.click(handle);
  expect(screen.getByText('full')).toBeInTheDocument();
  fireEvent.click(handle);
  expect(screen.getByText('peek')).toBeInTheDocument();
  expect(sheetVisibleHeight('full', 800)).toBe(800);
  expect(sheetVisibleHeight('half', 800)).toBe(440);
  expect(sheetVisibleHeight('peek', 800)).toBe(168);
});
