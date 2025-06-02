import React, { useEffect, useState } from "react";
import styles from "../styles/TaskAIComponents.module.css";
import { Task } from "../types/ganttTypes";

// Types
interface AIAlertProps {
  message: string;
  onClick?: () => void;
}

interface AISuggestionItem {
  id: number;
  text: string;
}

interface AISuggestionsProps {
  taskName: string;
  suggestions: AISuggestionItem[];
  onApply?: (suggestionId: number) => void;
  onClose: () => void;
  position?: {
    top?: string | number;
    left?: string | number;
    right?: string | number;
    bottom?: string | number;
  };
}

// Componente de Alerta IA
export const TaskAIAlert: React.FC<AIAlertProps> = ({ message, onClick }) => {
  return (
    <div
      className={styles.alertContainer}
      onClick={onClick}
      role="alert"
      title={message}
    >
      <span className={styles.alertIcon}>⚠️</span>
    </div>
  );
};

// Componente de Sugerencias IA
export const TaskAISuggestions: React.FC<AISuggestionsProps> = ({
  taskName,
  suggestions,
  onApply,
  onClose,
  position = {},
}) => {
  // Estado para detectar si es dispositivo móvil
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es dispositivo móvil al montar el componente y en resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    // Verificar tamaño inicial
    checkIfMobile();

    // Agregar listener para cambios de tamaño
    window.addEventListener("resize", checkIfMobile);

    // Limpiar listener al desmontar
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Convertir valores numéricos a strings con 'px'
  // Si es móvil, no aplicamos posición personalizada
  const positionStyle = isMobile
    ? {}
    : Object.entries(position).reduce((acc, [key, value]) => {
        acc[key as "top" | "left" | "right" | "bottom"] =
          typeof value === "number" ? `${value}px` : value;
        return acc;
      }, {} as { [key: string]: string });

  return (
    <div
      className={styles.suggestionsContainer}
      style={positionStyle}
      role="dialog"
      aria-labelledby="suggestions-title"
    >
      <div className={styles.suggestionsHeader}>
        <div className={styles.suggestionsIcon}>IA</div>
        <h3 id="suggestions-title">Sugerencias de IA</h3>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar sugerencias"
        >
          ×
        </button>
      </div>

      <div className={styles.suggestionsContent}>
        <p className={styles.suggestionsTaskName}>Para la tarea "{taskName}"</p>

        <ul className={styles.suggestionsList}>
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} className={styles.suggestionItem}>
              <div className={styles.suggestionNumber}>{suggestion.id}</div>
              <div className={styles.suggestionText}>{suggestion.text}</div>
              <button
                className={styles.applyButton}
                onClick={() => onApply && onApply(suggestion.id)}
                aria-label={`Aplicar sugerencia ${suggestion.id}`}
              >
                Aplicar #{suggestion.id}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Hook personalizado para lógica de IA en tareas
export const useTaskAI = (tasks: Task[]) => {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(
    null
  );

  // Función que analiza una tarea y determina si necesita mostrar alertas
  const analyzeTaskForAlerts = (task: Task): string | null => {
    // Lógica para alertas (personalizable)
    if (task.duration && task.duration > 10 && (task.progress || 0) < 60) {
      const remainingDays = Math.ceil(
        task.duration * (1 - (task.progress || 0) / 100)
      );

      if (remainingDays > 7) {
        return `Posible retraso de ${
          remainingDays - 7
        } días basado en el ritmo actual`;
      }
    }
    return null;
  };

  // Función que genera sugerencias para una tarea
  const generateSuggestionsForTask = (taskId: string): AISuggestionItem[] => {
    const task = tasks.find((t) => t.id === taskId);

    if (!task) {
      return [];
    }

    // Lógica para sugerencias (personalizable)
    const suggestions: AISuggestionItem[] = [];
    const progress = task.progress || 0;

    if (progress < 50 && task.duration && task.duration > 7) {
      suggestions.push({
        id: 1,
        text: "Asignar 1 recurso adicional para acelerar el progreso",
      });
    }

    if (task.duration && task.duration > 14) {
      suggestions.push({
        id: 2,
        text: "Reducir alcance de wireframes menos críticos",
      });
    }

    if (progress < 30) {
      suggestions.push({
        id: 3,
        text: "Extender duración en 5 días para ajustarse a disponibilidad del equipo",
      });
    }

    return suggestions;
  };

  // Abrir panel de sugerencias para una tarea
  const openSuggestionsForTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowSuggestions(true);
  };

  // Cerrar panel de sugerencias
  const closeSuggestions = () => {
    setShowSuggestions(false);
    setSelectedTaskId(null);
  };

  // Aplicar una sugerencia
  const applySuggestion = (suggestionId: number) => {
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!task) return;

    // Implementar lógica específica basada en suggestionId
    console.log(`Aplicando sugerencia ${suggestionId} para tarea:`, task.name);

    // Aquí se implementaría la lógica para aplicar los cambios
    // Esta es una versión simplificada que solo cierra el panel
    closeSuggestions();
  };

  return {
    analyzeTaskForAlerts,
    generateSuggestionsForTask,
    openSuggestionsForTask,
    closeSuggestions,
    applySuggestion,
    showSuggestions,
    selectedTaskId,
  };
};
