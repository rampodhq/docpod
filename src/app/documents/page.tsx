import Input from '../../components/ui/Input';
import styles from './documents.module.css';

const documents = [
  {
    title: 'Project Proposal',
    meta: 'Project Proposal · May 1, 2024',
    icon: '🗂️',
    tone: 'peach',
  },
  {
    title: 'SOP',
    meta: 'Standard Operating Procedure · April 28, 2024',
    icon: '🧾',
    tone: 'sage',
  },
  {
    title: 'Weekly Status Update',
    meta: 'Status Update · April 25, 2024',
    icon: '📝',
    tone: 'peach',
  },
  {
    title: 'Meeting Notes',
    meta: 'Meeting Notes · April 22, 2024',
    icon: '🗒️',
    tone: 'sage',
  },
  {
    title: 'Milestone Report',
    meta: 'Progress Report · April 19, 2024',
    icon: '📊',
    tone: 'sand',
  },
  {
    title: 'Client Feedback Summary',
    meta: 'Client Feedback · April 18, 2024',
    icon: '💬',
    tone: 'peach',
  },
];

const iconToneClass: Record<string, string> = {
  peach: styles.docIconPeach,
  sage: styles.docIconSage,
  sand: styles.docIconSand,
};

export default function DocumentsPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>Document History</h1>
            <p className={styles.subtitle}>
              Track, organize, and revisit everything you have created.
            </p>
          </div>
          <div className={styles.searchWrap}>
            <div className={styles.searchBar}>
              <Input
                placeholder="Search documents..."
                className={styles.searchInput}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
          </div>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Recent Documents</span>
            <button className={styles.actionsButton} type="button">
              ⚙️ Actions ▾
            </button>
          </div>
          <div className={styles.cardBody}>
            {documents.map((doc, index) => (
              <div className={styles.row} key={doc.title}>
                <div className={styles.rowLeft}>
                  <div
                    className={`${styles.docIcon} ${
                      iconToneClass[doc.tone]
                    }`}
                  >
                    {doc.icon}
                  </div>
                  <div className={styles.rowText}>
                    <div className={styles.rowTitle}>{doc.title}</div>
                    <div className={styles.rowMeta}>{doc.meta}</div>
                  </div>
                </div>
                <div className={styles.rowRight}>
                  <button className={styles.openButton} type="button">
                    Open ▾
                  </button>
                  {index === 1 && (
                    <div className={styles.menu}>
                      <div className={styles.menuItem}>📄 Duplicate</div>
                      <div
                        className={`${styles.menuItem} ${styles.menuItemAccent}`}
                      >
                        ⬇️ Download DOCX
                      </div>
                      <div
                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                      >
                        🗑️ Delete
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.cardFooter}>Showing 6 recent documents</div>
        </section>
      </main>
    </div>
  );
}
