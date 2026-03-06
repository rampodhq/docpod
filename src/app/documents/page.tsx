"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/shared/ui";
import { Search } from "lucide-react";
import styles from "./documents.module.css";
import { useDocuments } from "@/features/documents/hooks/useDocuments";
import { paths } from "@/shared/lib/paths";
import {
  TEMPLATE_ICONS,
} from "@/features/templates/icons/templateIcons";

const iconToneClass: Record<string, string> = {
  peach: styles.docIconPeach,
  sage: styles.docIconSage,
  sand: styles.docIconSand,
};

export default function DocumentsPage() {
  const router = useRouter();
  const {
    documents,
    totalCount,
    isLoading,
    errorMessage,
    query,
    setQuery,
    deleteDocument,
    duplicateDocument,
    downloadDocument,
  } = useDocuments();

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick
      );
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>
              Document History
            </h1>
            <p className={styles.subtitle}>
              Track, organize, and revisit everything
              you have created.
            </p>
          </div>

          <div className={styles.searchWrap}>
            <div className={styles.searchBar}>
              <Input
                placeholder="Search documents..."
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                className={styles.searchInput}
              />
              <span className={styles.searchIcon}>
                <Search size={20} />
              </span>
            </div>
          </div>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
              Recent Documents
            </span>
          </div>

          <div className={styles.cardBodyWrapper}>
            <div className={styles.cardBody}>
              {isLoading ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>⏳</div>
                  <p className={styles.emptyText}>Loading documents...</p>
                </div>
              ) : errorMessage ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>⚠️</div>
                  <p className={styles.emptyText}>Could not load documents.</p>
                  <p className={styles.emptySubtext}>{errorMessage}</p>
                </div>
              ) : documents.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📄</div>
                  <p className={styles.emptyText}>No documents found.</p>
                  <p className={styles.emptySubtext}>Create your first document to get started</p>
                </div>
              ) : (
                documents.map((doc) => {
                  const IconComp =
                    TEMPLATE_ICONS[
                      doc.iconKey as keyof typeof TEMPLATE_ICONS
                    ];

                  return (
                    <div
                      className={styles.row}
                      key={doc.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(paths.documentDetails(doc.id))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(paths.documentDetails(doc.id));
                        }
                      }}
                    >
                      <div className={styles.rowLeft}>
                        <div
                          className={`${styles.docIcon} ${
                            iconToneClass[doc.tone]
                          }`}
                        >
                          {IconComp && (
                            <IconComp
                              style={{
                                width: 22,
                                height: 22,
                              }}
                            />
                          )}
                        </div>

                        <div
                          className={styles.rowText}
                        >
                          <div
                            className={
                              styles.rowTitle
                            }
                          >
                            {doc.title}
                          </div>
                          <div
                            className={
                              styles.rowMeta
                            }
                          >
                            {doc.meta}
                          </div>
                        </div>
                      </div>

                      <div
                        className={styles.rowRight}
                        ref={menuRef}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className={
                            styles.openButton
                          }
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === doc.id
                                ? null
                                : doc.id
                            )
                          }
                        >
                          <span>Actions</span>
                          <svg 
                            width="12" 
                            height="12" 
                            viewBox="0 0 12 12" 
                            fill="none"
                            className={`${styles.chevron} ${openMenuId === doc.id ? styles.chevronOpen : ''}`}
                          >
                            <path 
                              d="M2.5 4.5L6 8L9.5 4.5" 
                              stroke="currentColor" 
                              strokeWidth="1.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        {openMenuId === doc.id && (
                          <div className={styles.menu}>
                            <button
                              className={
                                styles.menuItem
                              }
                              onClick={() => {
                                duplicateDocument(doc.id);
                                setOpenMenuId(null);
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M13.5 5.5V13.5H5.5V5.5H13.5ZM13.5 4H5.5C4.67 4 4 4.67 4 5.5V13.5C4 14.33 4.67 15 5.5 15H13.5C14.33 15 15 14.33 15 13.5V5.5C15 4.67 14.33 4 13.5 4ZM10.5 1H2.5C1.67 1 1 1.67 1 2.5V10.5H2.5V2.5H10.5V1Z" fill="currentColor"/>
                              </svg>
                              <span>Duplicate</span>
                            </button>

                            <button
                              className={`${styles.menuItem} ${styles.menuItemAccent}`}
                              onClick={() => {
                                downloadDocument(doc.id);
                                setOpenMenuId(null);
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M14 11V14H2V11H0.5V14C0.5 14.825 1.175 15.5 2 15.5H14C14.825 15.5 15.5 14.825 15.5 14V11H14ZM13.25 6.5L12.1925 5.4425L8.75 8.8775V0.5H7.25V8.8775L3.8075 5.4425L2.75 6.5L8 11.75L13.25 6.5Z" fill="currentColor"/>
                              </svg>
                              <span>Download DOCX</span>
                            </button>

                            <button
                              className={`${styles.menuItem} ${styles.menuItemDanger}`}
                              onClick={() => {
                                deleteDocument(doc.id);
                                setOpenMenuId(null);
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 14C4 14.55 4.45 15 5 15H11C11.55 15 12 14.55 12 14V4H4V14ZM13 2H10.5L9.5 1H6.5L5.5 2H3V3.5H13V2Z" fill="currentColor"/>
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className={styles.cardFooter}>
            Showing {totalCount} recent documents
          </div>
        </section>
      </main>
    </div>
  );
}
