"use client";

import { useState } from "react";
import { Upload, Link as LinkIcon, Type, Plus, Trash2, Edit2, Check } from "lucide-react";
import type { ContextInput, ContextInputType } from "@/features/templates/data/templates.management.data";
import styles from "./builder.module.css";

interface ContextInputsManagerProps {
  contextInputs: ContextInput[];
  allowAdditionalContext?: boolean;
  onUpdate: (inputs: ContextInput[], allowAdditional: boolean) => void;
}

export const ContextInputsManager = ({
  contextInputs = [],
  allowAdditionalContext = true,
  onUpdate,
}: ContextInputsManagerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInput, setEditingInput] = useState<ContextInput | null>(null);
  const [formData, setFormData] = useState<Partial<ContextInput>>({
    label: "",
    description: "",
    type: "file",
    required: false,
    acceptedFileTypes: [".pdf", ".docx", ".txt"],
  });

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

  const getTypeLabel = (type: ContextInputType) => {
    switch (type) {
      case "file":
        return "File Upload";
      case "url":
        return "Web Link";
      case "text":
        return "Text Note";
    }
  };

  const openModal = (input?: ContextInput) => {
    if (input) {
      setEditingInput(input);
      setFormData(input);
    } else {
      setEditingInput(null);
      setFormData({
        label: "",
        description: "",
        type: "file",
        required: false,
        acceptedFileTypes: [".pdf", ".docx", ".txt"],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInput(null);
  };

  const handleSave = () => {
    if (!formData.label) return;

    const newInput: ContextInput = {
      id: editingInput?.id || crypto.randomUUID(),
      label: formData.label!,
      description: formData.description,
      type: formData.type!,
      required: formData.required!,
      acceptedFileTypes: formData.type === "file" ? formData.acceptedFileTypes : undefined,
    };

    let updatedInputs: ContextInput[];
    if (editingInput) {
      updatedInputs = contextInputs.map((input) =>
        input.id === editingInput.id ? newInput : input
      );
    } else {
      updatedInputs = [...contextInputs, newInput];
    }

    onUpdate(updatedInputs, allowAdditionalContext);
    closeModal();
  };

  const handleDelete = (id: string) => {
    const updatedInputs = contextInputs.filter((input) => input.id !== id);
    onUpdate(updatedInputs, allowAdditionalContext);
  };

  const toggleAllowAdditional = () => {
    onUpdate(contextInputs, !allowAdditionalContext);
  };

  return (
    <>
      <div className={styles.contextInputsSection}>
        <div className={styles.contextInputsHeader}>
          <div className={styles.contextInputsTitle}>
            <span>Context Inputs</span>
          </div>
          <button
            className={styles.contextInputActionBtn}
            onClick={() => openModal()}
            type="button"
            title="Add context input"
          >
            <Plus size={18} />
          </button>
        </div>

        {contextInputs.length === 0 ? (
          <div className={styles.contextInputEmpty}>
            No context inputs defined. Click + to add one.
          </div>
        ) : (
          <div className={styles.contextInputsList}>
            {contextInputs.map((input) => (
              <div key={input.id} className={styles.contextInputItem}>
                <div className={styles.contextInputHeader}>
                  <div className={styles.contextInputLabelRow}>
                    <div className={styles.contextInputIcon}>{getIconForType(input.type)}</div>
                    <div className={styles.contextInputInfo}>
                      <div className={styles.contextInputLabel}>
                        {input.label}
                        {input.required && (
                          <span className={styles.contextInputBadge}>Required</span>
                        )}
                      </div>
                      {input.description && (
                        <div className={styles.contextInputDescription}>{input.description}</div>
                      )}
                      <div className={styles.contextInputFileTypes}>
                        {getTypeLabel(input.type)}
                        {input.type === "file" && input.acceptedFileTypes && (
                          <> • {input.acceptedFileTypes.join(", ")}</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.contextInputActions}>
                    <button
                      className={styles.contextInputActionBtn}
                      onClick={() => openModal(input)}
                      type="button"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className={styles.contextInputActionBtn}
                      onClick={() => handleDelete(input.id)}
                      type="button"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.contextToggleSection}>
          <input
            type="checkbox"
            id="allowAdditional"
            checked={allowAdditionalContext}
            onChange={toggleAllowAdditional}
            className={styles.contextInputFormCheckboxInput}
          />
          <label htmlFor="allowAdditional" className={styles.contextToggleText}>
            Allow users to add additional context during generation
          </label>
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.contextInputModalOverlay} onClick={closeModal}>
          <div
            className={styles.contextInputModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.contextInputModalHeader}>
              <div className={styles.contextInputModalTitle}>
                {editingInput ? "Edit Context Input" : "Add Context Input"}
              </div>
              <button className={styles.contextInputModalClose} onClick={closeModal}>
                ×
              </button>
            </div>

            <div className={styles.contextInputModalForm}>
              <div className={styles.contextInputFormField}>
                <label className={styles.contextInputFormLabel}>Label *</label>
                <input
                  type="text"
                  className={styles.contextInputFormInput}
                  placeholder="e.g., Client Brief, Project Requirements"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>

              <div className={styles.contextInputFormField}>
                <label className={styles.contextInputFormLabel}>Description</label>
                <textarea
                  className={styles.contextInputFormTextarea}
                  placeholder="Explain what this input is for and why it's needed..."
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={styles.contextInputFormField}>
                <label className={styles.contextInputFormLabel}>Type *</label>
                <select
                  className={styles.contextInputFormSelect}
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as ContextInputType })
                  }
                >
                  <option value="file">File Upload</option>
                  <option value="url">Web Link</option>
                  <option value="text">Text Note</option>
                </select>
              </div>

              {formData.type === "file" && (
                <div className={styles.contextInputFormField}>
                  <label className={styles.contextInputFormLabel}>Accepted File Types</label>
                  <input
                    type="text"
                    className={styles.contextInputFormInput}
                    placeholder=".pdf, .docx, .txt"
                    value={formData.acceptedFileTypes?.join(", ") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acceptedFileTypes: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              )}

              <div className={styles.contextInputFormCheckbox}>
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className={styles.contextInputFormCheckboxInput}
                />
                <label htmlFor="required" className={styles.contextInputFormLabel}>
                  Mark as required
                </label>
              </div>
            </div>

            <div className={styles.contextInputModalActions}>
              <button className={styles.contextInputModalCancel} onClick={closeModal}>
                Cancel
              </button>
              <button
                className={styles.contextInputModalSave}
                onClick={handleSave}
                disabled={!formData.label}
              >
                <Check size={16} style={{ display: "inline", marginRight: "6px" }} />
                {editingInput ? "Update" : "Add Input"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
