import { ImageResponse } from 'next/og';
import { SITE_DESCRIPTION, SITE_NAME } from '@/shared/lib/seo/site';

export { SITE_TITLE as alt } from '@/shared/lib/seo/site';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '76px 84px',
          color: '#0f172a',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #ffffff 48%, #dcfce7 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              background: '#0F284E',
              fontSize: '38px',
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ color: '#0F284E', fontSize: '42px', fontWeight: 800 }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div
            style={{
              maxWidth: '960px',
              display: 'flex',
              fontSize: '68px',
              lineHeight: 1.14,
              letterSpacing: '-2px',
              fontWeight: 800,
            }}
          >
            서울 공공시설 지도
          </div>
          <div
            style={{
              maxWidth: '960px',
              display: 'flex',
              fontSize: '30px',
              lineHeight: 1.4,
              color: '#334155',
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: '26px', color: '#1d4ed8', fontWeight: 600 }}>
          seoulfit.damecasol.com
        </div>
      </div>
    ),
    { ...size }
  );
}
