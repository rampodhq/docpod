"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type ManagedTemplate,
  type Section,
} from "../data/templates.management.data";
import { templatesApi } from "../api/templates.api";
import {
  mapReadToManagedTemplate,
  mapSummaryToTemplateCard,
} from "../lib/templateMappers";

export const useManagedTemplates = () => {
  const [templates, setTemplates] = useState<ManagedTemplate[]>([]);

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await templatesApi.list(
        query.trim() ? { query: query.trim() } : undefined
      );
      setTemplates(response.items.map(mapSummaryToTemplateCard));
    } catch {
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = useMemo(() => templates, [templates]);

  const getTemplateById = (id: string) =>
    templates.find((t) => t.id === id) ?? null;

  const updateTemplate = (
    id: string,
    updated: Partial<ManagedTemplate>
  ) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...updated } : t
      )
    );
  };

  const updateSections = (
    templateId: string,
    sections: Section[]
  ) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId ? { ...t, sections } : t
      )
    );
  };

  const createTemplate = async () => {
    const created = await templatesApi.create({
      name: "Untitled Template",
      description: "New template",
      icon: "DocumentText",
      sections: [],
    });
    const mapped = mapReadToManagedTemplate(created);
    setTemplates((prev) => [mapped, ...prev]);
    return mapped.id;
  };

  const deleteTemplate = async (id: string) => {
    await templatesApi.delete(id);
    setTemplates((prev) =>
      prev.filter((t) => t.id !== id)
    );
  };

  return {
    templates: filteredTemplates,
    totalCount: templates.length,
    isLoading,
    query,
    setQuery,
    getTemplateById,
    updateTemplate,
    updateSections,
    createTemplate,
    deleteTemplate,
  };
};
