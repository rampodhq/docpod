"use client";

import { useState } from "react";
import { initialTemplates, type Template } from "../data/templates.data";

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const createTemplate = (payload: Omit<Template, "id" | "createdAt">) => {
    const newTemplate: Template = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...payload,
    };

    setTemplates((prev) => [newTemplate, ...prev]);
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    deleteTemplate,
  };
};
