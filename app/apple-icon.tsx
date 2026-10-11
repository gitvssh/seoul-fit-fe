import { ImageResponse } from 'next/og';
import { BRAND_HEX, LOGO_MARK_PATHS, LOGO_MARK_TILE_VIEWBOX } from '@/shared/ui/brand/logo-mark';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const PADDING = 20;

/** iOS masks the corners itself, so the background fills the whole canvas. */
export default function AppleIcon() {
  const glyph = size.width - PADDING * 2;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_HEX.primary,
        }}
      >
        <svg
          width={glyph}
          height={glyph}
          viewBox={LOGO_MARK_TILE_VIEWBOX}
          fill={BRAND_HEX.primaryForeground}
        >
          {LOGO_MARK_PATHS.map(d => (
            <path key={d} d={d} />
          ))}
        </svg>
      </div>
    ),
    size
  );
}
