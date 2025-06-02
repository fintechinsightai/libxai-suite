import React from "react";
import styles from "../styles/GridConfigModal.module.css";

// Interfaces para el componente
export interface GridConfig {
  showLines: boolean;
  lineStyle: "solid" | "dashed" | "dotted" | "gradient";
  gridSize: "small" | "medium" | "large";
  gridType: "complete" | "horizontal" | "vertical" | "none";
  visualDensity: number;
  horizontalColor: string;
  verticalColor: string;
  highlightWeekends: boolean;
  showCurrentTime: boolean;
}

interface GridConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridConfig: GridConfig;
  onGridConfigChange: (key: keyof GridConfig, value: any) => void;
  language?: string;
}

const GridConfigModal: React.FC<GridConfigModalProps> = ({
  isOpen,
  onClose,
  gridConfig,
  onGridConfigChange,
  language = "es",
}) => {
  const [activeTab, setActiveTab] = React.useState<
    "basic" | "advanced" | "presets"
  >("basic");

  // No renderizar si no está abierto
  if (!isOpen) return null;

  // Funciones internas del modal
  const handleGridTypeChange = (
    type: "complete" | "horizontal" | "vertical" | "none"
  ) => {
    onGridConfigChange("gridType", type);
    onGridConfigChange("showLines", type !== "none");
  };

  const handleColorChange = (
    colorType: "horizontal" | "vertical",
    color: string
  ) => {
    onGridConfigChange(
      colorType === "horizontal" ? "horizontalColor" : "verticalColor",
      color
    );
  };

  const resetGridConfig = () => {
    onGridConfigChange("showLines", true);
    onGridConfigChange("lineStyle", "solid");
    onGridConfigChange("gridSize", "medium");
    onGridConfigChange("gridType", "complete");
    onGridConfigChange("visualDensity", 50);
    onGridConfigChange("horizontalColor", "#60A5FA");
    onGridConfigChange("verticalColor", "#8B5CF6");
    onGridConfigChange("highlightWeekends", false);
    onGridConfigChange("showCurrentTime", false);
  };

  const applyGridConfig = (scope: "project" | "all") => {
    // Aquí aplicaríamos la configuración
    console.log(
      `Aplicando configuración ${
        scope === "project" ? "al proyecto" : "a todos"
      }:`,
      gridConfig
    );
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.gridConfigModal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.gridModalHeader}>
          <h2 className={styles.gridModalTitle}>
            {language === "es" ? "Configuración de Grilla" : "Grid Settings"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.gridModalTabs}>
          <button
            className={`${styles.gridTab} ${
              activeTab === "basic" ? styles.gridTabActive : ""
            }`}
            onClick={() => setActiveTab("basic")}
          >
            {language === "es" ? "Básico" : "Basic"}
          </button>
          <button
            className={`${styles.gridTab} ${
              activeTab === "advanced" ? styles.gridTabActive : ""
            }`}
            onClick={() => setActiveTab("advanced")}
          >
            {language === "es" ? "Avanzado" : "Advanced"}
          </button>
          <button
            className={`${styles.gridTab} ${
              activeTab === "presets" ? styles.gridTabActive : ""
            }`}
            onClick={() => setActiveTab("presets")}
          >
            {language === "es" ? "Presets" : "Presets"}
          </button>
        </div>

        <div className={styles.gridModalContent}>
          {/* Contenido Básico */}
          {activeTab === "basic" && (
            <div className={styles.gridBasicTab}>
              <div className={styles.gridSection}>
                <h3 className={styles.gridSectionTitle}>
                  {language === "es" ? "Tipo de Grilla" : "Grid Type"}
                </h3>
                <div className={styles.gridTypeButtons}>
                  <button
                    className={`${styles.gridTypeButton} ${
                      gridConfig.gridType === "complete" ? styles.active : ""
                    }`}
                    onClick={() => handleGridTypeChange("complete")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3 17H21V15H3V17ZM3 13H21V11H3V13ZM3 9H21V7H3V9ZM3 5H21V3H3V5Z" />
                    </svg>
                    {language === "es" ? "Completa" : "Complete"}
                  </button>
                  <button
                    className={`${styles.gridTypeButton} ${
                      gridConfig.gridType === "horizontal" ? styles.active : ""
                    }`}
                    onClick={() => handleGridTypeChange("horizontal")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3 17H21V15H3V17ZM3 13H21V11H3V13ZM3 9H21V7H3V9Z" />
                    </svg>
                    {language === "es" ? "Horizontal" : "Horizontal"}
                  </button>
                  <button
                    className={`${styles.gridTypeButton} ${
                      gridConfig.gridType === "vertical" ? styles.active : ""
                    }`}
                    onClick={() => handleGridTypeChange("vertical")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 3H7V21H9V3ZM13 3H11V21H13V3ZM17 3H15V21H17V3Z" />
                    </svg>
                    {language === "es" ? "Vertical" : "Vertical"}
                  </button>
                  <button
                    className={`${styles.gridTypeButton} ${
                      gridConfig.gridType === "none" ? styles.active : ""
                    }`}
                    onClick={() => handleGridTypeChange("none")}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" />
                    </svg>
                    {language === "es" ? "Sin Grilla" : "No Grid"}
                  </button>
                </div>
              </div>

              <div className={styles.gridSection}>
                <h3 className={styles.gridSectionTitle}>
                  {language === "es" ? "Densidad Visual" : "Visual Density"}
                </h3>
                <div className={styles.sliderContainer}>
                  <span className={styles.sliderLabel}>
                    {language === "es" ? "Sutil" : "Subtle"}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={gridConfig.visualDensity}
                    onChange={(e) =>
                      onGridConfigChange(
                        "visualDensity",
                        parseInt(e.target.value)
                      )
                    }
                    className={styles.gridSlider}
                  />
                  <span className={styles.sliderLabel}>
                    {language === "es" ? "Prominente" : "Prominent"}
                  </span>
                </div>
                <div className={styles.sliderValue}>
                  {gridConfig.visualDensity}%
                </div>
              </div>

              <div className={styles.gridSection}>
                <h3 className={styles.gridSectionTitle}>
                  {language === "es" ? "Opciones de Color" : "Color Options"}
                </h3>
                <div className={styles.colorSection}>
                  <div className={styles.colorGroup}>
                    <label className={styles.colorLabel}>
                      {language === "es"
                        ? "Líneas Horizontales"
                        : "Horizontal Lines"}
                    </label>
                    <div className={styles.colorPicker}>
                      {[
                        "#6B7280",
                        "#60A5FA",
                        "#A78BFA",
                        "#F472B6",
                        "#FFFFFF",
                      ].map((color) => (
                        <button
                          key={color}
                          className={`${styles.colorSwatch} ${
                            gridConfig.horizontalColor === color
                              ? styles.active
                              : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorChange("horizontal", color)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={styles.colorGroup}>
                    <label className={styles.colorLabel}>
                      {language === "es"
                        ? "Líneas Verticales"
                        : "Vertical Lines"}
                    </label>
                    <div className={styles.colorPicker}>
                      {[
                        "#6B7280",
                        "#60A5FA",
                        "#A78BFA",
                        "#F472B6",
                        "#FFFFFF",
                      ].map((color) => (
                        <button
                          key={color}
                          className={`${styles.colorSwatch} ${
                            gridConfig.verticalColor === color
                              ? styles.active
                              : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorChange("vertical", color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.gridSection}>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={gridConfig.highlightWeekends}
                      onChange={(e) =>
                        onGridConfigChange(
                          "highlightWeekends",
                          e.target.checked
                        )
                      }
                      className={styles.checkbox}
                    />
                    {language === "es"
                      ? "Resaltar fines de semana"
                      : "Highlight weekends"}
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={gridConfig.showCurrentTime}
                      onChange={(e) =>
                        onGridConfigChange("showCurrentTime", e.target.checked)
                      }
                      className={styles.checkbox}
                    />
                    {language === "es"
                      ? "Mostrar línea de tiempo actual"
                      : "Show current time line"}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Contenido Avanzado */}
          {activeTab === "advanced" && (
            <div className={styles.gridAdvancedTab}>
              <p>
                {language === "es"
                  ? "Configuraciones avanzadas próximamente..."
                  : "Advanced settings coming soon..."}
              </p>
            </div>
          )}

          {/* Contenido Presets */}
          {activeTab === "presets" && (
            <div className={styles.gridPresetsTab}>
              <p>
                {language === "es"
                  ? "Presets predefinidos próximamente..."
                  : "Predefined presets coming soon..."}
              </p>
            </div>
          )}
        </div>

        {/* Botones de acción del modal */}
        <div className={styles.gridModalActions}>
          <button className={styles.resetButton} onClick={resetGridConfig}>
            {language === "es" ? "Restablecer" : "Reset"}
          </button>
          <div className={styles.actionButtons}>
            <button
              className={styles.applyProjectButton}
              onClick={() => applyGridConfig("project")}
            >
              {language === "es"
                ? "Aplicar a este proyecto"
                : "Apply to project"}
            </button>
            <button
              className={styles.applyAllButton}
              onClick={() => applyGridConfig("all")}
            >
              {language === "es" ? "Aplicar a todos" : "Apply to all"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GridConfigModal;
