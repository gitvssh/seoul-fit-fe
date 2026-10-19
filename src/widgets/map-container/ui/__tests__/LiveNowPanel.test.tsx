import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { WeatherData, CongestionData } from '@/lib/types';
import type { LiveSlice } from '@/shared/lib/hooks/useLiveData';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { koMessages as labels } from '@/shared/i18n/messages';
import { LiveNowPanel, WeatherConditionIcon, congestionVariant } from '../LiveNowPanel';

const weather: WeatherData = {
  AREA_NM: '시청',
  AREA_CD: 'test',
  WEATHER_STTS: '맑음',
  TEMP: '24.6',
  SENSIBLE_TEMP: '25',
  MAX_TEMP: '27',
  MIN_TEMP: '20',
  HUMIDITY: '60',
  PRECIPITATION: '0',
  PCP_MSG: '비 소식 없음',
  UV_INDEX_LVL: '보통',
  UV_MSG: '',
  PM25_INDEX: '좋음',
  PM10_INDEX: '보통',
  timestamp: new Date().toISOString(),
};
const slice = <T,>(data: T | null, status: LiveSlice<T>['status'] = 'ok'): LiveSlice<T> => ({
  data,
  status,
  fetchedAt: null,
});
const onRefresh = jest.fn(),
  onClose = jest.fn();
const mount = (props: Partial<React.ComponentProps<typeof LiveNowPanel>> = {}) =>
  render(
    <I18nProvider>
      <LiveNowPanel
        weather={slice(weather)}
        congestion={slice<CongestionData>({
          AREA_NM: '시청',
          AREA_CONGEST_LVL: '보통',
          AREA_CONGEST_MSG: '이동이 원활합니다',
          timestamp: new Date().toISOString(),
        })}
        loading={false}
        onRefresh={onRefresh}
        onClose={onClose}
        {...props}
      />
    </I18nProvider>
  );
beforeEach(() => jest.clearAllMocks());

it('shows temperatures, air quality, rain, congestion and source time with working controls', () => {
  const view = mount();
  expect(screen.getByRole('region', { name: labels['map.liveNow'] })).toHaveTextContent('25°');
  expect(screen.getByText('비 소식 없음')).toBeInTheDocument();
  expect(screen.getByText('이동이 원활합니다')).toBeInTheDocument();
  expect(screen.getByText(/미세먼지.*보통/)).toBeInTheDocument();
  expect(screen.getByText(/초미세먼지.*좋음/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: labels['map.live.refresh'] }));
  fireEvent.click(screen.getByRole('button', { name: labels['map.liveNowHide'] }));
  fireEvent.keyDown(document, { key: 'ArrowLeft' });
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(2);
  expect(onRefresh).toHaveBeenCalledTimes(1);
  view.unmount();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(2);
});

it.each(['unavailable', 'error', 'outside_area', 'loading'] as const)(
  'shows a distinct %s state without presenting missing data as live',
  status => {
    mount({
      weather: slice<WeatherData>(null, status),
      congestion: slice<CongestionData>(null),
      loading: status === 'loading',
    });
    const key =
      status === 'loading'
        ? 'map.live.loading'
        : status === 'outside_area'
          ? 'map.live.outsideArea'
          : 'map.live.unavailable';
    expect(screen.getByText(labels[key])).toBeInTheDocument();
    expect(screen.getByRole('button', { name: labels['map.live.refresh'] })).toHaveProperty(
      'disabled',
      status === 'loading'
    );
    expect(screen.queryByText('25°')).not.toBeInTheDocument();
  }
);

it('keeps congestion visible when weather is unavailable', () => {
  mount({ weather: slice<WeatherData>(null, 'unavailable') });
  expect(screen.getByText('이동이 원활합니다')).toBeInTheDocument();
  expect(screen.getByText(labels['map.live.unavailable'])).toBeInTheDocument();
});

it('handles partial weather without invented humidity, sensation, air quality or rain messages', () => {
  mount({
    weather: slice({
      ...weather,
      AREA_NM: '',
      SENSIBLE_TEMP: 'unknown',
      HUMIDITY: '',
      PM10_INDEX: '',
      PM25_INDEX: '',
      PCP_MSG: '',
    }),
    congestion: slice<CongestionData>(null),
  });
  expect(screen.getByText(/25°/)).toBeInTheDocument();
  expect(screen.queryByText(/습도/)).not.toBeInTheDocument();
  expect(screen.queryByText('비 소식 없음')).not.toBeInTheDocument();
});

it.each([
  ['여유', 'success'],
  ['보통', 'warning'],
  ['약간 붐빔', 'destructive'],
  ['붐빔', 'destructive'],
  [undefined, 'muted'],
])('maps congestion %s into a stable status %s', (level, expected) => {
  expect(congestionVariant(level)).toBe(expected);
});

it.each([
  ['비', 'cloud-rain'],
  ['rain', 'cloud-rain'],
  ['구름', 'cloud'],
  ['흐림', 'cloud'],
  ['cloudy', 'cloud'],
  ['맑음', 'sun'],
  [undefined, 'sun'],
])('represents weather %s with a decorative icon', (condition, name) => {
  const { container } = render(<WeatherConditionIcon condition={condition} />);
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  expect(container.querySelector('svg')).toHaveClass(`lucide-${name}`);
});
