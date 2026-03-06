"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import styles from "./templates.module.css";
import { useManagedTemplates } from "@/features/templates/hooks/useManagedTemplates";
import { useState } from "react";
import {
  TEMPLATE_ICONS,
  TEMPLATE_ICON_KEYS,
  type TemplateIconKey,
} from "@/features/templates/icons/templateIcons";
import { paths } from "@/shared/lib/paths";

export default function TemplatesPage() {
  const router = useRouter();

  const {
    templates,
    totalCount,
    isLoading,
    query,
    setQuery,
    deleteTemplate,
    createTemplate,
  } = useManagedTemplates();

  const [openMenuId, setOpenMenuId] = useState<string | null>(
    null
  );

  const handleCreateTemplate = async () => {
    const newId = await createTemplate();
    router.push(paths.editTemplate(newId));
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>
            Template Management
          </div>
          <div className={styles.pageSubtitle}>
            Manage and organize your templates
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>
            <Search size={20} />
          </span>
          <input
            className={styles.searchInput}
            placeholder="Search templates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.cardPanel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTabs}>
            <span className={styles.panelTabActive}>
              My Templates
            </span>
            <span className={styles.panelTabCount}>
              {totalCount}
            </span>
          </div>
        </div>

        <div className={styles.grid}>
          {isLoading ? (
            <div style={{ padding: 40 }}>
              Loading templates...
            </div>
          ) : templates.length > 0 ? (
            templates.map((template) => {
              const iconKey =
                template.icon && TEMPLATE_ICON_KEYS.includes(template.icon as TemplateIconKey)
                  ? (template.icon as TemplateIconKey)
                  : "DocumentText";
              const IconComponent = TEMPLATE_ICONS[iconKey];
              return (
                <div
                  key={template.id}
                  className={styles.card}
                  onClick={() =>
                    router.push(paths.editTemplate(template.id))
                  }
                >
                <div className={styles.cardHeader}>
                  <div
                    className={`${styles.cardIcon} ${
                      styles[template.tint]
                    }`}
                  >
                    <IconComponent className={styles.cardIconSvg} />
                  </div>
                  <div>
                    <div className={styles.cardTitle}>
                      {template.title}
                    </div>
                    <div className={styles.cardSubtitle}>
                      {template.subtitle}
                    </div>
                  </div>

                  {/* 3-Dot Menu */}
                  <div
                    className={styles.menuWrapper}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={styles.cardMenu}
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === template.id
                            ? null
                            : template.id
                        )
                      }
                    >
                      ⋯
                    </button>

                    {openMenuId === template.id && (
                      <div className={styles.dropdown}>
                        <button
                          className={styles.dropdownItem}
                          onClick={() =>
                            router.push(paths.editTemplate(template.id))
                          }
                        >
                          Edit
                        </button>

                        <button
                          className={`${styles.dropdownItem} ${styles.danger}`}
                          onClick={async () => {
                            await deleteTemplate(template.id);
                            setOpenMenuId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <span className={styles.cardTag}>
                  {template.tag}
                </span>
                </div>
              );
            })
          ) : (
            <div style={{ padding: 40 }}>
              No templates found.
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateTemplate}
            className={styles.createCard}
          >
            <div className={styles.createIcon}>+</div>
            <div className={styles.createTitle}>
              Create Template
            </div>
            <div className={styles.createSubtitle}>
              Design a custom document blueprint
            </div>
          </button>
        </div>

        <div className={styles.panelFooter}>
          Showing {templates.length} templates
        </div>
      </div>
    </div>
  );
}
