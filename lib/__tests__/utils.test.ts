import { cn } from '@/shared/lib/utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('base-class', 'additional-class')
    expect(result).toBe('base-class additional-class')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const isDisabled = false
    
    const result = cn(
      'base',
      isActive && 'active',
      isDisabled && 'disabled'
    )
    expect(result).toBe('base active')
  })

  it('overrides tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('handles arrays of classes', () => {
    const result = cn(['base', 'text-sm'], 'font-bold')
    expect(result).toBe('base text-sm font-bold')
  })

  it('handles objects with boolean values', () => {
    const result = cn({
      'base-class': true,
      'disabled-class': false,
      'active-class': true
    })
    expect(result).toBe('base-class active-class')
  })

  it('filters out falsy values', () => {
    const result = cn('base', null, undefined, false, '', 'valid')
    expect(result).toBe('base valid')
  })

  it('merges tailwind modifiers correctly', () => {
    const result = cn('hover:bg-red-500', 'hover:bg-blue-500')
    expect(result).toBe('hover:bg-blue-500')
  })

  it('handles empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('preserves custom classes while merging tailwind classes', () => {
    const result = cn('custom-class text-red-500', 'text-blue-500')
    expect(result).toBe('custom-class text-blue-500')
  })
})
