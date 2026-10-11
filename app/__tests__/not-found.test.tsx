import { render, screen } from '@testing-library/react';
import NotFound, { metadata } from '../not-found';

describe('not-found route', () => {
  it('renders a branded 404 with ways back into the product', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('페이지를 찾을 수 없어요');
    expect(screen.getByRole('link', { name: '지도로 가기' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '장소 둘러보기' })).toHaveAttribute('href', '/places');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
