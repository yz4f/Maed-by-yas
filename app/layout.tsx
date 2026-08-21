import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://t3nn.wtf'),
  title: 'T3N | منصة تسليم ذاتي',
  description: 'منصة تسليم ذاتي لإدارة التراخيص والمنتجات والمفاتيح والتنزيلات في مكان واحد.',
  applicationName: 'T3N',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: 'https://t3nn.wtf',
    siteName: 'T3N',
    title: 'T3N | منصة تسليم ذاتي',
    description: 'إدارة التراخيص والمنتجات والمفاتيح والتنزيلات بسهولة وأمان.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'T3N — منصة تسليم ذاتي للتراخيص والمنتجات',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'T3N | منصة تسليم ذاتي',
    description: 'إدارة التراخيص والمنتجات والمفاتيح والتنزيلات بسهولة وأمان.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
        <Providers>
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
