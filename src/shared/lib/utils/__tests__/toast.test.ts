import { toast as sonnerToast } from 'sonner';
import {
  TOAST_DURATION_MS,
  showErrorToast,
  showSuccessToast,
  showToast,
  showWarningToast,
  toast,
} from '../toast';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(() => 'success-id'),
    error: jest.fn(() => 'error-id'),
    info: jest.fn(() => 'info-id'),
    warning: jest.fn(() => 'warning-id'),
    dismiss: jest.fn(),
  },
}));

const mocked = sonnerToast as unknown as Record<keyof typeof sonnerToast, jest.Mock>;

describe('toast utils (sonner)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showToast', () => {
    it('shows an info toast with the default duration', () => {
      expect(showToast('Test message')).toBe('info-id');
      expect(mocked.info).toHaveBeenCalledWith('Test message', {
        duration: TOAST_DURATION_MS.info,
      });
    });

    it('routes the type to the matching sonner call', () => {
      showToast('Error message', 'error');
      expect(mocked.error).toHaveBeenCalledWith('Error message', {
        duration: TOAST_DURATION_MS.error,
      });
    });

    it('passes a custom duration through', () => {
      showToast('Short', 'info', 1500);
      expect(mocked.info).toHaveBeenCalledWith('Short', { duration: 1500 });
    });
  });

  describe('typed helpers', () => {
    it('showSuccessToast uses the success duration', () => {
      showSuccessToast('Success!');
      expect(mocked.success).toHaveBeenCalledWith('Success!', { duration: 3000 });
    });

    it('showErrorToast stays visible longer by default', () => {
      showErrorToast('Error occurred');
      expect(mocked.error).toHaveBeenCalledWith('Error occurred', { duration: 5000 });
    });

    it('showWarningToast uses the warning duration', () => {
      showWarningToast('Warning message', 2000);
      expect(mocked.warning).toHaveBeenCalledWith('Warning message', { duration: 2000 });
    });
  });

  describe('toast object', () => {
    it('delegates each type with the default duration', () => {
      toast.success('saved');
      toast.error('failed');
      toast.info('note');
      toast.warning('careful');
      expect(mocked.success).toHaveBeenCalledWith('saved', { duration: 3000 });
      expect(mocked.error).toHaveBeenCalledWith('failed', { duration: 5000 });
      expect(mocked.info).toHaveBeenCalledWith('note', { duration: 3000 });
      expect(mocked.warning).toHaveBeenCalledWith('careful', { duration: 4000 });
    });

    it('accepts a duration option and forwards dismiss', () => {
      toast.success('saved', { duration: 800 });
      expect(mocked.success).toHaveBeenCalledWith('saved', { duration: 800 });
      toast.dismiss('success-id');
      expect(mocked.dismiss).toHaveBeenCalledWith('success-id');
    });
  });
});
