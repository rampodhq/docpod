"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";

import { BuilderShell, ContextInputsManager } from "@/features/builder";
import styles from "@/features/builder/components/builder.module.css";

import {
  TEMPLATE_ICONS,
  TEMPLATE_ICON_KEYS,
  type TemplateIconKey,
} from "@/features/templates/icons/templateIcons";
import type { ContextInput } from "@/features/templates/data/templates.management.data";
import { templatesApi } from "@/features/templates/api/templates.api";
import { mapReadToManagedTemplate } from "@/features/templates/lib/templateMappers";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SectionStyle = "paragraph" | "bulleted" | "numbered" | "table" | "quote";

type Section = {
  id: string;
  title: string;
  content: string;
  styles: SectionStyle[]; // Support multiple styles
  contextInputs?: ContextInput[];
  allowAdditionalContext?: boolean;
};

function StyleLabel(style: SectionStyle): string {
  switch (style) {
    case "paragraph":
      return "Paragraph";
    case "bulleted":
      return "Bulleted List";
    case "numbered":
      return "Numbered List";
    case "table":
      return "Table";
    case "quote":
      return "Quote";
    default:
      return "Paragraph";
  }
}

// Lorem ipsum generator for each style type
function generateLoremIpsum(style: SectionStyle): string {
  switch (style) {
    case "paragraph":
      return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
    case "bulleted":
      return "Lorem ipsum dolor sit amet\nConsectetur adipiscing elit sed do\nEiusmod tempor incididunt ut labore\nDolore magna aliqua ut enim";
    case "numbered":
      return "Lorem ipsum dolor sit amet consectetur\nAdipiscing elit sed do eiusmod tempor\nIncididunt ut labore et dolore magna\nAliqua ut enim ad minim veniam";
    case "table":
      return "Header 1 | Header 2 | Header 3\nLorem ipsum | Dolor sit | Amet consectetur\nAdipiscing | Elit sed | Do eiusmod";
    case "quote":
      return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
    default:
      return "Lorem ipsum dolor sit amet.";
  }
}

function applyStylePreview(
  style: SectionStyle,
  loremText: string,
): ReactElement {
  if (style === "bulleted") {
    return (
      <ul style={{ paddingLeft: 18, marginTop: 8, marginBottom: 8 }}>
        {loremText
          .split("\n")
          .filter(Boolean)
          .map((line, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {line}
            </li>
          ))}
      </ul>
    );
  }
  if (style === "numbered") {
    return (
      <ol style={{ paddingLeft: 18, marginTop: 8, marginBottom: 8 }}>
        {loremText
          .split("\n")
          .filter(Boolean)
          .map((line, idx) => (
            <li key={idx} style={{ marginBottom: 4 }}>
              {line}
            </li>
          ))}
      </ol>
    );
  }
  if (style === "quote") {
    return (
      <div
        style={{
          marginTop: 8,
          marginBottom: 8,
          padding: 12,
          borderLeft: "4px solid var(--primary-color)",
          background: "var(--bg-subtle)",
          borderRadius: 12,
        }}
      >
        {loremText}
      </div>
    );
  }
  if (style === "table") {
    const rows = loremText.split("\n").filter(Boolean);
    return (
      <div
        style={{
          marginTop: 8,
          marginBottom: 8,
          border: "1px solid var(--border-light)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {rows.map((row, idx) => (
          <div
            key={idx}
            style={{
              padding: 10,
              background: idx === 0 ? "var(--primary-lighter)" : "#fff",
              fontWeight: idx === 0 ? 600 : 400,
              borderTop: idx > 0 ? "1px solid var(--border-light)" : "none",
            }}
          >
            {row}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      style={{
        marginTop: 8,
        marginBottom: 8,
        color: "var(--text-secondary)",
        lineHeight: 1.6,
      }}
    >
      {loremText}
    </div>
  );
}

function SortableOutlineItem(props: {
  section: Section;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const { section, active, onSelect, onRename, onDelete } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(section.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(section.title);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim()) {
      onRename(editValue.trim());
    } else {
      setEditValue(section.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(section.title);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.outlineItem} ${active ? styles.outlineItemActive : ""}`}
      onClick={onSelect}
    >
      {isEditing ? (
        <input
          className={styles.outlineTitleInput}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <span
          className={styles.outlineTitleInput}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: "text" }}
        >
          {section.title}
        </span>
      )}

      <button
        className={styles.deleteButton}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete section"
        type="button"
        style={{
          marginLeft: "auto",
          border: "none",
          background: "transparent",
          color: "var(--text-lighter)",
          cursor: "pointer",
          fontSize: "16px",
          padding: "4px 8px",
        }}
      >
        ✕
      </button>

      <span
        className={styles.dragHandle}
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
        title="Drag to reorder"
      >
        ⋮⋮
      </span>
    </div>
  );
}

export default function TemplateEditPage() {
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const id = params?.id ?? searchParams.get("id") ?? "";
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>(id ?? "");
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateSubtitle, setTemplateSubtitle] = useState("");
  const [documentContextInputs, setDocumentContextInputs] = useState<
    ContextInput[]
  >([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [editSubtitleValue, setEditSubtitleValue] = useState("");
  const [selectedIcon, setSelectedIcon] =
    useState<TemplateIconKey>("DocumentText");
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!id) {
        setTemplateId("");
        setIsLoadingTemplate(false);
        return;
      }
      setIsLoadingTemplate(true);
      try {
        const response = await templatesApi.getById(id);
        if (ignore) return;

        const mapped = mapReadToManagedTemplate(response);
        setTemplateId(mapped.id);
        setTemplateTitle(mapped.title);
        setTemplateSubtitle(mapped.subtitle);
        setDocumentContextInputs(mapped.documentContextInputs ?? []);
        setSections(
          (mapped.sections ?? []).map((s) => ({
            ...s,
            styles:
              s.styles && s.styles.length > 0
                ? s.styles
                : [s.style ?? "paragraph"],
          })) as Section[],
        );
        if (
          mapped.icon &&
          TEMPLATE_ICON_KEYS.includes(mapped.icon as TemplateIconKey)
        ) {
          setSelectedIcon(mapped.icon as TemplateIconKey);
        }
      } catch {
        if (!ignore) {
          setTemplateId("");
        }
      } finally {
        if (!ignore) {
          setIsLoadingTemplate(false);
        }
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (isLoadingTemplate) {
    return <div style={{ padding: 40 }}>Loading template...</div>;
  }

  if (!templateId) {
    return (
      <div style={{ padding: 40 }}>
        Template not found.
        <div style={{ marginTop: 12 }}>
          <button onClick={() => router.push("/templates")}>
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const IconComp = TEMPLATE_ICONS[selectedIcon];

  const activeSection = sections[activeIndex] ?? null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sections, oldIndex, newIndex);
    setSections(reordered as Section[]);
    setActiveIndex(newIndex);
  };

  const addSection = () => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      title: `Section ${sections.length + 1}`,
      content: "",
      styles: ["paragraph"],
    };

    setSections([...sections, newSection]);
    setActiveIndex(sections.length);
  };

  const renameSection = (idx: number, title: string) => {
    const updated = [...sections];
    updated[idx] = { ...updated[idx], title };
    setSections(updated);
  };

  const deleteSection = (idx: number) => {
    if (sections.length <= 1) {
      alert("Cannot delete the last section");
      return;
    }
    const updated = sections.filter((_, i) => i !== idx);
    setSections(updated);
    if (activeIndex >= updated.length) {
      setActiveIndex(updated.length - 1);
    }
  };

  const toggleSectionStyle = (style: SectionStyle) => {
    if (!activeSection) return;
    const updated = [...sections];
    const currentStyles = updated[activeIndex].styles || [];

    if (currentStyles.includes(style)) {
      // Remove style if already selected
      updated[activeIndex] = {
        ...activeSection,
        styles: currentStyles.filter((s) => s !== style),
      };
    } else {
      // Add style
      updated[activeIndex] = {
        ...activeSection,
        styles: [...currentStyles, style],
      };
    }

    setSections(updated);
  };

  const setSectionContent = (content: string) => {
    if (!activeSection) return;
    const updated = [...sections];
    updated[activeIndex] = { ...activeSection, content };
    setSections(updated);
  };

  const mapStyleToBackend = (style: SectionStyle): string => {
    if (style === "bulleted") return "BULLETED_LIST";
    if (style === "numbered") return "NUMBERED_LIST";
    if (style === "table") return "TABLE";
    if (style === "quote") return "QUOTE";
    return "PARAGRAPH";
  };

  const mapInputTypeToBackend = (type: "file" | "url" | "text"): string => {
    if (type === "url") return "WEBSITE";
    if (type === "file") return "FILE";
    return "TEXT";
  };

  const saveTemplate = async () => {
    if (!templateId) return;
    const payload = {
      name: templateTitle.trim() || "Untitled Template",
      description: templateSubtitle.trim() || "",
      icon: selectedIcon,
      document_context_inputs: (documentContextInputs ?? []).map(
        (input, inputIdx) => ({
          label: input.label,
          input_type: mapInputTypeToBackend(input.type),
          required: input.required,
          description: input.description,
          allowed_file_types: input.acceptedFileTypes,
          order_index: inputIdx + 1,
        }),
      ),
      sections: sections.map((section, sectionIdx) => ({
        title: section.title,
        order_index: sectionIdx + 1,
        content_instructions: section.content,
        allowed_styles: (section.styles?.length
          ? section.styles
          : ["paragraph" as SectionStyle]
        ).map(mapStyleToBackend),
        allow_additional_context: section.allowAdditionalContext ?? true,
        context_inputs: (section.contextInputs ?? []).map(
          (input, inputIdx) => ({
            label: input.label,
            input_type: mapInputTypeToBackend(input.type),
            required: input.required,
            description: input.description,
            allowed_file_types: input.acceptedFileTypes,
            order_index: inputIdx + 1,
          }),
        ),
      })),
    };

    await templatesApi.update(templateId, payload);
    router.push("/templates");
  };

  const handleTitleDoubleClick = () => {
    setEditTitleValue(templateTitle);
    setIsEditingTitle(true);
  };

  const handleSubtitleDoubleClick = () => {
    setEditSubtitleValue(templateSubtitle);
    setIsEditingSubtitle(true);
  };

  const saveTitleEdit = () => {
    setIsEditingTitle(false);
    if (editTitleValue.trim()) {
      setTemplateTitle(editTitleValue.trim());
    }
  };

  const saveSubtitleEdit = () => {
    setIsEditingSubtitle(false);
    if (editSubtitleValue.trim()) {
      setTemplateSubtitle(editSubtitleValue.trim());
    }
  };

  const handleIconSelect = (iconKey: TemplateIconKey) => {
    setSelectedIcon(iconKey);
  };

  return (
    <>
      {/* Full document preview modal */}
      {isFullPreviewOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsFullPreviewOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Full Document Preview</div>
              <button
                className={styles.previewButton}
                onClick={() => setIsFullPreviewOpen(false)}
              >
                Close
              </button>
            </div>

            <div
              style={{
                maxHeight: "calc(86vh - 80px)",
                overflowY: "auto",
                paddingRight: "8px",
              }}
            >
              <div className={styles.sectionCard}>
                <div className={styles.sectionCardTitle}>{templateTitle}</div>
                <div className={styles.sectionCardText}>{templateSubtitle}</div>
              </div>

              <div style={{ height: 14 }} />

              {sections.length === 0 ? (
                <div className={styles.sectionCard}>
                  <div className={styles.sectionCardTitle}>No sections</div>
                  <div className={styles.sectionCardText}>
                    Add sections to build your template.
                  </div>
                </div>
              ) : (
                sections.map((s) => (
                  <div
                    key={s.id}
                    className={styles.sectionCard}
                    style={{ marginBottom: 12 }}
                  >
                    <div className={styles.sectionCardTitle}>{s.title}</div>
                    {(s.styles || ["paragraph"]).map((style, idx) => (
                      <div key={idx}>
                        {applyStylePreview(style, generateLoremIpsum(style))}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Icon Picker Modal */}
      {isIconPickerOpen && (
        <div
          className={styles.iconPickerModal}
          onClick={() => setIsIconPickerOpen(false)}
        >
          <div
            className={styles.iconPickerContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.iconPickerHeader}>
              <div className={styles.iconPickerTitle}>Choose an Icon</div>
              <button
                className={styles.iconPickerClose}
                onClick={() => setIsIconPickerOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className={styles.iconPickerGrid}>
              {TEMPLATE_ICON_KEYS.map((key) => {
                const IconComponent = TEMPLATE_ICONS[key];
                const isActive = selectedIcon === key;
                return (
                  <button
                    key={key}
                    className={`${styles.iconPickerItem} ${isActive ? styles.iconPickerItemActive : ""}`}
                    onClick={() => {
                      handleIconSelect(key);
                      setIsIconPickerOpen(false);
                    }}
                    title={key}
                    type="button"
                  >
                    <IconComponent className={styles.iconPickerItemIcon} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <BuilderShell
        sidebar={
          <>
            {/* Template header (editable on double-click) */}
            <div className={styles.templateCard}>
              <div
                className={styles.templateIcon}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                }}
              >
                <IconComp
                  style={{ width: 24, height: 24, color: "var(--bg-white)" }}
                />
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  minWidth: 0,
                }}
              >
                {isEditingTitle ? (
                  <input
                    className={styles.fieldInput}
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onBlur={saveTitleEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitleEdit();
                      if (e.key === "Escape") setIsEditingTitle(false);
                    }}
                    autoFocus
                    style={{ width: "100%" }}
                  />
                ) : (
                  <div
                    onDoubleClick={handleTitleDoubleClick}
                    style={{
                      fontWeight: 600,
                      fontSize: "1rem",
                      cursor: "text",
                      padding: "8px",
                      borderRadius: "8px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-subtle)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {templateTitle}
                  </div>
                )}

                {isEditingSubtitle ? (
                  <input
                    className={styles.fieldInput}
                    value={editSubtitleValue}
                    onChange={(e) => setEditSubtitleValue(e.target.value)}
                    onBlur={saveSubtitleEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveSubtitleEdit();
                      if (e.key === "Escape") setIsEditingSubtitle(false);
                    }}
                    autoFocus
                    style={{ width: "100%" }}
                  />
                ) : (
                  <div
                    onDoubleClick={handleSubtitleDoubleClick}
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-light)",
                      cursor: "text",
                      padding: "8px",
                      borderRadius: "8px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-subtle)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {templateSubtitle}
                  </div>
                )}
              </div>
            </div>

            {/* Icon picker button */}
            <button
              onClick={() => setIsIconPickerOpen(true)}
              className={styles.secondaryButton}
              type="button"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm0 3a1 1 0 110 2 1 1 0 010-2zm-3 3a1 1 0 110 2 1 1 0 010-2zm3 0a1 1 0 110 2 1 1 0 010-2zm3 0a1 1 0 110 2 1 1 0 010-2z" />
              </svg>
              Change Icon
            </button>

            <div className={styles.sidebarSectionTitle}>Template Outline</div>

            {/* DnD Outline */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={styles.outlineList}>
                  {sections.map((section, idx) => (
                    <SortableOutlineItem
                      key={section.id}
                      section={section}
                      active={idx === activeIndex}
                      onSelect={() => setActiveIndex(idx)}
                      onRename={(title) => renameSection(idx, title)}
                      onDelete={() => deleteSection(idx)}
                    />
                  ))}

                  <button
                    className={styles.outlineAdd}
                    onClick={addSection}
                    type="button"
                  >
                    + Add Section
                  </button>
                </div>
                <div className={styles.sidebarSectionTitle}>
                  Document Context Inputs
                </div>
            <ContextInputsManager
              contextInputs={documentContextInputs}
              allowAdditionalContext={false}
              showAdditionalToggle={false}
              showItemIcons={false}
              showDescriptionInList={false}
              onUpdate={(inputs) => {
                setDocumentContextInputs(inputs);
              }}
            />
              </SortableContext>
            </DndContext>
          </>
        }
        main={
          <div className={styles.editor}>
            <div className={styles.editorHeader}>
              <div className={styles.editorTitle}>
                <div>
                  <div className={styles.editorHeading}>
                    {activeSection ? activeSection.title : "Select a section"}
                  </div>
                  <div className={styles.editorSubheading}>Section Editor</div>
                </div>
              </div>
            </div>

            {/* Style selector - multiple selection */}
            <div>
              <div className={styles.inputPrompt} style={{ marginBottom: 8 }}>
                Select Styles (you can choose multiple)
              </div>
              <div className={styles.styleBar}>
                {(
                  [
                    "paragraph",
                    "bulleted",
                    "numbered",
                    "table",
                    "quote",
                  ] as SectionStyle[]
                ).map((st) => (
                  <button
                    key={st}
                    className={`${styles.styleButton} ${
                      activeSection?.styles?.includes(st)
                        ? styles.styleButtonActive
                        : ""
                    }`}
                    onClick={() => toggleSectionStyle(st)}
                    type="button"
                    disabled={!activeSection}
                  >
                    {StyleLabel(st)}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor area */}
            {activeSection ? (
              <>
                <div className={styles.inputPrompt}>
                  What should this section contain?
                </div>

                <textarea
                  className={styles.textArea}
                  value={activeSection.content}
                  onChange={(e) => setSectionContent(e.target.value)}
                  placeholder="Write section instructions or requirements here... (This won't appear in preview)"
                  style={{ minHeight: 160 }}
                />

                {/* Context Inputs Manager */}
                <div style={{ marginTop: 16 }}>
                  <ContextInputsManager
                    contextInputs={activeSection.contextInputs || []}
                    allowAdditionalContext={
                      activeSection.allowAdditionalContext ?? true
                    }
                    onUpdate={(inputs, allowAdditional) => {
                      const updated = [...sections];
                      updated[activeIndex] = {
                        ...activeSection,
                        contextInputs: inputs,
                        allowAdditionalContext: allowAdditional,
                      };
                      setSections(updated as Section[]);
                    }}
                  />
                </div>
              </>
            ) : (
              <div
                className={styles.textArea}
                style={{ color: "var(--text-light)", fontStyle: "italic" }}
              >
                Add a section to start editing.
              </div>
            )}

            {/* Action buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 8,
              }}
            >
              <Link
                href="/templates"
                className={styles.cancelLink}
                style={{ padding: "10px 18px" }}
              >
                Cancel
              </Link>
              <button
                className={styles.primaryButton}
                onClick={saveTemplate}
                type="button"
              >
                Save Template
              </button>
            </div>
          </div>
        }
        preview={
          <>
            {/* Collapsible preview header */}
            <div
              className={styles.previewHeader}
              onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
              style={{ cursor: "pointer", userSelect: "none" }}
            >
              <div className={styles.previewTitle}>Section Preview</div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                style={{
                  transform: isPreviewCollapsed
                    ? "rotate(-90deg)"
                    : "rotate(0)",
                  transition: "transform 0.2s ease",
                  color: "var(--text-lighter)",
                }}
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {!isPreviewCollapsed && (
              <>
                <div
                  className={styles.previewCard}
                  style={{ maxHeight: "750px", overflowY: "auto" }}
                >
                  <div className={styles.previewCardHeader}>
                    <div>
                      <div className={styles.previewDocTitle}>
                        {templateTitle}
                      </div>
                      <div className={styles.previewDocDate}>
                        {new Date().toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.previewBadge}>Preview</div>
                  </div>

                  <div className={styles.previewDivider} />

                  {activeSection ? (
                    <>
                      <div className={styles.previewSection}>
                        {activeSection.title}
                      </div>
                      {(activeSection.styles?.length || 0) === 0 ? (
                        <div
                          style={{
                            color: "var(--text-light)",
                            fontSize: 14,
                            marginTop: 8,
                            fontStyle: "italic",
                          }}
                        >
                          Select a style to preview
                        </div>
                      ) : (
                        activeSection.styles.map((style, idx) => (
                          <div key={idx}>
                            {applyStylePreview(
                              style,
                              generateLoremIpsum(style),
                            )}
                          </div>
                        ))
                      )}
                    </>
                  ) : (
                    <div style={{ color: "var(--text-light)", fontSize: 14 }}>
                      Select a section to preview.
                    </div>
                  )}
                </div>

                {/* Full document preview button */}
                <button
                  className={styles.previewSave}
                  onClick={() => setIsFullPreviewOpen(true)}
                  type="button"
                  style={{ width: "100%" }}
                >
                  Full Document Preview
                </button>
              </>
            )}
          </>
        }
      />
    </>
  );
}
