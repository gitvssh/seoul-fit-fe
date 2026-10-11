import { render, screen } from '@testing-library/react';
import { AppShellSkeleton } from '../app-shell-skeleton';

describe('AppShellSkeleton', () => {
  it('announces itself as a busy status region with the given label', () => {
    render(<AppShellSkeleton label='지도를 준비하고 있어요' />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('지도를 준비하고 있어요');
    expect(status.querySelector('[data-slot="logo-mark"]')).toBeInTheDocument();
  });

  it('can omit the explorer card placeholder', () => {
    const { container } = render(<AppShellSkeleton showCard={false} />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeLessThan(5);
  });
});
