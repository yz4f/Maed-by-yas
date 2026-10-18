import Image from 'next/image';
import styles from './portal-loading-screen.module.css';

export function PortalLoadingScreen() {
  return (
    <div className={styles.screen} dir="rtl" role="status" aria-busy="true" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.spinner} aria-hidden="true">
          <div className={styles.mark}>
            <Image src="/logo-256.png" width={52} height={52} alt="" priority />
          </div>
        </div>
        <p className={styles.brand}>تعن</p>
        <h1 className={styles.title}>جارٍ الدخول</h1>
        <p className={styles.description}>نجهّز لك المنتجات والخدمات في لحظات.</p>
        <span className={styles.detail} aria-hidden="true"><i /><i /><i /></span>
      </div>
    </div>
  );
}
