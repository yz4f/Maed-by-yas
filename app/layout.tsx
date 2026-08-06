import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'تعن',
  description: 'الموقع الرسمي لمنصة تعـن - إدارة المنتجات والمفاتيح وفك حظر الألعاب والتنزيلات.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'تعن',
    description: 'الموقع الرسمي لمنصة تعـن - إدارة المنتجات والمفاتيح وفك حظر الألعاب والتنزيلات.',
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
