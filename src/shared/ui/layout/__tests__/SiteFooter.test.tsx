import { render, screen } from '@testing-library/react';
import { SiteFooter } from '../SiteFooter';

describe('SiteFooter', () => {
  it('carries the data attribution, platform notices and project status', () => {
    render(<SiteFooter />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '서울 열린데이터광장' })).toHaveAttribute(
      'href',
      'https://data.seoul.go.kr'
    );
    expect(screen.getByText(/Kakao 지도 API와 카카오 로그인/)).toBeInTheDocument();
    expect(screen.getByText(/추천은 규칙 기반이며 AI가 아닙니다/)).toBeInTheDocument();
    expect(
      screen.getByText(/서울시가 운영하는 서비스가 아닌 개인 포트폴리오 프로젝트/)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '서비스 소개' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'GitHub 저장소' })).toHaveAttribute(
      'href',
      'https://github.com/gitvssh/seoul-fit-fe'
    );
  });
});
