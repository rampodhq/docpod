"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { documentsApi } from "../api/documents.api";
import { templatesApi } from "@/features/templates/api/templates.api";
import type { Document } from "../types/documents.types";
import { TEMPLATE_ICON_KEYS, type TemplateIconKey } from "@/features/templates/icons/templateIcons";

type DocumentTone = "peach" | "sage" | "sand";

export type ManagedDocument = {
  id: string;
  title: string;
  meta: string;
  iconKey: TemplateIconKey;
  tone: DocumentTone;
};

const inferTone = (icon: string | null | undefined): DocumentTone => {
  if (icon === "ChartBar") return "sand";
  if (icon === "Settings" || icon === "Clipboard") return "sage";
  return "peach";
};

const toDisplayDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const mapStatusLabel = (status: Document["status"]): string => {
  if (status === "COMPLETED") return "Generated";
  if (status === "FAILED") return "Failed";
  if (status === "CANCELLED") return "Cancelled";
  if (status === "GENERATING") return "Generating";
  return "Queued";
};

export const useDocuments = () => {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [docsResponse, templatesResponse] = await Promise.all([
        documentsApi.list({ limit: 200, offset: 0 }),
        templatesApi.list({ limit: 200, offset: 0 }),
      ]);

      const templateMap = new Map(
        templatesResponse.items.map((item) => [
          item.id,
          {
            name: item.name,
            icon: item.icon,
          },
        ])
      );

      const mapped: ManagedDocument[] = docsResponse.items.map((doc) => {
        const tpl = templateMap.get(doc.template_id);
        const rawIcon = tpl?.icon ?? "DocumentText";
        const iconKey = TEMPLATE_ICON_KEYS.includes(rawIcon as TemplateIconKey)
          ? (rawIcon as TemplateIconKey)
          : "DocumentText";
        const templateName = tpl?.name ?? "Template";
        const statusLabel = mapStatusLabel(doc.status);
        const meta = `${templateName} · ${statusLabel} · ${toDisplayDate(doc.updated_at)}`;
        return {
          id: doc.id,
          title: doc.title,
          meta,
          iconKey,
          tone: inferTone(rawIcon),
        };
      });

      setDocuments(mapped);
    } catch (error) {
      setDocuments([]);
      setErrorMessage(error instanceof Error ? error.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocuments = useMemo(() => {
    if (!query.trim()) return documents;
    const q = query.toLowerCase();
    return documents.filter((doc) => doc.title.toLowerCase().includes(q) || doc.meta.toLowerCase().includes(q));
  }, [documents, query]);

  const deleteDocument = (_id: string) => {
    alert("Delete is not available yet.");
  };

  const duplicateDocument = (_id: string) => {
    alert("Duplicate is not available yet.");
  };

  const downloadDocument = async (id: string) => {
    try {
      const content = await documentsApi.getContent(id);
      const markdown = content.content_markdown;
      if (!markdown) {
        alert("No generated content available for download yet.");
        return;
      }
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document_${id}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to download document.");
    }
  };

  return {
    documents: filteredDocuments,
    totalCount: filteredDocuments.length,
    isLoading,
    errorMessage,
    query,
    setQuery,
    reloadDocuments: loadDocuments,
    deleteDocument,
    duplicateDocument,
    downloadDocument,
  };
};
