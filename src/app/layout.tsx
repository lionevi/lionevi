import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from '@/app/providers';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/constants';
import { publicEnv } from '@/lib/env';
import '@/app/globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
  title: {
    default: `${APP_NAME} — la marketplace des idees`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ['idees', 'projets', 'entrepreneuriat', 'Afrique', 'marketplace', 'business plan'],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#E8622A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <html lang="fr" className={`${sora.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
