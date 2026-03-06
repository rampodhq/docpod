"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { documentsApi } from "@/features/documents/api/documents.api";
import type { Document, DocumentContent } from "@/features/documents/types/documents.types";
import styles from "./page.module.css";

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [documentData, setDocumentData] = useState<Document | null>(null);
  const [content, setContent] = useState<DocumentContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [doc, docContent] = await Promise.all([
          documentsApi.getById(id),
          documentsApi.getContent(id),
        ]);
        if (ignore) return;
        setDocumentData(doc);
        setContent(docContent);
      } catch (error) {
        if (ignore) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load document.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [id]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push("/documents")}>
          Back to History
        </button>
      </div>

      {isLoading && <div className={styles.stateCard}>Loading document...</div>}

      {!isLoading && errorMessage && <div className={styles.stateCard}>Could not load document: {errorMessage}</div>}

      {!isLoading && !errorMessage && documentData && (
        <div className={styles.viewer}>
          <div className={styles.meta}>
            <h1 className={styles.title}>{documentData.title}</h1>
            <div className={styles.sub}>
              Status: {documentData.status} · Updated: {new Date(documentData.updated_at).toLocaleString("en-US")}
            </div>
          </div>

          <article className={styles.content}>
            {content?.content_markdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.content_markdown}</ReactMarkdown>
            ) : (
              <div className={styles.emptyContent}>No generated content is available for this document yet.</div>
            )}
          </article>
        </div>
      )}
    </div>
  );
}
