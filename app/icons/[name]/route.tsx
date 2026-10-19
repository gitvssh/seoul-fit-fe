import { ImageResponse } from 'next/og';
import {
  BRAND_HEX,
  LOGO_MARK_PATHS,
  LOGO_MARK_TILE_VIEWBOX,
  LOGO_TILE_RADIUS,
} from '@/shared/ui/brand/logo-mark';

/**
 * Web app manifest icons, rendered from the single brand mark at build time.
 * `force-static` + `generateStaticParams` prerenders the three files, so the
 * running image never renders or fetches anything.
 */
export const dynamic = 'force-static';
export const dynamicParams = false;

interface IconSpec {
  size: number;
  /** Maskable icons fill the canvas and keep the glyph inside the central safe zone. */
  maskable: boolean;
}

const ICONS: Record<string, IconSpec> = {
  'icon-192.png': { size: 192, maskable: false },
  'icon-512.png': { size: 512, maskable: false },
  'maskable-512.png': { size: 512, maskable: true },
};

export function generateStaticParams() {
  return Object.keys(ICONS).map(name => ({ name }));
}

function Mark({ size }: Readonly<{ size: number }>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={LOGO_MARK_TILE_VIEWBOX}
      fill={BRAND_HEX.primaryForeground}
    >
      {LOGO_MARK_PATHS.map(d => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const icon = ICONS[name];
  if (!icon) {
    return new Response('Not found', { status: 404 });
  }

  const content = icon.maskable ? (
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
      <Mark size={Math.round(icon.size * 0.6)} />
    </div>
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: Math.round(icon.size * LOGO_TILE_RADIUS),
          background: BRAND_HEX.primary,
        }}
      >
        <Mark size={icon.size} />
      </div>
    </div>
  );

  return new ImageResponse(content, { width: icon.size, height: icon.size });
}
