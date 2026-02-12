import Link from 'next/link';
import BuilderShell from '../../../components/builder/BuilderShell';
import styles from '../../../components/builder/builder.module.css';

const outlineItems = [
  'Executive Summary',
  'Scope of Work',
  'Pricing Table',
];

const pricingRows = [
  {
    item: 'Initial Strategy Session',
    description: 'Marketing strategy consultation and planning',
    price: '$1,000',
  },
  {
    item: 'Monthly Campaign Management',
    description: 'Ongoing management and optimization of marketing campaigns',
    price: '$3,500',
  },
];

export default function CreateDocumentPage() {
  return (
    <BuilderShell
      sidebar={
        <>
          <div className={styles.templateCard}>
            <div className={styles.templateIcon} />
            <div>
              <div className={styles.templateName}>Project Proposal</div>
              <div className={styles.templateMeta}>Untitled Template</div>
            </div>
          </div>

          <div className={styles.sidebarSectionTitle}>Section Panel</div>
          <div className={styles.outlineList}>
            {outlineItems.map((item, index) => (
              <div
                key={item}
                className={`${styles.outlineItem} ${
                  index === 0 ? styles.outlineItemActive : ''
                }`}
              >
                <div className={styles.outlineIcon} />
                <span>{item}</span>
                <span className={styles.outlineDrag}>⋮⋮</span>
              </div>
            ))}
            <button className={styles.outlineAdd}>+ Add Section</button>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionCardTitle}>Scope of Work</div>
            <div className={styles.sectionCardText}>
              Outline the specific tasks and deliverables for this project.
            </div>
          </div>
        </>
      }
      main={
        <div className={styles.editor}>
          <div className={styles.editorActions}>
            <Link href="/templates" className={styles.cancelLink}>
              Cancel
            </Link>
            <button className={styles.primaryButton}>Download Document</button>
          </div>

          <div className={styles.editorHeader}>
            <div className={styles.editorTitle}>
              <div className={styles.editorIcon} />
              <div>
                <div className={styles.editorHeading}>Project Proposal</div>
                <div className={styles.editorSubheading}>April 22, 2024</div>
              </div>
            </div>
            <button className={styles.previewButton}>Preview</button>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionCardTitle}>Executive Summary</div>
            <div className={styles.sectionCardText}>
              Summarize the client&apos;s problem and proposed solution clearly.
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div>
              <div className={styles.fieldLabel}>Client Problem</div>
              <div className={styles.fieldInput}>
                The client is struggling to manage multiple marketing campaigns
                effectively.
              </div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Proposed Solution</div>
              <div className={styles.fieldInput}>
                We will provide an integrated marketing strategy that
                consolidates all campaigns within a unified platform.
              </div>
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span>Item</span>
              <span>Description</span>
              <span>Price</span>
              <span />
            </div>
            {pricingRows.map((row) => (
              <div className={styles.tableRow} key={row.item}>
                <span>{row.item}</span>
                <span>{row.description}</span>
                <span>{row.price}</span>
                <span className={styles.tableActions}>×</span>
              </div>
            ))}
            <div className={styles.tableFooter}>
              <div className={styles.tableBadge}>+ Add New</div>
              <button className={styles.secondaryButton}>
                Suggest 3 more ideas
              </button>
            </div>
          </div>
        </div>
      }
      preview={
        <>
          <div className={styles.previewHeader}>
            <div className={styles.previewTitle}>Preview</div>
            <span className={styles.previewCaret}>⌄</span>
          </div>
          <div className={styles.previewCard}>
            <div className={styles.previewCardHeader}>
              <div>
                <div className={styles.previewDocTitle}>Project Proposal</div>
                <div className={styles.previewDocDate}>April 22, 2024</div>
              </div>
              <div className={styles.previewBadge}>Preview</div>
            </div>
            <div className={styles.previewDivider} />
            <div className={styles.previewSection}>Executive Summary</div>
            <div className={styles.sectionCardText}>
              The client is struggling to manage multiple marketing campaigns
              effectively.
            </div>
            <div className={styles.sectionCardText}>
              We will provide an integrated marketing strategy that consolidates
              all campaigns within a unified platform.
            </div>
            <div className={styles.previewSection}>Scope of Work</div>
            <div className={styles.sectionCardText}>
              • Develop a comprehensive marketing plan.
            </div>
            <div className={styles.sectionCardText}>
              • Implement email marketing campaigns.
            </div>
            <div className={styles.sectionCardText}>
              • Optimize social media strategy.
            </div>
            <div className={styles.previewSection}>Pricing</div>
            <div className={styles.previewBlock} />
            <div className={styles.previewBlockShort} />
          </div>
          <button className={styles.previewSave}>Download Document</button>
        </>
      }
    />
  );
}
