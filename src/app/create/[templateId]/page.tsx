"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BuilderShell, ContextInputsCollector } from "@/features/builder";
import styles from "@/features/builder/components/builder.module.css";
import { FileText, Download, Save, X, AlertCircle, Loader2, Sparkles } from "lucide-react";
import type { ContextInputValue } from "@/features/templates/data/templates.management.data";
import type { ManagedTemplate } from "@/features/templates/data/templates.management.data";
import { templatesApi } from "@/features/templates/api/templates.api";
import { generationsApi } from "@/features/generation/api/generations.api";
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
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [missingInputLabels, setMissingInputLabels] = useState<string[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const streamRef = useRef<EventSource | null>(null);
  const logCounterRef = useRef(0);

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

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  const addLog = (type: GenerationLog["type"], message: string) => {
    logCounterRef.current += 1;
    const newLog: GenerationLog = {
      id: `${Date.now()}-${logCounterRef.current}`,
      timestamp: new Date(),
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const closeStream = () => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  };

  const syncFinalDocument = async (jobId: string, documentId: string) => {
    try {
      const [job, content] = await Promise.all([
        generationsApi.getJob(jobId),
        generationsApi.getDocumentContent(documentId),
      ]);
      if (content.content_markdown) {
        setDocumentContent(content.content_markdown);
      } else if (job.final_markdown) {
        setDocumentContent(job.final_markdown);
      }

      if (job.status === "SUCCEEDED") {
        setGenerationState("completed");
        addLog("success", "Document generation completed.");
        return;
      }
      if (job.status === "FAILED" || job.status === "CANCELLED") {
        setGenerationState("error");
        addLog("error", job.error_message || "Generation failed.");
      }
    } catch (error) {
      setGenerationState("error");
      addLog(
        "error",
        error instanceof Error ? `Failed to fetch final document: ${error.message}` : "Failed to fetch final document.",
      );
    }
  };

  const handleGenerate = async () => {
    // Validate required context inputs
    if (template) {
      const allRequiredInputs = [
        ...(template.documentContextInputs?.filter((ci) => ci.required) || []),
        ...template.sections.flatMap((s) => s.contextInputs?.filter((ci) => ci.required) || []),
      ];
      
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

    try {
      closeStream();
      setGenerationState("generating");
      setDocumentContent("");
      setLogs([]);
      addLog("info", "Submitting generation request...");

      const response = await generationsApi.create({
        template_id: templateId,
        title: documentTitle || "Untitled Document",
        context_values: contextValues.map((value) => ({
          input_id: value.inputId,
          type: value.type === "url" ? "WEBSITE" : value.type === "file" ? "FILE" : "TEXT",
          value: value.value,
          file_name: value.fileName,
        })),
      });

      setActiveJobId(response.job_id);
      setActiveDocumentId(response.document_id);
      addLog("success", `Generation queued: ${response.job_id}`);

      const stream = new EventSource(generationsApi.getStreamUrl(response.job_id));
      streamRef.current = stream;

      const onEvent = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as { event_type?: string; message?: string };
          const eventType = data.event_type || "info";
          const message = data.message || "Generation update";
          if (eventType.includes("FAILED")) {
            addLog("error", message);
          } else if (eventType.includes("COMPLETED")) {
            addLog("success", message);
          } else {
            addLog("info", message);
          }
        } catch {
          addLog("info", "Generation event received");
        }
      };

      stream.addEventListener("JOB_STARTED", onEvent as EventListener);
      stream.addEventListener("RETRIEVAL_INDEXED", onEvent as EventListener);
      stream.addEventListener("SECTION_COMPLETED", onEvent as EventListener);
      stream.addEventListener("JOB_COMPLETED", onEvent as EventListener);
      stream.addEventListener("JOB_FAILED", onEvent as EventListener);

      stream.addEventListener("done", async () => {
        closeStream();
        await syncFinalDocument(response.job_id, response.document_id);
      });

      stream.onerror = async () => {
        closeStream();
        addLog("warning", "Live stream disconnected. Syncing final state...");
        await syncFinalDocument(response.job_id, response.document_id);
      };
    } catch (error) {
      setGenerationState("error");
      addLog("error", error instanceof Error ? error.message : "Failed to start generation.");
    }
  };

  const handleDownload = () => {
    setIsDownloadModalOpen(true);
  };

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFormat = async (format: "md" | "pdf" | "docx") => {
    try {
      if (activeDocumentId) {
        const { blob, filename } = await generationsApi.downloadDocument(activeDocumentId, format);
        triggerBlobDownload(blob, filename);
      } else {
        if (format !== "md") {
          addLog("error", "PDF/DOCX download is available after generation completes.");
          return;
        }
        const fallbackName = `${documentTitle.replace(/\s+/g, "_") || "document"}.md`;
        triggerBlobDownload(new Blob([documentContent], { type: "text/markdown" }), fallbackName);
      }
      addLog("success", `Document downloaded as ${format.toUpperCase()}.`);
      setIsDownloadModalOpen(false);
    } catch (error) {
      addLog("error", error instanceof Error ? error.message : "Failed to download document.");
    }
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    addLog("success", "Document saved to workspace");
    setTimeout(() => {
      router.push("/documents");
    }, 1000);
  };

  const handleCancel = async () => {
    if (generationState === "generating") {
      if (confirm("Generation is in progress. Are you sure you want to cancel?")) {
        if (activeJobId) {
          try {
            await generationsApi.cancel(activeJobId);
            addLog("warning", "Generation cancelled.");
          } catch {
            addLog("warning", "Failed to cancel on server. Exiting view.");
          }
        }
        closeStream();
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  // Collect all context inputs from template sections
  const allRequiredInputs = useMemo(() => {
    if (!template) return [];
    return [
      ...(template.documentContextInputs?.filter((ci) => ci.required) || []),
      ...template.sections.flatMap((s) => s.contextInputs?.filter((ci) => ci.required) || []),
    ];
  }, [template]);

  const allRecommendedInputs = useMemo(() => {
    if (!template) return [];
    return [
      ...(template.documentContextInputs?.filter((ci) => !ci.required) || []),
      ...template.sections.flatMap((s) => s.contextInputs?.filter((ci) => !ci.required) || []),
    ];
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

            {/* <div className={styles.sectionCard}> */}
              {/* <div className={styles.sectionCardTitle}>Document Title</div> */}
              {/* <div className={styles.sectionCardText}> */}
                {/* Set the title for your generated output. */}
              {/* </div> */}
              {/* <div className={styles.fieldGroup} style={{ marginTop: "12px" }}> */}
                {/* <div> */}
                  {/* <label className={styles.fieldLabel}>Title</label> */}
                  {/* <input */}
                    {/* type="text" */}
                    {/* className={styles.fieldInput} */}
                    {/* value={documentTitle} */}
                    {/* onChange={(e) => setDocumentTitle(e.target.value)} */}
                    {/* placeholder="Enter document title..." */}
                    {/* disabled={generationState === "generating"} */}
                  {/* /> */}
                {/* </div> */}
              {/* </div> */}
            {/* </div> */}

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
              <div className={styles.markdownContent}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children, ...props }) => (
                      <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {documentContent}
                </ReactMarkdown>
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

      {isDownloadModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsDownloadModalOpen(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px" }}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Download Format</div>
              <button
                className={styles.deleteButton}
                onClick={() => setIsDownloadModalOpen(false)}
                style={{ fontSize: "24px" }}
              >
                ×
              </button>
            </div>
            <div className={styles.sectionCardText}>
              Choose the format for export.
            </div>
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <button className={styles.secondaryButton} onClick={() => handleDownloadFormat("md")}>
                Markdown (.md)
              </button>
              <button className={styles.secondaryButton} onClick={() => handleDownloadFormat("pdf")}>
                PDF (.pdf)
              </button>
              <button className={styles.secondaryButton} onClick={() => handleDownloadFormat("docx")}>
                Word (.docx)
              </button>
            </div>
            <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end" }}>
              <button className={styles.cancelLink} onClick={() => setIsDownloadModalOpen(false)}>
                Cancel
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
