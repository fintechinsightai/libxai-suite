import React, { KeyboardEvent } from "react";
import styles from "../styles/IAChatPanel.module.css";

interface IAChatPanelProps {
  prompt: string;
  onPromptChange: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const IAChatPanel: React.FC<IAChatPanelProps> = ({
  prompt,
  onPromptChange,
  onSubmit,
  onClose,
}) => {
  // Manejar el envío del formulario con Enter (manteniendo Shift+Enter para nueva línea)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div
      className={styles.panel}
      role="dialog"
      aria-labelledby="ia-assistant-title"
    >
      <div className={styles.header}>
        <span id="ia-assistant-title">🤖 Asistente IA</span>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar asistente IA"
        >
          ✕
        </button>
      </div>

      <p className={styles.instructions}>
        Describe tus tareas en lenguaje natural y el asistente las creará
        automáticamente.
        <br />
        <strong>Ejemplo:</strong> "Primero diseñar logo (2 días), luego frontend
        (4 días)..."
      </p>

      <textarea
        className={styles.textarea}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe tu proyecto aquí..."
        aria-label="Descripción del proyecto"
      />

      <div className={styles.footer}>
        <button type="button" className={styles.cancel} onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className={styles.submit}
          onClick={onSubmit}
          disabled={!prompt.trim()}
        >
          Procesar
        </button>
      </div>
    </div>
  );
};

export default IAChatPanel;
