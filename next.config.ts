import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), payment=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'culture.seoul.go.kr' },
      // Kakao profile images for signed-in users
      { protocol: 'https', hostname: '**.kakaocdn.net' },
      { protocol: 'http', hostname: '**.kakaocdn.net' },
      { protocol: 'https', hostname: '**.kakao.com' },
    ],
  },
  async redirects() {
    // The legacy Pages Router duplicate of the home screen was removed.
    return [{ source: '/home', destination: '/', permanent: true }];
  },
  reactStrictMode: false, // 개발 환경에서 중복 렌더링 방지
  typescript: {
    // 타입 오류는 여전히 빌드를 실패시킴
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
