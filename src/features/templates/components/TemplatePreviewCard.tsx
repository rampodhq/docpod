"use client";

import type { Template } from "../data/templates.data";
import styles from "./TemplatePreviewCard.module.css";
import { useRouter } from "next/navigation";
import {
  TEMPLATE_ICONS,
  TEMPLATE_ICON_KEYS,
  type TemplateIconKey,
} from "../icons/templateIcons";
import { paths } from "@/shared/lib/paths";

interface Props {
  template: Template;
}

export const TemplatePreviewCard = ({ template }: Props) => {
  const router = useRouter();
  const fallbackIcon: TemplateIconKey = "DocumentText";
  const iconKey =
    template.icon && TEMPLATE_ICON_KEYS.includes(template.icon as TemplateIconKey)
      ? (template.icon as TemplateIconKey)
      : fallbackIcon;
  const IconComponent = TEMPLATE_ICONS[iconKey];

  return (
    <div
      className={styles.card}
      onClick={() => router.push(paths.createTemplate(template.id))}
    >
      <div className={styles.icon}>
        <IconComponent className={styles.iconSvg} />
      </div>
      <div>
        <h3 className={styles.title}>{template.name}</h3>
        <p className={styles.description}>
          {template.description}
        </p>
      </div>
    </div>
  );
};
