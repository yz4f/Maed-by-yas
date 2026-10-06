import type { Metadata } from 'next';
import localFont from 'next/font/local';

const alexandria = localFont({
  src: '../public/fonts/alexandria-variable.woff2',
  variable: '--font-alexandria',
  weight: '100 900',
  display: 'swap',
  preload: true,
  fallback: ['Arial', 'sans-serif'],
});
const arabic = localFont({
  src: [
    { path: '../public/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-arabic',
  display: 'swap',
  preload: false,
});
const saudi = localFont({
  src: [
    { path: '../public/fonts/saudi-web-regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/saudi-web-bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-saudi',
  display: 'swap',
  preload: false,
});
import './globals.css';
import './portal-luxe.css';
import { Providers } from './providers';
import { CopyProtection } from '@/components/security/copy-protection';

export const metadata: Metadata = {
  metadataBase: new URL('https://t3nn.wtf'),
  title: 'تعن | منصة المنتجات والتراخيص',
  description: 'منصة تسليم ذاتي لإدارة التراخيص والمنتجات والمفاتيح والتنزيلات في مكان واحد.',
  applicationName: 'تعن',
  other: {
    'domain-verification': 'f561f73af26edd3abc46b363f2da1f68f1f5613ba654adf17486a60520e3373b',
  },
  icons: {
    icon: '/logo-256.png',
    shortcut: '/logo-256.png',
    apple: '/logo-256.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: 'https://t3nn.wtf',
    siteName: 'تعن',
    title: 'تعن | منصة المنتجات والتراخيص',
    description: 'إدارة التراخيص والمنتجات والمفاتيح والتنزيلات بسهولة وأمان.',
    images: [
      {
        url: '/t3n-social-preview.png',
        width: 1672,
        height: 941,
        alt: 'T3N — t3nn.wtf',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'تعن | منصة المنتجات والتراخيص',
    description: 'إدارة التراخيص والمنتجات والمفاتيح والتنزيلات بسهولة وأمان.',
    images: ['/t3n-social-preview.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`dark ${saudi.variable} ${arabic.variable} ${alexandria.variable}`}>
      <body className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
        <Providers>
          <CopyProtection />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
