import Link from 'next/link';
import styles from './templates.module.css';

const templates = [
  {
    title: 'Project Proposal',
    subtitle: 'Project Proposal',
    tag: 'Business',
    tint: 'peach',
  },
  {
    title: 'Standard Operating Procedure (SOP)',
    subtitle: 'Project Proposal',
    tag: 'Ops',
    tint: 'blue',
  },
  {
    title: 'Status Update',
    subtitle: 'Status Update',
    tag: 'Ops',
    tint: 'sage',
  },
  {
    title: 'Meeting Notes',
    subtitle: 'Status Update',
    tag: 'Ops',
    tint: 'sage',
  },
  {
    title: 'Status Update',
    subtitle: 'Status Update',
    tag: 'Ops',
    tint: 'peach',
  },
];

export default function TemplatesPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Template Management</div>
          <div className={styles.pageSubtitle}>My Templates</div>
        </div>
        <button className={styles.actionsButton}>Actions</button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.sectionTitle}>My Templates</div>
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search templates..."
          />
        </div>
      </div>

      <div className={styles.cardPanel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTabs}>
            <span className={styles.panelTabActive}>My Templates</span>
            <span className={styles.panelTabCount}>4</span>
          </div>
          <button className={styles.actionsButtonSmall}>Actions</button>
        </div>

        <div className={styles.grid}>
          {templates.map((template) => (
            <div key={template.title} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles[template.tint]}`} />
                <div>
                  <div className={styles.cardTitle}>{template.title}</div>
                  <div className={styles.cardSubtitle}>{template.subtitle}</div>
                </div>
                <button className={styles.cardMenu}>⋯</button>
              </div>
              <span className={styles.cardTag}>{template.tag}</span>
            </div>
          ))}

          <Link href="/templates/1/edit" className={styles.createCard}>
            <div className={styles.createIcon}>+</div>
            <div className={styles.createTitle}>Create Template</div>
            <div className={styles.createSubtitle}>
              Design a custom document blueprint
            </div>
          </Link>
        </div>

        <div className={styles.panelFooter}>Showing 4 templates</div>
      </div>
    </div>
  );
}
