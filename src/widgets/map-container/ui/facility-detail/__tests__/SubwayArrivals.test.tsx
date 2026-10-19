import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { koMessages as labels } from '@/shared/i18n/messages';
import { SubwayArrivals } from '../SubwayArrivals';

const mockFetch = jest.fn();
const originalFetch = global.fetch;
const mount = (name = '서울역') =>
  render(
    <I18nProvider>
      <SubwayArrivals stationName={name} />
    </I18nProvider>
  );
beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
});
afterAll(() => {
  global.fetch = originalFetch;
});

it('loads a safely encoded station and limits its accessible arrival list to three trains', async () => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        arrivals: Array.from({ length: 4 }, (_, index) => ({
          trainLineNm: `열차 ${index}`,
          arvlMsg2: `${index + 1}분 후`,
          bstatnNm: index ? undefined : '시청',
          updnLine: '상행',
          btrainNo: index ? undefined : '0001',
        })),
      },
    }),
  });
  mount('서울 & 시청');
  expect(screen.getByText(labels['facility.loadingArrival'])).toBeInTheDocument();
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3));
  expect(screen.queryByText('열차 3')).not.toBeInTheDocument();
  expect(screen.getAllByText('상행')).toHaveLength(2);
  expect(mockFetch).toHaveBeenCalledWith(
    '/api/subway/arrival?stationName=%EC%84%9C%EC%9A%B8%20%26%20%EC%8B%9C%EC%B2%AD',
    { signal: expect.any(AbortSignal) }
  );
});

it.each(['empty', 'missing-data', 'http', 'not-success', 'invalid-json', 'network'])(
  'distinguishes %s from a successful train arrival',
  async mode => {
    mockFetch.mockResolvedValue({
      ok: mode !== 'http',
      json:
        mode === 'invalid-json'
          ? async () => {
              throw new Error('invalid JSON');
            }
          : async () => ({
              success: mode !== 'not-success',
              ...(mode !== 'missing-data' ? { data: { arrivals: [] } } : {}),
            }),
    });
    if (mode === 'network') mockFetch.mockRejectedValue(new Error('synthetic offline'));
    mount();
    const label =
      labels[
        mode === 'empty' || mode === 'missing-data'
          ? 'facility.noArrival'
          : 'facility.arrivalUnavailable'
      ];
    await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument());
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  }
);

it('aborts the old station request when switching stations and ignores its late response', async () => {
  let oldResolve!: (value: unknown) => void;
  mockFetch.mockReturnValueOnce(
    new Promise(resolve => {
      oldResolve = resolve;
    })
  );
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { arrivals: [] } }),
  });
  const view = mount();
  const signal = mockFetch.mock.calls[0][1].signal as AbortSignal;
  view.rerender(
    <I18nProvider>
      <SubwayArrivals stationName='시청' />
    </I18nProvider>
  );
  expect(signal.aborted).toBe(true);
  await waitFor(() => expect(screen.getByText(labels['facility.noArrival'])).toBeInTheDocument());
  oldResolve({
    ok: true,
    json: async () => ({ success: true, data: { arrivals: [{ trainLineNm: 'old train' }] } }),
  });
  await waitFor(() => expect(screen.queryByText('old train')).not.toBeInTheDocument());
  view.unmount();
  expect(mockFetch.mock.calls[1][1].signal.aborted).toBe(true);
});
