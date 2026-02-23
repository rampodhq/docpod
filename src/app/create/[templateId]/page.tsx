"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BuilderShell, ContextInputsCollector } from "@/features/builder";
import styles from "@/features/builder/components/builder.module.css";
import { FileText, Download, Save, X, AlertCircle, Loader2, Sparkles } from "lucide-react";
import type { ContextInputValue } from "@/features/templates/data/templates.management.data";
import type { ManagedTemplate } from "@/features/templates/data/templates.management.data";
import { templatesApi } from "@/features/templates/api/templates.api";
import { mapReadToManagedTemplate } from "@/features/templates/lib/templateMappers";
import {
  TEMPLATE_ICONS,
  TEMPLATE_ICON_KEYS,
  type TemplateIconKey,
} from "@/features/templates/icons/templateIcons";

type GenerationLog = {
  id: string;
  timestamp: Date;
  type: "info" | "success" | "error" | "warning";
  message: string;
};

type GenerationState = "idle" | "generating" | "completed" | "error";

export default function CreateDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const [template, setTemplate] = useState<ManagedTemplate | null>(null);
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);

  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  const [documentContent, setDocumentContent] = useState<string>("");
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [contextValues, setContextValues] = useState<ContextInputValue[]>([]);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isMissingInputsModalOpen, setIsMissingInputsModalOpen] = useState(false);
  const [missingInputLabels, setMissingInputLabels] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setIsTemplateLoading(true);
      try {
        const response = await templatesApi.getById(templateId);
        if (!ignore) {
          setTemplate(mapReadToManagedTemplate(response));
        }
      } catch {
        if (!ignore) {
          setTemplate(null);
        }
      } finally {
        if (!ignore) {
          setIsTemplateLoading(false);
        }
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [templateId]);

  const addLog = (type: GenerationLog["type"], message: string) => {
    const newLog: GenerationLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const simulateStreaming = async () => {
    setGenerationState("generating");
    setDocumentContent("");
    setLogs([]);

    addLog("info", "Starting document generation...");
    await new Promise((resolve) => setTimeout(resolve, 500));

    addLog("info", "Loading template structure...");
    await new Promise((resolve) => setTimeout(resolve, 300));

    addLog("success", "Template loaded successfully");
    await new Promise((resolve) => setTimeout(resolve, 300));

    addLog("info", "Generating document sections...");
    
    const sections = [
      {
        title: "Executive Summary",
        content: "This comprehensive project proposal outlines our strategic approach to delivering exceptional results for your organization. Our team brings extensive experience and a proven track record of success in similar initiatives.\n\n",
      },
      {
        title: "Project Overview",
        content: "Our proposed solution addresses the key challenges identified during our initial consultation. We have designed a systematic approach that ensures measurable outcomes and sustainable growth.\n\n",
      },
      {
        title: "Scope of Work",
        content: "The project will be executed in three distinct phases:\n\n• Phase 1: Discovery and Planning (2 weeks)\n• Phase 2: Implementation (6 weeks)\n• Phase 3: Optimization and Handoff (2 weeks)\n\n",
      },
      {
        title: "Deliverables",
        content: "Throughout the engagement, we will provide:\n\n• Comprehensive project documentation\n• Weekly progress reports\n• Training materials and knowledge transfer\n• Post-project support for 30 days\n\n",
      },
      {
        title: "Timeline and Milestones",
        content: "The project timeline spans 10 weeks with key milestones:\n\n• Week 2: Project kickoff and discovery complete\n• Week 4: Initial implementation phase\n• Week 8: Testing and refinement\n• Week 10: Final delivery and handoff\n\n",
      },
      {
        title: "Investment",
        content: "The total project investment is structured as follows:\n\nInitial Setup: $5,000\nMonthly Management: $3,500\nTotal First Quarter: $15,500\n\nThis includes all deliverables, support, and training mentioned above.\n\n",
      },
    ];

    for (const section of sections) {
      addLog("info", `Generating: ${section.title}`);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const sectionHeader = `## ${section.title}\n\n`;
      setDocumentContent((prev) => prev + sectionHeader);
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Stream content word by word
      const words = section.content.split(" ");
      for (const word of words) {
        setDocumentContent((prev) => prev + word + " ");
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      addLog("success", `Completed: ${section.title}`);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    addLog("success", "Document generation completed!");
    setGenerationState("completed");
  };

  const handleGenerate = () => {
    // Validate required context inputs
    if (template) {
      const allRequiredInputs = template.sections
        .flatMap((s) => s.contextInputs?.filter((ci) => ci.required) || []);
      
      const missingInputs = allRequiredInputs.filter(
        (input) => !contextValues.find((v) => v.inputId === input.id)
      );

      if (missingInputs.length > 0) {
        addLog("error", `Missing required context: ${missingInputs.map(i => i.label).join(", ")}`);
        setMissingInputLabels(missingInputs.map((i) => i.label));
        setIsMissingInputsModalOpen(true);
        return;
      }
    }

    simulateStreaming();
  };

  const handleDownload = () => {
    const blob = new Blob([documentContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("success", "Document downloaded successfully");
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    addLog("success", "Document saved to workspace");
    setTimeout(() => {
      router.push("/documents");
    }, 1000);
  };

  const handleCancel = () => {
    if (generationState === "generating") {
      if (confirm("Generation is in progress. Are you sure you want to cancel?")) {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  // Collect all context inputs from template sections
  const allRequiredInputs = useMemo(() => {
    if (!template) return [];
    return template.sections.flatMap((s) => s.contextInputs?.filter((ci) => ci.required) || []);
  }, [template]);

  const allRecommendedInputs = useMemo(() => {
    if (!template) return [];
    return template.sections.flatMap((s) => s.contextInputs?.filter((ci) => !ci.required) || []);
  }, [template]);

  const allowAdditionalContext = useMemo(() => {
    if (!template) return true;
    return template.sections.some((s) => s.allowAdditionalContext);
  }, [template]);

  if (isTemplateLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Loading template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Template not found</p>
        <button onClick={() => router.push("/templates")} style={{ marginTop: "20px" }}>
          Back to Templates
        </button>
      </div>
    );
  }

  const templateIconKey =
    template.icon && TEMPLATE_ICON_KEYS.includes(template.icon as TemplateIconKey)
      ? (template.icon as TemplateIconKey)
      : "DocumentText";
  const TemplateIcon = TEMPLATE_ICONS[templateIconKey];
  const missingRequiredCount =
    allRequiredInputs.length -
    contextValues.filter((v) => allRequiredInputs.find((i) => i.id === v.inputId)).length;

  return (
    <>
      <BuilderShell
        sidebar={
          <>
            <div className={styles.templateCard}>
              <div className={styles.templateIcon}>
                <TemplateIcon className={styles.templateIconSvg} />
              </div>
              <div>
                <div className={styles.templateName}>{template.title}</div>
                <div className={styles.templateMeta}>{template.subtitle}</div>
              </div>
            </div>

            <div className={styles.sidebarSectionTitle}>Document Settings</div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionCardTitle}>Document Title</div>
              <div className={styles.sectionCardText}>
                Set the title for your generated output.
              </div>
              <div className={styles.fieldGroup} style={{ marginTop: "12px" }}>
                <div>
                  {/* <label className={styles.fieldLabel}>Title</label> */}
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Enter document title..."
                    disabled={generationState === "generating"}
                  />
                </div>
              </div>
            </div>

          {/* Context Inputs Button */}
          {(allRequiredInputs.length > 0 || allRecommendedInputs.length > 0 || allowAdditionalContext) && (
            <div className={styles.contextCompactCard} style={{ marginTop: "12px" }}>
              <div className={styles.contextCompactHeader}>
                <div className={styles.sectionCardTitle} style={{ marginBottom: 0 }}>
                  Context Inputs
                </div>
                {/* <div className={styles.contextInlineStats}>
                  <span className={styles.contextStatChip}>
                    {contextValues.length} added
                  </span>
                  {allRequiredInputs.length > 0 && (
                    <span className={styles.contextStatChip}>
                      {Math.max(missingRequiredCount, 0)} missing
                    </span>
                  )}
                </div> */}
              </div>
              <button
                className={styles.contextManageButton}
                onClick={() => setIsContextModalOpen(true)}
                disabled={generationState === "generating"}
              >
                <div className={styles.contextInlineStats}>
                  <span className={styles.contextStatChip}>
                    {contextValues.length} added
                  </span>
                  {allRequiredInputs.length > 0 && (
                    <span className={styles.contextBadge}>
                      {Math.max(missingRequiredCount, 0)} missing
                    </span>
                  )}
                </div>
                {/* <FileInput size={16} /> */}
                {/* {allRequiredInputs.length > 0 && missingRequiredCount > 0 && (
                  <span className={styles.contextBadge}>
                    {missingRequiredCount} required
                  </span>
                )} */}
              </button>
              {allRequiredInputs.length > 0 && missingRequiredCount <= 0 && (
                <div className={styles.contextSummary}>
                  <span className={styles.contextSummaryDone}>All required inputs configured</span>
                </div>
              )}
            </div>
          )}

          <div className={styles.sectionCard}>
            <div className={styles.sectionCardTitle}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              <button
                className={styles.secondaryButton}
                onClick={handleDownload}
                disabled={generationState === "idle" || generationState === "generating"}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Download size={16} />
                Download
              </button>
              <button
                className={styles.secondaryButton}
                onClick={handleSave}
                disabled={generationState === "idle" || generationState === "generating"}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Save size={16} />
                Save to Workspace
              </button>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionCardTitle}>Generation Status</div>
            <div className={styles.sectionCardText} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {generationState === "idle" && (
                <>
                  {/* <FileText size={16} style={{ color: "var(--text-muted)" }} /> */}
                  <span>Click &apos;Generate Document&apos; to start</span>
                </>
              )}
              {generationState === "generating" && (
                <>
                  {/* <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "var(--primary-color)" }} /> */}
                  <span>Generating document...</span>
                </>
              )}
              {generationState === "completed" && (
                <>
                  {/* <CheckCircle size={16} style={{ color: "#10b981" }} /> */}
                  <span>Generation completed</span>
                </>
              )}
              {generationState === "error" && (
                <>
                  {/* <AlertCircle size={16} style={{ color: "#ef4444" }} /> */}
                  <span>Generation failed</span>
                </>
              )}
            </div>
          </div>
        </>
      }
      main={
        <div className={styles.editor}>
          <div className={styles.editorTopRow}>
            <div className={styles.editorTopTitle}>
              <div className={styles.editorIcon} />
              <input
                className={styles.editorTitleInput}
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Untitled Document"
                disabled={generationState === "generating"}
              />
            </div>
            <div className={styles.editorActions}>
              <button 
                onClick={handleCancel}
                className={styles.cancelLink}
                style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <X size={16} />
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleGenerate}
                disabled={generationState === "generating"}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {generationState === "idle" && (
                  <>
                    <Sparkles size={18} />
                    Generate Document
                  </>
                )}
                {generationState === "generating" && (
                  <>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    Generating...
                  </>
                )}
                {generationState === "completed" && (
                  <>
                    <Sparkles size={18} />
                    Regenerate
                  </>
                )}
                {generationState === "error" && (
                  <>
                    <AlertCircle size={18} />
                    Try Again
                  </>
                )}
              </button>
            </div>
          </div>
          <div className={styles.editorSubheading}>
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          {generationState === "idle" && (
            <div className={styles.emptyState}>
              <FileText className={styles.emptyIcon} />
              <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "var(--text-primary)" }}>
                Ready to Generate
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                Click the &quot;Generate Document&quot; button to create your document
              </div>
            </div>
          )}

          {(generationState === "generating" || generationState === "completed") && (
            <div className={styles.documentContent}>
              <div style={{
                whiteSpace: "pre-wrap",
                fontFamily: "'Inter', sans-serif",
                fontSize: "15px",
                lineHeight: "1.8",
                color: "var(--text-primary)",
              }}>
                {documentContent.split("\n").map((line, idx) => {
                  if (line.startsWith("## ")) {
                    return (
                      <h2
                        key={idx}
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          marginTop: idx === 0 ? "0" : "32px",
                          marginBottom: "16px",
                          color: "var(--primary-color)",
                        }}
                      >
                        {line.replace("## ", "")}
                      </h2>
                    );
                  }
                  if (line.startsWith("• ")) {
                    return (
                      <li key={idx} style={{ marginLeft: "20px", marginBottom: "8px" }}>
                        {line.replace("• ", "")}
                      </li>
                    );
                  }
                  return (
                    <p key={idx} style={{ marginBottom: "12px" }}>
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {generationState === "error" && (
            <div className={styles.emptyState}>
              <AlertCircle className={styles.emptyIcon} style={{ color: "#ef4444" }} />
              <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "#ef4444" }}>
                Generation Failed
              </div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                An error occurred while generating the document. Please try again.
              </div>
            </div>
          )}
        </div>
      }
      preview={
        <>
          <div className={styles.previewHeader}>
            <div className={styles.previewTitle}>Generation Logs</div>
          </div>
          <div className={styles.logsContainer}>
            {logs.length === 0 ? (
              <div style={{
                padding: "32px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "14px",
              }}>
                No logs yet. Start generation to see activity.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      background: 
                        log.type === "error" ? "var(--accent-danger-bg)" :
                        log.type === "success" ? "var(--primary-light)" :
                        log.type === "warning" ? "var(--accent-warning-bg)" :
                        "var(--bg-subtle)",
                      borderLeft: `3px solid ${
                        log.type === "error" ? "var(--accent-danger)" :
                        log.type === "success" ? "var(--primary-color)" :
                        log.type === "warning" ? "var(--accent-warning)" :
                        "var(--border-light)"
                      }`,
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>
                      {log.type === "error" && "❌"}
                      {log.type === "success" && "✅"}
                      {log.type === "warning" && "⚠️"}
                      {log.type === "info" && "ℹ️"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {log.message}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                        {log.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </>
        }
      />

      {isMissingInputsModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsMissingInputsModalOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px" }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Required Inputs Missing</div>
              <button
                className={styles.deleteButton}
                onClick={() => setIsMissingInputsModalOpen(false)}
                style={{ fontSize: "24px" }}
              >
                ×
              </button>
            </div>
            <div className={styles.sectionCardText}>
              Fill the required inputs before generating the document.
            </div>
            <div style={{ marginTop: "10px" }}>
              {missingInputLabels.map((label) => (
                <div key={label} style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  • {label}
                </div>
              ))}
            </div>
            <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                className={styles.cancelLink}
                onClick={() => setIsMissingInputsModalOpen(false)}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                Later
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => {
                  setIsMissingInputsModalOpen(false);
                  setIsContextModalOpen(true);
                }}
              >
                Set Inputs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Inputs Modal */}
      {isContextModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsContextModalOpen(false)}>
          <div 
            className={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {/* <FileInput size={20} style={{ marginRight: "8px" }} /> */}
                Context Inputs
              </div>
              <button 
                className={styles.deleteButton}
                onClick={() => setIsContextModalOpen(false)}
                style={{ fontSize: "24px" }}
              >
                ×
              </button>
            </div>

            <div style={{ overflowY: "auto", maxHeight: "70vh" }}>
              <ContextInputsCollector
                requiredInputs={allRequiredInputs}
                recommendedInputs={allRecommendedInputs}
                allowAdditionalContext={allowAdditionalContext}
                values={contextValues}
                onChange={setContextValues}
              />
            </div>

            <div style={{ 
              marginTop: "20px", 
              paddingTop: "16px", 
              // borderTop: "1px solid var(--border-light)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px"
            }}>
              <button
                className={styles.cancelLink}
                onClick={() => setIsContextModalOpen(false)}
                style={{ padding: "10px 18px" }}
              >
                Close
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => setIsContextModalOpen(false)}
              >
                {/* <CheckCircle size={16} /> */}
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
