"use client";

import { Button } from "@/shared/ui";
import type { Template } from "../data/templates.data";
import { paths } from "@/shared/lib/paths";
import { useRouter } from "next/navigation";

interface TemplateCardProps {
  template: Template;
  onDelete: (id: string) => void;
}

export const TemplateCard = ({
  template,
  onDelete,
}: TemplateCardProps) => {
  const router = useRouter();

  return (
    <div className="border rounded-lg p-4 flex justify-between items-start">
      <div>
        <h3 className="font-semibold">{template.name}</h3>
        <p className="text-sm text-gray-500">
          {template.description}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => router.push(paths.editTemplate(template.id))}
        >
          Edit
        </Button>

        <Button
          variant="danger"
          onClick={() => onDelete(template.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
