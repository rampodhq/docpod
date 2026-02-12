import Link from 'next/link';
import BuilderShell from '../../../../components/builder/BuilderShell';
import styles from '../../../../components/builder/builder.module.css';

const outlineItems = [
  'Executive Summary',
  'Scope of Work',
  'Timeline',
  'Pricing Table',
];

const inputFields = [
  { label: 'Client Problem', required: true },
  { label: 'Proposed Solution', required: true },
];

export default function TemplateEditPage() {
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

          <div className={styles.sidebarSectionTitle}>Template Outline</div>
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

          <button className={styles.sidebarFooterAdd}>+ Add Section</button>
        </>
      }
      main={
        <div className={styles.editor}>
          <div className={styles.editorActions}>
            <Link href="/templates" className={styles.cancelLink}>
              Cancel
            </Link>
            <button className={styles.primaryButton}>Save Template</button>
          </div>
          <div className={styles.editorHeader}>
            <div className={styles.editorTitle}>
              <div className={styles.editorIcon} />
              <div>
                <div className={styles.editorHeading}>Executive Summary</div>
                <div className={styles.editorSubheading}>Section Type</div>
              </div>
            </div>
            <button className={styles.previewButton}>Preview</button>
          </div>

          <div className={styles.selectRow}>
            <span>Paragraph</span>
            <span className={styles.selectCaret}>⌄</span>
          </div>

          <div className={styles.inputPrompt}>What should this section contain?</div>
          <div className={styles.textArea}>
            Summarize the client&apos;s problem and explain the proposed solution
            clearly.
          </div>

          <div className={styles.inputHeader}>
            Input Fields <span className={styles.infoDot}>?</span>
          </div>

          <div className={styles.inputList}>
            {inputFields.map((field) => (
              <div key={field.label} className={styles.inputCard}>
                <div className={styles.inputCardHeader}>
                  <span>{field.label}</span>
                  {field.required && <span className={styles.required}>Required</span>}
                </div>
                <div className={styles.inputPlaceholder}>Short text</div>
              </div>
            ))}
          </div>

          <button className={styles.addInput}>+ Add Input Field</button>
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
            <div className={styles.previewBlock} />
            <div className={styles.previewBlock} />
            <div className={styles.previewBlockShort} />
            <div className={styles.previewPanelFooter}>
              <div className={styles.previewOptionActive}>Executive</div>
              <div className={styles.previewOption}>Minimal</div>
              <div className={styles.previewOption}>Academic</div>
            </div>
          </div>
          <button className={styles.previewSave}>Save Template</button>
        </>
      }
    />
  );
}
