/**
 * Gabarits de canvas des plateformes sociales.
 *
 * Chaque entree est un canvas *exact* : le logo y est centre et mis a l'echelle
 * dans la zone utile, ce qui evite le recadrage automatique qui ampute les
 * logos horizontaux sur les avatars circulaires.
 */
export interface SocialSize {
  id: string;
  platform: string;
  label: string;
  width: number;
  height: number;
  /** Fraction du canvas reellement occupee par le logo (marge de securite). */
  safeArea: number;
  /** L'avatar est rogne en cercle : privilegier un asset « icon ». */
  circular?: boolean;
}

export const SOCIAL_SIZES: readonly SocialSize[] = [
  {
    id: 'facebook-profile',
    platform: 'Facebook',
    label: 'Photo de profil',
    width: 500,
    height: 500,
    safeArea: 0.7,
    circular: true,
  },
  {
    id: 'facebook-cover',
    platform: 'Facebook',
    label: 'Couverture de page',
    width: 820,
    height: 312,
    safeArea: 0.6,
  },
  {
    id: 'instagram-profile',
    platform: 'Instagram',
    label: 'Photo de profil',
    width: 320,
    height: 320,
    safeArea: 0.7,
    circular: true,
  },
  {
    id: 'instagram-post',
    platform: 'Instagram',
    label: 'Publication carree',
    width: 1080,
    height: 1080,
    safeArea: 0.6,
  },
  {
    id: 'instagram-story',
    platform: 'Instagram',
    label: 'Story',
    width: 1080,
    height: 1920,
    safeArea: 0.5,
  },
  {
    id: 'linkedin-logo',
    platform: 'LinkedIn',
    label: 'Logo d entreprise',
    width: 300,
    height: 300,
    safeArea: 0.75,
  },
  {
    id: 'linkedin-cover',
    platform: 'LinkedIn',
    label: 'Banniere',
    width: 1128,
    height: 191,
    safeArea: 0.6,
  },
  {
    id: 'x-profile',
    platform: 'X',
    label: 'Photo de profil',
    width: 400,
    height: 400,
    safeArea: 0.7,
    circular: true,
  },
  { id: 'x-header', platform: 'X', label: 'Banniere', width: 1500, height: 500, safeArea: 0.6 },
  {
    id: 'youtube-avatar',
    platform: 'YouTube',
    label: 'Icone de chaine',
    width: 800,
    height: 800,
    safeArea: 0.7,
    circular: true,
  },
  {
    id: 'youtube-banner',
    platform: 'YouTube',
    label: 'Banniere de chaine',
    width: 2560,
    height: 1440,
    safeArea: 0.4,
  },
  {
    id: 'tiktok-profile',
    platform: 'TikTok',
    label: 'Photo de profil',
    width: 200,
    height: 200,
    safeArea: 0.7,
    circular: true,
  },
  {
    id: 'whatsapp-business',
    platform: 'WhatsApp',
    label: 'Profil professionnel',
    width: 640,
    height: 640,
    safeArea: 0.7,
    circular: true,
  },
  {
    id: 'discord-server',
    platform: 'Discord',
    label: 'Icone de serveur',
    width: 512,
    height: 512,
    safeArea: 0.7,
    circular: true,
  },
  {
    id: 'slack-workspace',
    platform: 'Slack',
    label: 'Icone d espace',
    width: 512,
    height: 512,
    safeArea: 0.75,
  },
  {
    id: 'github-org',
    platform: 'GitHub',
    label: 'Avatar d organisation',
    width: 460,
    height: 460,
    safeArea: 0.75,
  },
];

/** Tailles d icones d application, iOS et Android. */
export const APP_ICON_SIZES: readonly { id: string; label: string; size: number }[] = [
  { id: 'ios-1024', label: 'App Store', size: 1024 },
  { id: 'ios-180', label: 'iPhone @3x', size: 180 },
  { id: 'ios-120', label: 'iPhone @2x', size: 120 },
  { id: 'android-512', label: 'Play Store', size: 512 },
  { id: 'android-192', label: 'Android xxxhdpi', size: 192 },
  { id: 'android-144', label: 'Android xxhdpi', size: 144 },
];

/** Tailles de favicon, dont les variantes epinglees iOS et Android. */
export const FAVICON_SIZES: readonly { id: string; label: string; size: number }[] = [
  { id: 'favicon-16', label: 'Onglet', size: 16 },
  { id: 'favicon-32', label: 'Onglet HiDPI', size: 32 },
  { id: 'favicon-48', label: 'Raccourci bureau', size: 48 },
  { id: 'apple-touch-180', label: 'Apple touch icon', size: 180 },
  { id: 'android-chrome-192', label: 'Android Chrome', size: 192 },
  { id: 'android-chrome-512', label: 'PWA maskable', size: 512 },
];
