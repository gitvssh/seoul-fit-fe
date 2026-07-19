import { showToast, showSuccessToast, showErrorToast, showWarningToast } from '../toast'

// Mock DOM methods
const mockElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn()
  },
  className: '',
  textContent: '',
  style: {} as Record<string, string>,
  remove: jest.fn()
}

describe('Toast Utils', () => {
  beforeEach(() => {
    // Mock document.createElement
    document.createElement = jest.fn().mockReturnValue(mockElement)
    document.body.appendChild = jest.fn()
    
    // Reset mocks
    jest.clearAllMocks()
    mockElement.textContent = ''
    mockElement.style = {}
  })

  describe('showToast', () => {
    it('creates and displays a toast message', () => {
      showToast('Test message')
      
      expect(document.createElement).toHaveBeenCalledWith('div')
      expect(mockElement.textContent).toBe('Test message')
      expect(mockElement.className).toBe('toast')
      expect(document.body.appendChild).toHaveBeenCalledWith(mockElement)
    })

    it('applies custom type class', () => {
      showToast('Error message', 'error')
      
      expect(mockElement.className).toBe('toast')
      expect(mockElement.classList.add).toHaveBeenCalledWith('toast-error')
    })

    it('auto-removes toast after duration', () => {
      jest.useFakeTimers()
      
      showToast('Test message', 'info', 3000)
      
      expect(mockElement.remove).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(3000)
      
      expect(mockElement.remove).toHaveBeenCalled()
      
      jest.useRealTimers()
    })

    it('applies fade-out animation before removal', () => {
      jest.useFakeTimers()
      
      showToast('Test message', 'info', 2000)
      
      jest.advanceTimersByTime(1500) // 2000 - 500ms for fade
      
      expect(mockElement.classList.add).toHaveBeenCalledWith('fade-out')
      
      jest.advanceTimersByTime(500)
      
      expect(mockElement.remove).toHaveBeenCalled()
      
      jest.useRealTimers()
    })
  })

  describe('showSuccessToast', () => {
    it('shows a success toast with default duration', () => {
      showSuccessToast('Success!')
      
      expect(mockElement.classList.add).toHaveBeenCalledWith('toast-success')
      expect(mockElement.textContent).toBe('Success!')
    })

    it('accepts custom duration', () => {
      jest.useFakeTimers()
      
      showSuccessToast('Success!', 5000)
      
      jest.advanceTimersByTime(4999)
      expect(mockElement.remove).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(1)
      expect(mockElement.remove).toHaveBeenCalled()
      
      jest.useRealTimers()
    })
  })

  describe('showErrorToast', () => {
    it('shows an error toast', () => {
      showErrorToast('Error occurred')
      
      expect(mockElement.classList.add).toHaveBeenCalledWith('toast-error')
      expect(mockElement.textContent).toBe('Error occurred')
    })

    it('has longer default duration for errors', () => {
      jest.useFakeTimers()
      
      showErrorToast('Error message')
      
      // Error toasts typically show longer
      jest.advanceTimersByTime(4999)
      expect(mockElement.remove).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(1)
      expect(mockElement.remove).toHaveBeenCalled()
      
      jest.useRealTimers()
    })
  })

  describe('showWarningToast', () => {
    it('shows a warning toast', () => {
      showWarningToast('Warning message')
      
      expect(mockElement.classList.add).toHaveBeenCalledWith('toast-warning')
      expect(mockElement.textContent).toBe('Warning message')
    })
  })

  describe('Toast positioning', () => {
    it('positions toast at the top of viewport', () => {
      showToast('Test')
      
      expect(mockElement.style.position).toBe('fixed')
      expect(mockElement.style.top).toBeDefined()
      expect(mockElement.style.left).toBe('50%')
      expect(mockElement.style.transform).toContain('translateX(-50%)')
    })

    it('applies z-index for layering', () => {
      showToast('Test')
      
      expect(mockElement.style.zIndex).toBeDefined()
      expect(parseInt(mockElement.style.zIndex)).toBeGreaterThan(1000)
    })
  })

})
