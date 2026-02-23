'use client';

import { useDocuments } from '../hooks/useDocuments';
import { TEMPLATE_ICONS } from '@/features/templates/icons/templateIcons';
import styles from './RecentDocuments.module.css';

const iconToneClass: Record<string, string> = {
  peach: styles.docIconPeach,
  sage: styles.docIconSage,
  sand: styles.docIconSand,
};

export const RecentDocuments = () => {
  const { documents } = useDocuments();
  const recentDocs = documents.slice(0, 10); // Show only the 10 most recent

  return (
    <div className={styles.recentMenu}>
      <div className={styles.recentMenuHeader}>
        <div className={styles.recentMenuHeaderLabel}>Recent Documents</div>
      </div>
      <div className={styles.recentMenuSeparator} />
      <div className={styles.recentMenuSection}>
        {recentDocs.length === 0 ? (
          <div className={styles.emptyState}>
            No recent documents
          </div>
        ) : (
          recentDocs.map((doc, index) => {
            const IconComp = TEMPLATE_ICONS[doc.iconKey as keyof typeof TEMPLATE_ICONS];
            
            return (
              <div key={doc.id}>
                <div className={styles.recentMenuItem}>
                  <div className={`${styles.docIcon} ${iconToneClass[doc.tone]}`}>
                    {IconComp && (
                      <IconComp
                        style={{
                          width: 18,
                          height: 18,
                        }}
                      />
                    )}
                  </div>
                  <div className={styles.docInfo}>
                    <div className={styles.docTitle}>{doc.title}</div>
                    <div className={styles.docMeta}>{doc.meta}</div>
                  </div>
                </div>
                {index < recentDocs.length - 1 && (
                  <div className={styles.recentMenuRowSeparator} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}