import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://t3n-store-production.up.railway.app'),
  title: 'تسليم ذاتي',
  description: 'منصة تسليم ذاتي لإدارة التراخيص والمنتجات والمفاتيح والتنزيلات.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'تسليم ذاتي',
    description: 'منصة تسليم ذاتي لإدارة التراخيص والمنتجات والمفاتيح والتنزيلات.',
    images: ['/logo.png'],
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
