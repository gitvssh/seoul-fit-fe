import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { koMessages as labels } from '@/shared/i18n/messages';
import {
  getUserInterests,
  updateUserInterests,
  type UserInterestResponse,
} from '@/shared/api/preference';
import { toast } from '@/shared/lib/utils/toast';
import { trackEvent } from '@/shared/lib/analytics/analytics';
import { InterestSection } from '../InterestSection';

jest.mock('@/shared/api/preference', () => ({
  getUserInterests: jest.fn(),
  updateUserInterests: jest.fn(),
}));
jest.mock('@/shared/lib/utils/toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/shared/lib/analytics/analytics', () => ({ trackEvent: jest.fn() }));
const response: UserInterestResponse = {
  userId: 1,
  interests: [],
  totalCount: 0,
  lastUpdated: '',
  isCompleted: false,
};
const mount = (
  props: React.ComponentProps<typeof InterestSection> = { fallbackInterests: ['PARK'] }
) =>
  render(
    <I18nProvider>
      <InterestSection {...props} />
    </I18nProvider>
  );
const edit = () =>
  fireEvent.click(screen.getByRole('button', { name: labels['profile.interests.edit'] }));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getUserInterests).mockResolvedValue(response);
  jest.mocked(updateUserInterests).mockResolvedValue(undefined);
});

it('shows account interests as read-only after loading, and cancels draft changes', async () => {
  jest
    .mocked(getUserInterests)
    .mockResolvedValue({
      ...response,
      interests: [
        {
          category: 'LIBRARY',
          displayName: '도서관',
          description: '',
          emoji: '',
          isLocationBased: true,
          isRealtimeNotificationRequired: false,
        },
      ],
    });
  const onChange = jest.fn();
  mount({ fallbackInterests: ['PARK'], onChange });
  expect(screen.getByRole('button', { name: labels['profile.interests.edit'] })).toBeDisabled();
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: labels['category.library'] })).toBeChecked()
  );
  expect(onChange).toHaveBeenCalledWith(['LIBRARY']);
  expect(screen.getByRole('checkbox', { name: labels['category.library'] })).toBeDisabled();
  edit();
  fireEvent.click(screen.getByRole('checkbox', { name: labels['category.library'] }));
  fireEvent.click(screen.getByRole('checkbox', { name: labels['category.park'] }));
  expect(screen.getByRole('checkbox', { name: labels['category.park'] })).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: labels['profile.interests.cancel'] }));
  expect(screen.getByRole('checkbox', { name: labels['category.library'] })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: labels['category.park'] })).not.toBeChecked();
  expect(updateUserInterests).not.toHaveBeenCalled();
});

it('keeps fallback interests for an empty account result and persists explicit user changes', async () => {
  const onChange = jest.fn();
  mount({ fallbackInterests: ['PARK'], onChange });
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: labels['category.park'] })).toBeChecked()
  );
  edit();
  fireEvent.click(screen.getByRole('checkbox', { name: labels['category.library'] }));
  fireEvent.click(screen.getByRole('button', { name: labels['profile.interests.save'] }));
  await waitFor(() => expect(updateUserInterests).toHaveBeenCalledWith(['PARK', 'LIBRARY']));
  expect(onChange).toHaveBeenLastCalledWith(['PARK', 'LIBRARY']);
  expect(toast.success).toHaveBeenCalledWith(labels['profile.interests.saved']);
  expect(trackEvent).toHaveBeenCalledWith('preferences_saved', { page_type: 'profile' });
  expect(screen.getByRole('checkbox', { name: labels['category.library'] })).toBeDisabled();
});

it('keeps unsaved edits available after a save failure and supports retry', async () => {
  jest.mocked(updateUserInterests).mockRejectedValueOnce(new Error('synthetic offline'));
  mount();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: labels['profile.interests.edit'] })).toBeEnabled()
  );
  edit();
  fireEvent.click(screen.getByRole('checkbox', { name: labels['category.library'] }));
  fireEvent.click(screen.getByRole('button', { name: labels['profile.interests.save'] }));
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(labels['profile.interests.saveFailed'])
  );
  expect(screen.getByRole('checkbox', { name: labels['category.library'] })).toBeChecked();
  expect(trackEvent).not.toHaveBeenCalledWith('preferences_saved', expect.anything());
  fireEvent.click(screen.getByRole('button', { name: labels['profile.interests.save'] }));
  await waitFor(() => expect(toast.success).toHaveBeenCalled());
});

it('disables duplicate save and cancel actions while a save is pending', async () => {
  let resolve!: () => void;
  jest.mocked(updateUserInterests).mockReturnValue(
    new Promise(done => {
      resolve = done;
    })
  );
  mount();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: labels['profile.interests.edit'] })).toBeEnabled()
  );
  edit();
  fireEvent.click(screen.getByRole('button', { name: labels['profile.interests.save'] }));
  expect(screen.getByRole('button', { name: labels['profile.interests.saving'] })).toBeDisabled();
  expect(screen.getByRole('button', { name: labels['profile.interests.cancel'] })).toBeDisabled();
  await act(async () => resolve());
  expect(screen.getByRole('button', { name: labels['profile.interests.edit'] })).toBeEnabled();
});

it('reports a failed initial load while retaining fallback selections', async () => {
  jest.mocked(getUserInterests).mockRejectedValue(new Error('synthetic load failure'));
  mount();
  await waitFor(() =>
    expect(screen.getByText(labels['profile.interests.loadFailed'])).toBeInTheDocument()
  );
  expect(screen.getByRole('checkbox', { name: labels['category.park'] })).toBeChecked();
});

it('ignores a late initial load after the section has unmounted', async () => {
  let resolve!: (value: UserInterestResponse) => void;
  jest.mocked(getUserInterests).mockReturnValue(
    new Promise(done => {
      resolve = done;
    })
  );
  const onChange = jest.fn();
  const view = mount({ fallbackInterests: [], onChange });
  view.unmount();
  await act(async () => resolve(response));
  expect(onChange).not.toHaveBeenCalled();
});
