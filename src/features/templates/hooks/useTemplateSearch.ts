"use client";

import { useEffect, useMemo, useState } from "react";
import type { Template } from "../data/templates.data";
import { templatesApi } from "../api/templates.api";
import { mapSummaryToHomeTemplate } from "../lib/templateMappers";

export const useTemplateSearch = () => {
  const [query, setQuery] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      try {
        const response = await templatesApi.list();
        if (ignore) return;
        setTemplates(response.items.map(mapSummaryToHomeTemplate));
      } catch {
        if (!ignore) {
          setTemplates([]);
        }
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredTemplates = useMemo<Template[]>(() => {
    if (!query.trim()) return templates;

    return templates.filter((template) =>
      template.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, templates]);

  return {
    query,
    setQuery,
    templates: filteredTemplates,
    hasResults: filteredTemplates.length > 0,
  };
};
