import * as React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import {
  useSearchCache,
  type SearchHistoryItem,
  type SearchItem,
} from '@/shared/lib/hooks/useSearchCache';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { SearchBox, type SearchBoxHandle, type SearchBoxProps } from '../SearchBox';

jest.mock('@/shared/lib/hooks/useSearchCache', () => ({ useSearchCache: jest.fn() }));
jest.mock('@/shared/lib/analytics/analytics', () => ({ trackEvent: jest.fn() }));

const library: SearchItem = {
  id: 'lib-1',
  name: '개봉도서관',
  category: 'library',
  address: '서울특별시 구로구 개봉로 1',
};
const library2: SearchItem = {
  id: 'lib-2',
  name: '서울도서관',
  category: 'library',
  address: '서울특별시 중구 세종대로 110',
};
const bike: SearchItem = { id: 'bike-1', name: '349. 어린이도서관', category: 'bike' };
const station: SearchItem = { id: 'sub-1', name: '서울역', category: 'subway', remark: '1호선' };
const ALL = [library, library2, bike, station];

const fakeSearch = (query: string, limit = 10) =>
  ALL.filter(item => item.name.includes(query)).slice(0, limit);

type CacheValue = ReturnType<typeof useSearchCache>;

function mockCache(overrides: Partial<CacheValue> = {}): CacheValue {
  const value = {
    searchCache: ALL,
    isLoading: false,
    error: null,
    search: jest.fn(fakeSearch),
    searchByCategory: jest.fn(() => []),
    reloadData: jest.fn(async () => {}),
    totalCount: ALL.length,
    searchHistory: [] as SearchHistoryItem[],
    addToHistory: jest.fn(),
    removeFromHistory: jest.fn(),
    clearHistory: jest.fn(),
    getRelevantHistory: jest.fn(() => []),
    ...overrides,
  } as CacheValue;
  (useSearchCache as jest.Mock).mockReturnValue(value);
  return value;
}

type HarnessProps = Partial<Omit<SearchBoxProps, 'query'>> & {
  initialQuery?: string;
  handle?: React.Ref<SearchBoxHandle>;
};

function Harness({ initialQuery = '', handle, onQueryChange, ...props }: HarnessProps) {
  const [query, setQuery] = React.useState(initialQuery);
  return (
    <I18nProvider>
      <SearchBox
        ref={handle}
        {...props}
        query={query}
        onQueryChange={next => {
          setQuery(next);
          onQueryChange?.(next);
        }}
        onSelect={props.onSelect ?? jest.fn()}
        onClear={props.onClear ?? jest.fn()}
      />
    </I18nProvider>
  );
}

const combobox = () => screen.getByRole('combobox', { name: '장소와 조건 검색' });

async function typeQuery(text: string) {
  const user = userEvent.setup();
  await user.type(combobox(), text);
  return user;
}

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockCache();
});

describe('SearchBox', () => {
  it('renders a combobox with a Korean label that starts collapsed', () => {
    render(<Harness />);
    const input = combobox();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows results grouped by category with the matched part highlighted', async () => {
    render(<Harness />);
    await typeQuery('도서관');

    const list = await screen.findByRole('listbox', { name: '검색 제안' });
    const libraries = within(list).getByRole('group', { name: '도서관' });
    expect(
      within(libraries)
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual(['개봉도서관서울특별시 구로구 개봉로 1', '서울도서관서울특별시 중구 세종대로 110']);
    expect(within(libraries).getAllByText('도서관', { selector: 'mark' })).toHaveLength(2);
    expect(within(list).getByRole('group', { name: '따릉이' })).toBeInTheDocument();
    expect(combobox()).toHaveAttribute('aria-expanded', 'true');
    expect(combobox()).toHaveAttribute('aria-controls', list.id);
  });

  it('moves aria-activedescendant with ArrowDown while DOM focus stays on the input', async () => {
    render(<Harness />);
    await typeQuery('도서관');
    const options = await screen.findAllByRole('option');
    const input = combobox();
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', options[0].id));

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant', options[1].id));
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveFocus();
  });

  it('selects the active place on Enter even when the natural-language parser also matched', async () => {
    const onSelect = jest.fn();
    const onApplyRule = jest.fn();
    const cache = mockCache();
    render(<Harness onSelect={onSelect} onApplyRule={onApplyRule} />);
    await typeQuery('도서관');
    await screen.findAllByRole('option');
    const input = combobox();
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant'));

    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'lib-1' }))
    );
    expect(onApplyRule).not.toHaveBeenCalled();
    expect(cache.addToHistory).toHaveBeenCalledWith(
      '개봉도서관',
      expect.objectContaining({ id: 'lib-1' })
    );
    expect(trackEvent).toHaveBeenCalledWith('discovery_started', {
      selection_source: 'search_result',
    });
    expect(input).toHaveValue('개봉도서관');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('ignores Enter and Escape while Hangul composition is in progress', async () => {
    const onSelect = jest.fn();
    const onClear = jest.fn();
    render(<Harness onSelect={onSelect} onClear={onClear} />);
    await typeQuery('도서관');
    await screen.findAllByRole('option');
    const input = combobox();
    await waitFor(() => expect(input).toHaveAttribute('aria-activedescendant'));

    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    fireEvent.keyDown(input, { key: 'Escape', isComposing: true });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes the popup on the first Escape and clears on the second', async () => {
    const onClear = jest.fn();
    render(<Harness onClear={onClear} />);
    await typeQuery('도서관');
    await screen.findByRole('listbox');
    const input = combobox();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveValue('도서관');
    expect(onClear).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
  });

  it('clears the query and notifies the owner from the clear button', async () => {
    const onClear = jest.fn();
    render(<Harness onClear={onClear} />);
    const user = await typeQuery('도서관');

    await user.click(screen.getByRole('button', { name: '검색어 지우기' }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(combobox()).toHaveValue('');
    expect(combobox()).toHaveFocus();
  });

  it('shows the no-result state with a hint and a reset action', async () => {
    const onClear = jest.fn();
    render(<Harness onClear={onClear} />);
    const user = await typeQuery('zzzz');

    expect(await screen.findByText('‘zzzz’에 맞는 장소가 없어요.')).toBeInTheDocument();
    expect(screen.getByText(/카테고리로 검색해 보세요/)).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '필터 초기화' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('announces the result count through a status region', async () => {
    render(<Harness />);
    await typeQuery('도서관');

    const status = await screen.findByText('검색 결과 3건');
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('shows recent searches on focus with always-visible remove buttons', async () => {
    const onSelect = jest.fn();
    const park: SearchItem = {
      id: 'park-1',
      name: '남산공원',
      category: 'park',
      address: '서울특별시 중구 삼일대로 231',
    };
    const cache = mockCache({
      searchHistory: [
        { id: 'h1', query: '남산공원', timestamp: 2, selectedItem: park },
        { id: 'h2', query: '서울숲', timestamp: 1 },
      ],
    });
    render(<Harness onSelect={onSelect} />);
    const user = userEvent.setup();

    await user.click(combobox());

    const group = await screen.findByRole('group', { name: '최근 검색' });
    expect(within(group).getAllByRole('option')).toHaveLength(2);
    const remove = screen.getByRole('button', { name: '남산공원 검색 기록 삭제' });
    expect(remove.className).not.toMatch(/opacity-0/);
    expect(screen.getByText('최근 검색 2건')).toHaveAttribute('role', 'status');

    await user.click(remove);
    expect(cache.removeFromHistory).toHaveBeenCalledWith('h1');
    expect(onSelect).not.toHaveBeenCalled();

    await user.click(within(group).getByText('남산공원'));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(park));
    expect(trackEvent).toHaveBeenCalledWith('discovery_started', {
      selection_source: 'search_history',
    });
  });

  it('preserves input focus for popup mouse actions and restores it after a button Escape', async () => {
    const cache = mockCache({
      searchHistory: [{ id: 'h1', query: '서울숲', timestamp: 1 }],
    });
    render(<Harness />);
    const user = userEvent.setup();
    await user.click(combobox());
    const remove = await screen.findByRole('button', { name: '서울숲 검색 기록 삭제' });

    await user.click(remove);
    expect(cache.removeFromHistory).toHaveBeenCalledWith('h1');
    expect(combobox()).toHaveFocus();

    act(() => remove.focus());
    fireEvent.keyDown(remove, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox()).toHaveFocus();
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows a loading skeleton instead of "no results" while the index loads', async () => {
    mockCache({ isLoading: true, search: jest.fn(() => []) });
    render(<Harness />);
    await typeQuery('도서관');

    expect(await screen.findByText('장소 정보를 불러오는 중이에요.')).toHaveAttribute(
      'role',
      'status'
    );
    expect(screen.queryByText(/맞는 장소가 없어요/)).not.toBeInTheDocument();
  });

  it('shows an inline error with a retry action when the index failed to load', async () => {
    const cache = mockCache({
      error: '검색 데이터 로드에 실패했습니다.',
      search: jest.fn(() => []),
    });
    render(<Harness />);
    const user = await typeQuery('도서관');

    const [inline, status] = await screen.findAllByText('검색 정보를 불러오지 못했어요.');
    expect(inline.tagName).toBe('P');
    expect(status).toHaveAttribute('role', 'status');
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(cache.reloadData).toHaveBeenCalledTimes(1);
  });

  it('offers the natural-language rule and applies it on Enter when no place matches', async () => {
    const onApplyRule = jest.fn();
    const onSelect = jest.fn();
    render(<Harness onApplyRule={onApplyRule} onSelect={onSelect} />);
    await typeQuery('한산한 실내 도서관');

    const ruleButton = await screen.findByRole('button', { name: /조건으로 지도 보기/ });
    expect(ruleButton).toHaveTextContent('도서관 · 실내 · 한산함');

    fireEvent.keyDown(combobox(), { key: 'Enter' });

    expect(onApplyRule).toHaveBeenCalledWith(
      expect.objectContaining({ matched: true, categories: ['library'] })
    );
    expect(onSelect).not.toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith('discovery_started', {
      selection_source: 'natural_language',
    });
  });

  it('exposes focus, blur and closeSuggestions through the handle', async () => {
    const handle = React.createRef<SearchBoxHandle>();
    render(<Harness handle={handle} />);
    await typeQuery('도서관');
    await screen.findByRole('listbox');

    act(() => handle.current?.closeSuggestions());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    act(() => handle.current?.blur());
    expect(combobox()).not.toHaveFocus();

    act(() => handle.current?.focus());
    expect(combobox()).toHaveFocus();
  });
});
