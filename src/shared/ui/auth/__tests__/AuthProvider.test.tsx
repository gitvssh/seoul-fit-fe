import { render } from '@testing-library/react'
import { AuthProvider } from '../AuthProvider'
import { useAuthStore } from '@/shared/model/authStore'

// Mock the auth store
jest.mock('@/shared/model/authStore')

describe('AuthProvider', () => {
  const mockCheckAuthStatus = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      checkAuthStatus: mockCheckAuthStatus
    })
  })

  it('renders children correctly', () => {
    const TestChild = () => <div data-testid="test-child">Test Child</div>
    
    const { getByTestId } = render(
      <AuthProvider>
        <TestChild />
      </AuthProvider>
    )
    
    expect(getByTestId('test-child')).toBeInTheDocument()
    expect(getByTestId('test-child')).toHaveTextContent('Test Child')
  })

  it('calls checkAuthStatus on mount', () => {
    render(
      <AuthProvider>
        <div>Child Content</div>
      </AuthProvider>
    )
    
    expect(mockCheckAuthStatus).toHaveBeenCalledTimes(1)
  })

  it('passes through multiple children', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </AuthProvider>
    )
    
    expect(getByTestId('child-1')).toBeInTheDocument()
    expect(getByTestId('child-2')).toBeInTheDocument()
  })

  it('handles empty children', () => {
    const { container } = render(
      <AuthProvider>
        {null}
      </AuthProvider>
    )
    
    expect(container.firstChild).toBeNull()
    expect(mockCheckAuthStatus).toHaveBeenCalledTimes(1)
  })

  it('handles string children', () => {
    const { container } = render(
      <AuthProvider>
        Plain text content
      </AuthProvider>
    )
    
    expect(container).toHaveTextContent('Plain text content')
    expect(mockCheckAuthStatus).toHaveBeenCalledTimes(1)
  })

  it('re-renders when auth store changes', () => {
    const { rerender } = render(
      <AuthProvider>
        <div>Initial Content</div>
      </AuthProvider>
    )
    
    // Mock auth store change
    const newMockCheckAuthStatus = jest.fn()
    ;(useAuthStore as unknown as jest.Mock).mockReturnValue({
      checkAuthStatus: newMockCheckAuthStatus
    })
    
    rerender(
      <AuthProvider>
        <div>Updated Content</div>
      </AuthProvider>
    )
    
    // Original checkAuthStatus should have been called once
    expect(mockCheckAuthStatus).toHaveBeenCalledTimes(1)
  })

  it('works with complex nested children', () => {
    const NestedComponent = () => (
      <div data-testid="nested">
        <span>Nested Content</span>
      </div>
    )
    
    const { getByTestId } = render(
      <AuthProvider>
        <div data-testid="wrapper">
          <NestedComponent />
          <p>Additional content</p>
        </div>
      </AuthProvider>
    )
    
    expect(getByTestId('wrapper')).toBeInTheDocument()
    expect(getByTestId('nested')).toBeInTheDocument()
    expect(mockCheckAuthStatus).toHaveBeenCalledTimes(1)
  })

  it('maintains component identity across re-renders', () => {
    let renderCount = 0
    const TestComponent = () => {
      renderCount++
      return <div data-testid="test-component">Render {renderCount}</div>
    }
    
    const { getByTestId, rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(getByTestId('test-component')).toHaveTextContent('Render 1')
    
    rerender(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    expect(getByTestId('test-component')).toHaveTextContent('Render 2')
  })
})
