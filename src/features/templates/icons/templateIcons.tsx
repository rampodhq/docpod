"use client";

import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BriefcaseIcon,
  ChartBarIcon,
  PencilSquareIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

export type TemplateIconKey =
  | "DocumentText"
  | "Clipboard"
  | "Briefcase"
  | "ChartBar"
  | "Pencil"
  | "Settings";

export const TEMPLATE_ICONS: Record<
  TemplateIconKey,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  DocumentText: DocumentTextIcon,
  Clipboard: ClipboardDocumentListIcon,
  Briefcase: BriefcaseIcon,
  ChartBar: ChartBarIcon,
  Pencil: PencilSquareIcon,
  Settings: Cog6ToothIcon,
};

export const TEMPLATE_ICON_KEYS: TemplateIconKey[] = [
  "DocumentText",
  "Clipboard",
  "Briefcase",
  "ChartBar",
  "Pencil",
  "Settings",
];
