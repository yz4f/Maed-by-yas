'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    background: '#071016',
    color: '#EEF8FA',
    fontFamily: 'TA3N Portal, sans-serif',
    direction: 'rtl',
  },
  panel: {
    width: 'min(100%, 480px)',
    padding: '32px',
    border: '1px solid rgba(145, 190, 205, .16)',
    borderRadius: '16px',
    background: '#0A151D',
    textAlign: 'center',
  },
  title: { margin: '0', fontSize: '22px', fontWeight: 600 },
  message: { margin: '12px 0 0', color: '#91A7B2', fontSize: '14px', lineHeight: 1.8 },
  actions: { display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '24px' },
  retry: { minHeight: '42px', padding: '0 16px', border: 0, borderRadius: '9px', background: '#52D8DF', color: '#071016', font: '500 14px TA3N Portal, sans-serif', cursor: 'pointer' },
  home: { display: 'inline-flex', alignItems: 'center', minHeight: '42px', padding: '0 16px', border: '1px solid rgba(145, 190, 205, .2)', borderRadius: '9px', color: '#EEF8FA', textDecoration: 'none', fontSize: '14px' },
  english: { margin: '18px 0 0', color: '#637985', fontSize: '12px', direction: 'ltr' },
};

export function ErrorScreen({ reset }: { reset: () => void }) {
  return (
    <main style={styles.page}>
      <section role="alert" style={styles.panel}>
        <p style={{ ...styles.title, color: '#52D8DF' }}>عتن</p>
        <h1 style={{ ...styles.title, marginTop: '18px' }}>تعذّر تحميل هذه الصفحة</h1>
        <p style={styles.message}>حدث خطأ أثناء تحميل المحتوى. أعد المحاولة، أو ارجع إلى الصفحة الرئيسية.</p>
        <div style={styles.actions}>
          <button type="button" onClick={reset} style={styles.retry}>إعادة المحاولة</button>
          <Link href="/" style={styles.home}>الصفحة الرئيسية</Link>
        </div>
        <p style={styles.english}>The page could not be loaded. Try again or return to the home page.</p>
      </section>
    </main>
  );
}
