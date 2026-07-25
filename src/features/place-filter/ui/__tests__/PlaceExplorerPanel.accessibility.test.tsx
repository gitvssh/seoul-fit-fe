import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { DEFAULT_PLACE_FILTERS } from '../../model/types';
import { PlaceExplorerPanel } from '../PlaceExplorerPanel';

describe('PlaceExplorerPanel accessibility contract', () => {
  it('exposes named regions and controls for the empty core flow', async () => {
    const user = userEvent.setup();
    const onRegionSelect = jest.fn();

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
          selectedRegionCode=''
          onRegionSelect={onRegionSelect}
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

    expect(screen.getByRole('region', { name: '장소 탐색 필터와 목록' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '최대 거리' })).toBeInTheDocument();
    const regionSelect = screen.getByRole('combobox', { name: '지역 바로가기' });
    expect(regionSelect).toBeInTheDocument();
    await user.selectOptions(regionSelect, 'gangnam');
    expect(onRegionSelect).toHaveBeenCalledWith('gangnam');
    expect(screen.getByRole('button', { name: '내 생활' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '목록 닫기' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('현재 지도와 필터에 맞는 장소가 없습니다.')).toBeInTheDocument();
  });
});
