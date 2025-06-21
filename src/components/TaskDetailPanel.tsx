import React, { useState } from "react";
import { Task, User } from "../types/ganttTypes";
import styles from "../styles/TaskDetailPanel.module.css";
import { format } from "date-fns";
import { TaskAIAlert } from "./TaskAIComponents";
import DatePicker from "react-datepicker";
import MiniAvatar from "./MiniAvatar";
import AvatarGroup from "./AvatarGroup";
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

  // ========== NUEVAS PROPS PARA RECURSOS ==========
  users?: User[];
  userWorkloads?: { [userId: string]: number };
  onUserAssign?: (taskId: string, userId: string) => void;
  onUserUnassign?: (taskId: string, userId: string) => void;
  onUserClick?: (user: User, taskId: string) => void;
  enableResourceManagement?: boolean;
}

/**
 * Panel de detalles de tarea mejorado con gestión de recursos
 *
 * Muestra y permite editar los detalles de una tarea seleccionada
 * Incluye asignación/desasignación de usuarios y avatares
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

  // ========== PROPS DE RECURSOS CON VALORES POR DEFECTO ==========
  users = [],
  userWorkloads = {},
  onUserAssign,
  onUserUnassign,
  onUserClick,
  enableResourceManagement = true,
}) => {
  // ========== ESTADOS PARA GESTIÓN DE RECURSOS ==========
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [searchUserTerm, setSearchUserTerm] = useState("");

  // Calcular datos para el panel
  const taskDates = getTaskDates(task);
  const { startDate, endDate, duration } = taskDates;
  const predecessorTask = getPredecessorTask(task);

  // ========== FUNCIONES HELPER PARA RECURSOS ==========

  // Obtener usuarios asignados a la tarea con validación
  const getAssignedUsers = (): User[] => {
    if (!task.assignedUsers || !Array.isArray(task.assignedUsers)) {
      return [];
    }

    return task.assignedUsers.filter((user) => {
      const isValid = user && typeof user === "object" && user.id && user.name;
      if (!isValid) {
        console.warn("TaskDetailPanel: Usuario inválido filtrado:", user);
      }
      return isValid;
    });
  };

  // Obtener usuarios disponibles para asignar
  const getAvailableUsers = (): User[] => {
    const assignedUserIds = getAssignedUsers().map((user) => user.id);
    return users.filter((user) => !assignedUserIds.includes(user.id));
  };

  // Filtrar usuarios según término de búsqueda
  const getFilteredAvailableUsers = (): User[] => {
    const availableUsers = getAvailableUsers();

    if (!searchUserTerm.trim()) {
      return availableUsers;
    }

    return availableUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchUserTerm.toLowerCase())
    );
  };

  // ========== MANEJADORES DE EVENTOS PARA RECURSOS ==========

  // Asignar usuario a la tarea
  const handleAssignUser = (user: User) => {
    console.log(`🔄 Asignando usuario ${user.name} a tarea ${task.id}`);

    if (onUserAssign) {
      onUserAssign(task.id, user.id);
    } else {
      // Lógica por defecto: actualizar la tarea directamente
      const currentUsers = getAssignedUsers();
      const isAlreadyAssigned = currentUsers.some((u) => u.id === user.id);

      if (!isAlreadyAssigned) {
        const updatedTask = {
          ...task,
          assignedUsers: [...currentUsers, user],
        };
        onUpdateTask(updatedTask);
      }
    }

    setShowUserSelector(false);
    setSearchUserTerm("");
  };

  // Desasignar usuario de la tarea
  const handleUnassignUser = (user: User) => {
    console.log(`🔄 Desasignando usuario ${user.name} de tarea ${task.id}`);

    if (onUserUnassign) {
      onUserUnassign(task.id, user.id);
    } else {
      // Lógica por defecto: actualizar la tarea directamente
      const updatedUsers = getAssignedUsers().filter((u) => u.id !== user.id);
      const updatedTask = {
        ...task,
        assignedUsers: updatedUsers,
      };
      onUpdateTask(updatedTask);
    }
  };

  // Click en usuario asignado
  const handleUserClick = (user: User) => {
    if (onUserClick) {
      onUserClick(user, task.id);
    } else {
      // Comportamiento por defecto: mostrar información del usuario
      alert(
        `Usuario: ${user.name}\nRol: ${
          user.role || "No especificado"
        }\nEmail: ${user.email || "No disponible"}\nUtilización: ${
          userWorkloads[user.id] || 0
        }%`
      );
    }
  };

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

  // Obtener color de indicador de carga de trabajo
  const getWorkloadColor = (percent: number): string => {
    if (percent >= 100) return "#EF4444"; // Rojo - Sobrecargado
    if (percent >= 80) return "#F59E0B"; // Naranja - Alta carga
    if (percent >= 50) return "#10B981"; // Verde - Carga normal
    return "#6B7280"; // Gris - Poca carga
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

        {/* ========== SECCIÓN DE RECURSOS MEJORADA ========== */}
        {enableResourceManagement && (
          <div className={styles.taskResourcesSection}>
            <div className={styles.taskResourcesHeader}>
              <h4>Recursos asignados</h4>
              <span className={styles.resourceCount}>
                {getAssignedUsers().length} de {users.length} usuarios
              </span>
            </div>

            {/* Lista de usuarios asignados */}
            <div className={styles.assignedUsersContainer}>
              {getAssignedUsers().length > 0 ? (
                <div className={styles.assignedUsersList}>
                  {getAssignedUsers().map((user) => (
                    <div key={user.id} className={styles.assignedUserItem}>
                      <div className={styles.assignedUserInfo}>
                        <MiniAvatar
                          user={user}
                          size="md"
                          showWorkloadIndicator={true}
                          utilizationPercent={userWorkloads[user.id] || 0}
                          onClick={() => handleUserClick(user)}
                        />
                        <div className={styles.assignedUserDetails}>
                          <span className={styles.assignedUserName}>
                            {user.name}
                          </span>
                          <span className={styles.assignedUserRole}>
                            {user.role || "Colaborador"}
                          </span>
                          <div className={styles.assignedUserWorkload}>
                            <span className={styles.workloadLabel}>Carga:</span>
                            <span
                              className={styles.workloadValue}
                              style={{
                                color: getWorkloadColor(
                                  userWorkloads[user.id] || 0
                                ),
                              }}
                            >
                              {userWorkloads[user.id] || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnassignUser(user)}
                        className={styles.unassignUserButton}
                        title={`Remover ${user.name} de esta tarea`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noAssignedUsers}>
                  <span>No hay recursos asignados a esta tarea</span>
                </div>
              )}

              {/* Botón para mostrar selector de usuarios */}
              <div className={styles.assignUserContainer}>
                {!showUserSelector ? (
                  <button
                    className={styles.taskResourcesButton}
                    onClick={() => setShowUserSelector(true)}
                    disabled={getAvailableUsers().length === 0}
                  >
                    <span className={styles.addUserIcon}>👤+</span>
                    Asignar recurso...
                    <span className={styles.dropdownIcon}>▼</span>
                  </button>
                ) : (
                  <div className={styles.userSelectorContainer}>
                    {/* Buscador de usuarios */}
                    <div className={styles.userSearchContainer}>
                      <input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={searchUserTerm}
                        onChange={(e) => setSearchUserTerm(e.target.value)}
                        className={styles.userSearchInput}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setShowUserSelector(false);
                          setSearchUserTerm("");
                        }}
                        className={styles.cancelUserSelectorButton}
                      >
                        Cancelar
                      </button>
                    </div>

                    {/* Lista de usuarios disponibles */}
                    <div className={styles.availableUsersList}>
                      {getFilteredAvailableUsers().length > 0 ? (
                        getFilteredAvailableUsers().map((user) => (
                          <div
                            key={user.id}
                            className={styles.availableUserItem}
                            onClick={() => handleAssignUser(user)}
                          >
                            <MiniAvatar
                              user={user}
                              size="sm"
                              showWorkloadIndicator={true}
                              utilizationPercent={userWorkloads[user.id] || 0}
                            />
                            <div className={styles.availableUserInfo}>
                              <span className={styles.availableUserName}>
                                {user.name}
                              </span>
                              <span className={styles.availableUserRole}>
                                {user.role || "Colaborador"} •{" "}
                                {userWorkloads[user.id] || 0}% utilización
                              </span>
                            </div>
                            <span className={styles.addUserIndicator}>+</span>
                          </div>
                        ))
                      ) : (
                        <div className={styles.noAvailableUsers}>
                          {searchUserTerm.trim()
                            ? `No se encontraron usuarios para "${searchUserTerm}"`
                            : "Todos los usuarios ya están asignados"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========== RESTO DE SECCIONES EXISTENTES ========== */}

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
              {getAssignedUsers().length > 0 && (
                <span className={styles.timelineResources}>
                  • {getAssignedUsers().length} recursos asignados
                </span>
              )}
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

            {/* Insights adicionales de recursos */}
            {enableResourceManagement && getAssignedUsers().length > 0 && (
              <div className={styles.resourceInsights}>
                <h6>👥 Análisis de recursos</h6>
                {getAssignedUsers().some(
                  (user) => (userWorkloads[user.id] || 0) >= 100
                ) && (
                  <div className={styles.resourceAlert}>
                    ⚠️ Algunos usuarios están sobrecargados
                  </div>
                )}
                {getAssignedUsers().length === 1 && (
                  <div className={styles.resourceSuggestion}>
                    💡 Considera asignar más recursos para reducir riesgos
                  </div>
                )}
              </div>
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
