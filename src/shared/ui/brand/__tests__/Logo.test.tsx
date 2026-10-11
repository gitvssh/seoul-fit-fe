import { render, screen } from '@testing-library/react';
import { Logo, LogoMark, Wordmark } from '../Logo';
import { LOGO_MARK_PATHS } from '../logo-mark';

describe('brand logo', () => {
  it('renders the mark as a decorative tile with every glyph path', () => {
    const { container } = render(<LogoMark size={40} />);
    const tile = container.querySelector('[data-slot="logo-mark"]');

    expect(tile).toHaveAttribute('aria-hidden', 'true');
    expect(tile).toHaveStyle({ width: '40px', height: '40px' });
    expect(container.querySelectorAll('path')).toHaveLength(LOGO_MARK_PATHS.length);
  });

  it('renders the wordmark text', () => {
    render(<Wordmark />);
    expect(screen.getByText('Seoul Fit')).toBeInTheDocument();
  });

  it('combines mark and wordmark in the lockup', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('[data-slot="logo-mark"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="wordmark"]')).toHaveTextContent('Seoul Fit');
  });
});
