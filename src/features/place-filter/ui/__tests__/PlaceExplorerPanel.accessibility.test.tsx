import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { DEFAULT_PLACE_FILTERS } from '../../model/types';
import { PlaceExplorerPanel } from '../PlaceExplorerPanel';

describe('PlaceExplorerPanel accessibility contract', () => {
  it('exposes named regions and controls for the empty core flow', () => {
    render(
      <I18nProvider>
        <PlaceExplorerPanel
          filters={DEFAULT_PLACE_FILTERS}
          facilities={[]}
          selectedFacility={null}
          isListOpen
          weatherData={null}
          congestionData={null}
          liveDataLoading={false}
          activePreset='available_now'
          recommendations={[]}
          naturalLanguageSummaryKo={null}
          naturalLanguageSummaryEn={null}
          origin={{ lat: 37.5665, lng: 126.978 }}
          onListOpenChange={jest.fn()}
          onFilterChange={jest.fn()}
          onReset={jest.fn()}
          onFacilitySelect={jest.fn()}
          onPresetChange={jest.fn()}
          onRecommendationSelect={jest.fn()}
          onEngagementOpen={jest.fn()}
        />
      </I18nProvider>
    );

    expect(
      screen.getByRole('region', { name: '장소 탐색 필터와 목록' })
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '최대 거리' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내 생활' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '목록 닫기' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('현재 지도와 필터에 맞는 장소가 없습니다.')).toBeInTheDocument();
  });
});
