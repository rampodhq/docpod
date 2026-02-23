"use client";

import { useState } from "react";
import { Upload, Link as LinkIcon, Type, Plus, X, Check, AlertCircle } from "lucide-react";
import type {
  ContextInput,
  ContextInputValue,
  ContextInputType,
} from "@/features/templates/data/templates.management.data";
import styles from "./builder.module.css";

interface ContextInputsCollectorProps {
  requiredInputs: ContextInput[];
  recommendedInputs: ContextInput[];
  allowAdditionalContext: boolean;
  values: ContextInputValue[];
  onChange: (values: ContextInputValue[]) => void;
}

export const ContextInputsCollector = ({
  requiredInputs = [],
  recommendedInputs = [],
  allowAdditionalContext = true,
  values = [],
  onChange,
}: ContextInputsCollectorProps) => {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customInputType, setCustomInputType] = useState<ContextInputType>("file");
  const [customInputValue, setCustomInputValue] = useState("");

  const getIconForType = (type: ContextInputType) => {
    switch (type) {
      case "file":
        return <Upload size={16} />;
      case "url":
        return <LinkIcon size={16} />;
      case "text":
        return <Type size={16} />;
    }
  };

  const getValue = (inputId: string) => {
    return values.find((v) => v.inputId === inputId);
  };

  const handleFileUpload = (inputId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const newValue: ContextInputValue = {
      inputId,
      type: "file",
      value: URL.createObjectURL(file),
      fileName: file.name,
    };

    onChange([...values.filter((v) => v.inputId !== inputId), newValue]);
  };

  const handleUrlInput = (inputId: string, url: string) => {
    if (!url.trim()) {
      onChange(values.filter((v) => v.inputId !== inputId));
      return;
    }

    const newValue: ContextInputValue = {
      inputId,
      type: "url",
      value: url,
    };

    onChange([...values.filter((v) => v.inputId !== inputId), newValue]);
  };

  const handleTextInput = (inputId: string, text: string) => {
    if (!text.trim()) {
      onChange(values.filter((v) => v.inputId !== inputId));
      return;
    }

    const newValue: ContextInputValue = {
      inputId,
      type: "text",
      value: text,
    };

    onChange([...values.filter((v) => v.inputId !== inputId), newValue]);
  };

  const removeValue = (inputId: string) => {
    onChange(values.filter((v) => v.inputId !== inputId));
  };

  const addCustomInput = () => {
    if (!customInputValue.trim()) return;

    const customId = `custom-${Date.now()}`;
    const newValue: ContextInputValue = {
      inputId: customId,
      type: customInputType,
      value: customInputValue,
      fileName: customInputType === "file" ? "Custom file" : undefined,
    };

    onChange([...values, newValue]);
    setCustomInputValue("");
    setIsAddingCustom(false);
  };

  const renderInputField = (input: ContextInput) => {
    const value = getValue(input.id);

    return (
      <div key={input.id} className={styles.contextInputItem}>
        <div className={styles.contextInputHeader}>
          <div className={styles.contextInputLabelRow}>
            <div className={styles.contextInputIcon}>{getIconForType(input.type)}</div>
            <div className={styles.contextInputInfo}>
              <div className={styles.contextInputLabel}>
                {input.label}
                {input.required && <span className={styles.contextInputBadge}>Required</span>}
              </div>
              {input.description && (
                <div className={styles.contextInputDescription}>{input.description}</div>
              )}
            </div>
          </div>
        </div>

        {!value && input.type === "file" && (
          <div>
            <input
              type="file"
              id={`file-${input.id}`}
              accept={input.acceptedFileTypes?.join(",")}
              onChange={(e) => handleFileUpload(input.id, e.target.files)}
              style={{ display: "none" }}
            />
            <label htmlFor={`file-${input.id}`}>
              <div className={styles.contextAddButton} style={{ cursor: "pointer" }}>
                <Upload size={16} />
                Upload {input.acceptedFileTypes?.join(", ") || "file"}
              </div>
            </label>
          </div>
        )}

        {!value && input.type === "url" && (
          <input
            type="url"
            className={styles.contextInputFormInput}
            placeholder="https://example.com"
            onBlur={(e) => handleUrlInput(input.id, e.target.value)}
            style={{ marginTop: "8px" }}
          />
        )}

        {!value && input.type === "text" && (
          <textarea
            className={styles.contextInputFormTextarea}
            placeholder="Enter text context..."
            onBlur={(e) => handleTextInput(input.id, e.target.value)}
            style={{ marginTop: "8px" }}
          />
        )}

        {value && (
          <div className={styles.contextInputValue}>
            <div className={styles.contextInputValueIcon}>{getIconForType(value.type)}</div>
            <div className={styles.contextInputValueText}>
              {value.fileName || value.value}
            </div>
            <button
              className={styles.contextInputValueRemove}
              onClick={() => removeValue(input.id)}
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const missingRequired = requiredInputs.filter((input) => !getValue(input.id));

  return (
    <div className={styles.contextInputsSection}>
      {requiredInputs.length > 0 && (
        <>
          <div className={styles.contextInputsHeader}>
            <div className={styles.contextInputsTitle}>
              <AlertCircle size={16} style={{ color: "var(--primary-color)" }} />
              Required Context
              {missingRequired.length > 0 && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--primary-color)",
                    fontWeight: 700,
                  }}
                >
                  ({missingRequired.length} missing)
                </span>
              )}
            </div>
          </div>
          <div className={styles.contextInputsList}>
            {requiredInputs.map((input) => renderInputField(input))}
          </div>
        </>
      )}

      {recommendedInputs.length > 0 && (
        <>
          <div
            className={styles.contextInputsHeader}
            style={{ marginTop: requiredInputs.length > 0 ? "16px" : "0" }}
          >
            <div className={styles.contextInputsTitle}>
              <span>Recommended Context</span>
            </div>
          </div>
          <div className={styles.contextInputsList}>
            {recommendedInputs.map((input) => renderInputField(input))}
          </div>
        </>
      )}

      {allowAdditionalContext && (
        <>
          <div
            className={styles.contextInputsHeader}
            style={{
              marginTop: requiredInputs.length > 0 || recommendedInputs.length > 0 ? "16px" : "0",
            }}
          >
            <div className={styles.contextInputsTitle}>
              <span>Additional Context</span>
            </div>
          </div>

          {values
            .filter((v) => v.inputId.startsWith("custom-"))
            .map((value) => (
              <div key={value.inputId} className={styles.contextInputValue}>
                <div className={styles.contextInputValueIcon}>{getIconForType(value.type)}</div>
                <div className={styles.contextInputValueText}>
                  {value.fileName || value.value}
                </div>
                <button
                  className={styles.contextInputValueRemove}
                  onClick={() => removeValue(value.inputId)}
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

          {!isAddingCustom ? (
            <button
              className={styles.contextAddButton}
              onClick={() => setIsAddingCustom(true)}
              type="button"
            >
              <Plus size={16} />
              Add Files, Links, or Notes
            </button>
          ) : (
            <div className={styles.contextInputItem}>
              <select
                className={styles.contextInputFormSelect}
                value={customInputType}
                onChange={(e) => setCustomInputType(e.target.value as ContextInputType)}
              >
                <option value="file">File Upload</option>
                <option value="url">Web Link</option>
                <option value="text">Text Note</option>
              </select>

              {customInputType === "url" && (
                <input
                  type="url"
                  className={styles.contextInputFormInput}
                  placeholder="https://example.com"
                  value={customInputValue}
                  onChange={(e) => setCustomInputValue(e.target.value)}
                  autoFocus
                />
              )}

              {customInputType === "text" && (
                <textarea
                  className={styles.contextInputFormTextarea}
                  placeholder="Enter text context..."
                  value={customInputValue}
                  onChange={(e) => setCustomInputValue(e.target.value)}
                  autoFocus
                />
              )}

              {customInputType === "file" && (
                <input
                  type="file"
                  className={styles.contextInputFormInput}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCustomInputValue(e.target.files[0].name);
                    }
                  }}
                  autoFocus
                />
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  className={styles.contextInputModalCancel}
                  onClick={() => {
                    setIsAddingCustom(false);
                    setCustomInputValue("");
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.contextInputModalSave}
                  onClick={addCustomInput}
                  disabled={!customInputValue.trim()}
                  type="button"
                >
                  <Check size={16} style={{ display: "inline", marginRight: "6px" }} />
                  Add
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
