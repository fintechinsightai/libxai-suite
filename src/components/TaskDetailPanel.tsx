import React from "react";
import { Task } from "../types/ganttTypes";
import styles from "../styles/TaskDetailPanel.module.css";
import { format } from "date-fns";
import { TaskAIAlert } from "./TaskAIComponents";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface TaskDetailPanelProps {
  task: Task;
  selectedTask: Task | null;
  isEditMode: boolean;
  confirmDelete: boolean;
  showProgressIndicator: boolean;
  onUpdateTask: (task: Task) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onClose: () => void;
  onSaveAndClose: () => void;
  getPredecessorTask: (task: Task | null) => Task | null;
  formatDate: (date: Date | null) => string;
  getTaskDates: (task: Task | null) => {
    startDate: Date | null;
    endDate: Date | null;
    duration: number;
  };
  analyzeTaskForAlerts: (task: Task) => string | null;
  openSuggestionsForTask: (taskId: string) => void;
}

/**
 * Panel de detalles de tarea
 *
 * Muestra y permite editar los detalles de una tarea seleccionada
 */
const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  selectedTask,
  isEditMode,
  confirmDelete,
  showProgressIndicator,
  onUpdateTask,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onClose,
  onSaveAndClose,
  getPredecessorTask,
  formatDate,
  getTaskDates,
  analyzeTaskForAlerts,
  openSuggestionsForTask,
}) => {
  // Calcular datos para el panel
  const taskDates = getTaskDates(task);
  const { startDate, endDate, duration } = taskDates;
  const predecessorTask = getPredecessorTask(task);

  // Convertir string a Date para DatePicker
  const getDateFromString = (dateString: string | null): Date | null => {
    return dateString ? new Date(dateString) : null;
  };

  // Manejar cambio de fecha de inicio
  const handleStartDateChange = (date: Date | null) => {
    onUpdateTask({
      ...task,
      startDate: date ? date.toISOString().split("T")[0] : null,
    });
  };

  return (
    <div className={styles.taskDetailPanel}>
      <div className={styles.taskDetailHeader}>
        <h2>Detalles de la Tarea</h2>
        <button
          onClick={onClose}
          className={styles.closeDetailBtn}
          aria-label="Cerrar panel de detalles"
        >
          ×
        </button>
      </div>

      <div className={styles.taskDetailContent}>
        {/* Título de la tarea */}
        <h3 className={styles.taskDetailTitle}>
          {isEditMode ? (
            <input
              type="text"
              value={task.name}
              onChange={(e) => onUpdateTask({ ...task, name: e.target.value })}
              className={styles.editTaskNameInput}
            />
          ) : (
            <>{task.name}</>
          )}
        </h3>
        <div
          className={styles.taskColorBar}
          style={{ backgroundColor: task.color || "#3b82f6" }}
        >
          {" "}
        </div>

        {/* Sección de fechas */}
        <div className={styles.taskDatesSection}>
          <h4>Fechas</h4>
          <div className={styles.taskDatesContainer}>
            {isEditMode ? (
              <>
                <div className={styles.taskDateBox}>
                  <DatePicker
                    selected={getDateFromString(task.startDate)}
                    onChange={handleStartDateChange}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Seleccionar fecha de inicio"
                    className={styles.dateInput}
                    showPopperArrow={false}
                    popperPlacement="auto"
                  />
                  <span className={styles.taskDateLabel}>Inicio</span>
                </div>
                <div className={styles.taskDateBox}>
                  <input
                    type="number"
                    min="1"
                    value={task.duration || 1}
                    onChange={(e) =>
                      onUpdateTask({
                        ...task,
                        duration: Number(e.target.value),
                      })
                    }
                    className={styles.durationInput}
                  />
                  <span className={styles.taskDateLabel}>Duración (días)</span>
                </div>
              </>
            ) : (
              <>
                <div className={styles.taskDateBox}>
                  <span>{formatDate(startDate)}</span>
                  <span className={styles.taskDateLabel}>Inicio</span>
                </div>
                <div className={styles.taskDateBox}>
                  <span>{formatDate(endDate)}</span>
                  <span className={styles.taskDateLabel}>Fin</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sección de progreso */}
        <div className={styles.taskProgressSection}>
          <h4>Progreso</h4>
          <div className={styles.taskProgressBar}>
            <div
              className={styles.taskProgressFill}
              style={{ width: `${task.progress || 0}%` }}
            ></div>
          </div>
          <div className={styles.taskProgressInfo}>
            <div className={styles.progressValueContainer}>
              <span>{task.progress || 0}% completado</span>
              {showProgressIndicator && (
                <div className={styles.progressChangeIndicator}>
                  <span className={styles.indicatorValue}>
                    +{task.progress - (selectedTask?.progress || 0)}%
                  </span>
                  <div className={styles.indicatorArrow}></div>
                </div>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={task.progress || 0}
              onChange={(e) => {
                const newProgress = Number(e.target.value);
                onUpdateTask({ ...task, progress: newProgress });
              }}
              className={styles.taskProgressSlider}
            />
          </div>
        </div>

        {/* Sección de recursos */}
        <div className={styles.taskResourcesSection}>
          <h4>Recursos asignados</h4>
          <div className={styles.taskResourcesInfo}>
            <span>No hay recursos asignados a esta tarea</span>
            <button className={styles.taskResourcesButton}>
              Asignar recurso... <span className={styles.dropdownIcon}>▼</span>
            </button>
          </div>
        </div>

        {/* Sección de línea temporal */}
        <div className={styles.taskTimelineSection}>
          <h4>Línea temporal</h4>
          <div className={styles.taskTimelineInfo}>
            {startDate && (
              <div className={styles.timelinePoint}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineText}>
                  <strong>{formatDate(startDate)}</strong>
                  <span>Fecha de inicio</span>
                </div>
              </div>
            )}

            {endDate && (
              <div className={styles.timelinePoint}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineText}>
                  <strong>{formatDate(endDate)}</strong>
                  <span>Fecha de fin</span>
                </div>
              </div>
            )}

            <div className={styles.timelineDuration}>
              <span>Duración: {duration} días</span>
            </div>
          </div>
        </div>

        {/* Sección de dependencias */}
        <div className={styles.taskDependenciesSection}>
          <h4>Dependencias</h4>
          {predecessorTask ? (
            <div className={styles.taskDependencyItem}>
              <span>{predecessorTask.name}</span>
              <span className={styles.dependencyType}>Predecesora</span>
            </div>
          ) : (
            <div className={styles.taskNoDependencies}>
              <button className={styles.addDependencyButton}>
                Agregar dependencia...
              </button>
            </div>
          )}
        </div>

        {/* Sección de insights de IA */}
        <div className={styles.taskInsightsSection}>
          <div className={styles.taskInsightsHeader}>
            <div className={styles.taskInsightsIcon}>IA</div>
            <span>Insights por IA</span>
          </div>

          <div className={styles.taskInsightsContent}>
            <h5>🔍 Análisis de la tarea</h5>
            {task && analyzeTaskForAlerts(task) ? (
              <div className={styles.taskAlertBox}>
                <TaskAIAlert
                  message={analyzeTaskForAlerts(task) || ""}
                  onClick={() => task && openSuggestionsForTask(task.id)}
                />
              </div>
            ) : (
              <p>No se detectan problemas en esta tarea.</p>
            )}

            <button
              className={styles.showSuggestionsButton}
              onClick={() => task && openSuggestionsForTask(task.id)}
            >
              Ver sugerencias de IA
            </button>
          </div>
        </div>

        {/* Sección de acciones */}
        <div className={styles.taskActionsSection}>
          <h4>Acciones</h4>
          <div className={styles.taskActionsButtons}>
            {isEditMode ? (
              // Botones en modo edición
              <>
                <button className={styles.taskCancelButton} onClick={onCancel}>
                  Cancelar
                </button>
                <button className={styles.taskSaveButton} onClick={onSave}>
                  Guardar
                </button>
              </>
            ) : confirmDelete ? (
              // Botones en modo confirmación de eliminación
              <>
                <div className={styles.deleteConfirmMessage}>
                  ¿Estás seguro de eliminar esta tarea?
                </div>
                <button className={styles.taskCancelButton} onClick={onCancel}>
                  Cancelar
                </button>
                <button
                  className={styles.taskDeleteConfirmButton}
                  onClick={onDelete}
                >
                  Confirmar
                </button>
              </>
            ) : (
              // Botones en modo normal
              <>
                <button className={styles.taskEditButton} onClick={onEdit}>
                  Editar
                </button>
                <button className={styles.taskDeleteButton} onClick={onDelete}>
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.taskDetailFooter}>
        {!isEditMode && !confirmDelete && (
          <button className={styles.taskSaveButton} onClick={onSaveAndClose}>
            Guardar cambios
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskDetailPanel;
