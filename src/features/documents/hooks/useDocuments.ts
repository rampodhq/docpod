"use client";

import { useMemo, useState } from "react";
import {
  initialDocuments,
  type ManagedDocument,
} from "../data/documents.data";

export const useDocuments = () => {
  const [documents, setDocuments] =
    useState<ManagedDocument[]>(initialDocuments);

  const [query, setQuery] = useState("");

  const filteredDocuments = useMemo(() => {
    if (!query.trim()) return documents;

    return documents.filter((doc) =>
      doc.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [documents, query]);

  const deleteDocument = (id: string) => {
    setDocuments((prev) =>
      prev.filter((doc) => doc.id !== id)
    );
  };

  const duplicateDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    const duplicated = {
      ...doc,
      id: crypto.randomUUID(),
      title: `${doc.title} (Copy)`,
    };

    setDocuments((prev) => [duplicated, ...prev]);
  };

  const downloadDocument = (id: string) => {
    alert(`Downloading document ${id} (mock)`);
  };

  return {
    documents: filteredDocuments,
    totalCount: filteredDocuments.length,
    query,
    setQuery,
    deleteDocument,
    duplicateDocument,
    downloadDocument,
  };
};
