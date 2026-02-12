import Link from 'next/link';
import styles from '../app/home.module.css';

export default function TemplateCard() {
  return (
    <Link href="/templates/1" className={styles.templateCard}>
      <div className={styles.templateCardImage} />
      <div className={styles.templateCardBody}>
        <div className={styles.templateCardTitle}>Project Proposal</div>
        <div className={styles.templateCardDesc}>
          Client-ready proposal with scope, pricing &amp; timeline
        </div>
      </div>
    </Link>
  );
}
