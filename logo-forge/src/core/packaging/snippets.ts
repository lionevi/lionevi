import type { BrandInfo } from '@/types';
import { FAVICON_SIZES } from '@core/presets/social';

/**
 * Extraits prets a coller livres avec le pack. C est la difference concrete
 * entre livrer des fichiers et livrer une integration : le developpeur qui
 * recoit le pack n a plus a deviner les balises ni les dimensions.
 */

export function renderFaviconHtml(brand: BrandInfo): string {
  const lines = FAVICON_SIZES.filter((s) => s.id.startsWith('favicon-')).map(
    (s) =>
      `<link rel="icon" type="image/png" sizes="${s.size}x${s.size}" href="/favicon-${s.size}x${s.size}.png" />`,
  );
  return [
    '<!-- Logo Forge — favicons -->',
    '<link rel="icon" href="/favicon.ico" sizes="any" />',
    ...lines,
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-180x180.png" />',
    '<link rel="manifest" href="/site.webmanifest" />',
    `<meta name="apple-mobile-web-app-title" content="${brand.name}" />`,
  ].join('\n');
}

export function renderWebManifest(brand: BrandInfo): string {
  const themeColor = brand.colors[0]?.hex ?? '#000000';
  return `${JSON.stringify(
    {
      name: brand.name,
      short_name: brand.name,
      icons: [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
      theme_color: themeColor,
      background_color: '#ffffff',
      display: 'standalone',
    },
    null,
    2,
  )}\n`;
}

export function renderCssVariables(brand: BrandInfo): string {
  if (brand.colors.length === 0) return ':root {\n}\n';
  const slug = (name: string) =>
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  const lines = brand.colors.map((c) => `  --${slug(c.name)}: ${c.hex.toUpperCase()};`);
  return `:root {\n${lines.join('\n')}\n}\n`;
}
