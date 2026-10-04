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
import './globals.css';
import './portal-luxe.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://t3nn.wtf'),
  title: 'تعن | منصة المنتجات والتراخيص',
  description: 'منصة تسليم ذاتي لإدارة التراخيص والمنتجات والمفاتيح والتنزيلات في مكان واحد.',
  applicationName: 'تعن',
  other: {
    'domain-verification': 'f561f73af26edd3abc46b363f2da1f68f1f5613ba654adf17486a60520e3373b',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
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
    <html lang="ar" dir="rtl" className={`dark ${alexandria.variable}`}>
      <body className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
        <Providers>
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
