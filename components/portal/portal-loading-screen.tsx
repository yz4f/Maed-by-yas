import Image from 'next/image';
import styles from './portal-loading-screen.module.css';

export function PortalLoadingScreen() {
  return (
    <div className={styles.screen} dir="rtl" role="status" aria-busy="true" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.mark} aria-hidden="true">
          <Image src="/logo-256.png" width={54} height={54} alt="" priority />
        </div>
        <p className={styles.brand}>تعن</p>
        <h1 className={styles.title}>جارٍ تجهيز صفحتك</h1>
        <p className={styles.description}>لحظات وتظهر لك المنتجات والخدمات.</p>
        <div className={styles.progress} aria-hidden="true" />
      </div>
    </div>
  );
}
