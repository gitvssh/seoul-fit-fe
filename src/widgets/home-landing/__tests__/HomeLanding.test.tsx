import { render, screen } from '@testing-library/react';
import { HomeLanding } from '../ui/HomeLanding';
import { PUBLIC_PLACE_CATEGORIES } from '@/shared/lib/seo/public-places';
import { SITE_DESCRIPTION } from '@/shared/lib/seo/site';

describe('HomeLanding', () => {
  it('renders a real heading, the description and every public category link', () => {
    render(<HomeLanding />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('서울 공공시설 지도');
    expect(screen.getByText(SITE_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('지도를 준비하고 있습니다');

    const categoryLinks = screen.getByRole('navigation', { name: '장소 카테고리' });
    for (const category of PUBLIC_PLACE_CATEGORIES) {
      expect(categoryLinks.querySelector(`a[href="/places/${category.slug}"]`)).toHaveTextContent(
        category.label
      );
    }
    expect(screen.getByRole('link', { name: '모든 장소 둘러보기' })).toHaveAttribute(
      'href',
      '/places'
    );
  });
});
