import styles from '../app/home.module.css';

const recentDocs = ['Menu Label', 'Menu Label', 'Menu Label'];

export default function RecentDocuments() {
  return (
    <div className={styles.recentMenu}>
      <div className={styles.recentMenuHeader}>
        <div className={styles.recentMenuHeaderLabel}>Recent Documents</div>
      </div>
      <div className={styles.recentMenuSeparator} />
      <div className={styles.recentMenuSection}>
        {recentDocs.map((label, index) => (
          <div className={styles.recentMenuItemSimple} key={`${label}-${index}`}>
            <span className={styles.recentMenuItemLabel}>{label}</span>
            {index < recentDocs.length - 1 && (
              <div className={styles.recentMenuRowSeparator} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}