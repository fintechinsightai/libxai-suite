import React, { useState, useEffect } from "react";
import { Task, User, TaskInheritanceConfig } from "../types/ganttTypes";
import styles from "../styles/AddTaskForm.module.css";
// Importar DatePicker y sus estilos
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface AddTaskFormProps {
  onAdd: (task: Task) => void;
  onCancel: () => void;
  parentTasks?: Task[]; // Tareas que podrían ser padres
  users?: User[]; // ✅ Lista de usuarios disponibles
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({
  onAdd,
  onCancel,
  parentTasks = [],
  users = [],
}) => {
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [duration, setDuration] = useState(5);
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState("#3b82f6");
  const [parentId, setParentId] = useState("");
  const [showValidationError, setShowValidationError] = useState(false);

  // ✅ ESTADOS PARA USUARIOS
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // ✅ NUEVOS ESTADOS PARA HERENCIA
  const [inheritUsers, setInheritUsers] = useState(true); // Por defecto heredar
  const [inheritMode, setInheritMode] = useState<
    "all" | "supervisors_only" | "none"
  >("all");
  const [showInheritanceConfig, setShowInheritanceConfig] = useState(false);
  const [inheritedUsers, setInheritedUsers] = useState<User[]>([]);
  const [canInherit, setCanInherit] = useState(false);

  const colorOptions = [
    { value: "#3b82f6", label: "Azul" },
    { value: "#f97316", label: "Naranja" },
    { value: "#10b981", label: "Verde" },
    { value: "#8b5cf6", label: "Púrpura" },
    { value: "#ec4899", label: "Rosa" },
    { value: "#6b7280", label: "Gris" },
  ];

  // ✅ EFECTO PARA DETECTAR HERENCIA DISPONIBLE
  useEffect(() => {
    if (parentId) {
      const parentTask = parentTasks.find((task) => task.id === parentId);
      if (parentTask?.assignedUsers && parentTask.assignedUsers.length > 0) {
        setCanInherit(true);
        setShowInheritanceConfig(true);

        // Calcular usuarios a heredar según el modo
        const usersToInherit = calculateInheritedUsers(
          parentTask.assignedUsers,
          inheritMode
        );
        setInheritedUsers(usersToInherit);

        // Si herencia está activada, aplicar usuarios heredados
        if (inheritUsers) {
          setSelectedUsers(usersToInherit);
        }
      } else {
        setCanInherit(false);
        setShowInheritanceConfig(false);
        setInheritedUsers([]);
      }
    } else {
      setCanInherit(false);
      setShowInheritanceConfig(false);
      setInheritedUsers([]);
    }
  }, [parentId, inheritMode, inheritUsers]);

  // ✅ FUNCIÓN PARA CALCULAR USUARIOS HEREDADOS
  const calculateInheritedUsers = (
    parentUsers: User[],
    mode: string
  ): User[] => {
    switch (mode) {
      case "all":
        return [...parentUsers];
      case "supervisors_only":
        // En un futuro con roles, filtrar solo Owner/Lead
        // Por ahora, tomar usuarios con skillLevel Lead/Senior
        return parentUsers.filter(
          (user) => user.skillLevel === "Lead" || user.skillLevel === "Senior"
        );
      case "none":
        return [];
      default:
        return [...parentUsers];
    }
  };

  // ✅ EFECTO PARA APLICAR HERENCIA CUANDO CAMBIA
  useEffect(() => {
    if (canInherit && inheritUsers && inheritedUsers.length > 0) {
      setSelectedUsers(inheritedUsers);
    } else if (!inheritUsers && canInherit) {
      // Si desactiva herencia, limpiar solo usuarios heredados
      setSelectedUsers([]);
    }
  }, [inheritUsers, inheritedUsers, canInherit]);

  // ✅ FUNCIÓN PARA FILTRAR USUARIOS POR BÚSQUEDA
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // ✅ FUNCIÓN PARA AGREGAR USUARIO
  const handleAddUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setShowUserSelector(false);
    setUserSearchQuery("");
  };

  // ✅ FUNCIÓN PARA REMOVER USUARIO
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  // ✅ FUNCIÓN PARA OBTENER INICIALES DE USUARIO
  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ✅ FUNCIÓN PARA MANEJAR CAMBIO EN HERENCIA
  const handleInheritanceToggle = (enabled: boolean) => {
    setInheritUsers(enabled);

    if (!enabled) {
      // Si desactiva herencia, mantener usuarios que no son heredados
      const nonInheritedUsers = selectedUsers.filter(
        (user) => !inheritedUsers.find((inherited) => inherited.id === user.id)
      );
      setSelectedUsers(nonInheritedUsers);
    }
  };

  // ✅ FUNCIÓN PARA OBTENER ETIQUETA DE USUARIO HEREDADO
  const getUserInheritanceLabel = (user: User): string | null => {
    if (
      canInherit &&
      inheritUsers &&
      inheritedUsers.find((u) => u.id === user.id)
    ) {
      return "Heredado";
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
      setShowValidationError(true);
      return;
    }

    // ✅ CREAR CONFIGURACIÓN DE HERENCIA
    const inheritanceConfig: TaskInheritanceConfig | undefined = canInherit
      ? {
          inheritUsers,
          inheritMode,
          roleMapping: {
            Owner: "Reviewer",
            Contributor: "Contributor",
            Reviewer: "Reviewer",
            Observer: "Observer",
          },
          allowOverride: true,
        }
      : undefined;

    const newTask: Task = {
      id: "", // Se asignará en el componente padre
      name: taskName,
      startDate: startDate.toISOString().split("T")[0],
      duration,
      progress,
      color,
      assignedUsers: selectedUsers, // ✅ USUARIOS FINALES (heredados + manuales)
      parentId: parentId || undefined, // ✅ REFERENCIA AL PADRE
      inheritUsers: canInherit ? inheritUsers : undefined, // ✅ CONFIGURACIÓN DE HERENCIA
      inheritanceConfig, // ✅ CONFIGURACIÓN COMPLETA
    };

    // Si es una subtarea, añadir información del padre
    if (parentId) {
      const parentTask = parentTasks.find((task) => task.id === parentId);
      if (parentTask) {
        newTask.parent = parentTask.name;
      }
    }

    onAdd(newTask);
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>Añadir Nueva Tarea</h2>
        <button
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="taskName">Nombre de la tarea *</label>
          <input
            id="taskName"
            type="text"
            value={taskName}
            onChange={(e) => {
              setTaskName(e.target.value);
              if (showValidationError) setShowValidationError(false);
            }}
            className={`${styles.formControl} ${
              showValidationError ? styles.inputError : ""
            }`}
            placeholder="Ej: Desarrollo de Frontend"
            autoFocus
          />
          {showValidationError && (
            <div className={styles.errorMessage}>
              El nombre de la tarea es obligatorio
            </div>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="startDate">Fecha de inicio</label>
            <DatePicker
              id="startDate"
              selected={startDate}
              onChange={(date) => date && setStartDate(date)}
              className={styles.formControl}
              dateFormat="yyyy-MM-dd"
              wrapperClassName={styles.datePickerWrapper}
              popperClassName={styles.datePickerPopper}
              calendarClassName={styles.datePickerCalendar}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="duration">Duración (días)</label>
            <input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={styles.formControl}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="progress">Progreso: {progress}%</label>
          <input
            id="progress"
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className={styles.rangeSlider}
          />
          <div className={styles.rangeLabels}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {parentTasks.length > 0 && (
          <div className={styles.formGroup}>
            <label htmlFor="parentTask">Tarea padre (opcional)</label>
            <select
              id="parentTask"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={styles.formControl}
            >
              <option value="">Sin tarea padre</option>
              {parentTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}{" "}
                  {task.assignedUsers?.length
                    ? `(${task.assignedUsers.length} usuarios)`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ✅ NUEVA SECCIÓN: CONFIGURACIÓN DE HERENCIA */}
        {showInheritanceConfig && (
          <div className={styles.inheritanceSection}>
            <div className={styles.inheritanceHeader}>
              <h4>Herencia de Usuarios</h4>
              <span className={styles.inheritanceInfo}>
                La tarea padre tiene {inheritedUsers.length} usuario(s)
                disponibles
              </span>
            </div>

            <div className={styles.inheritanceControls}>
              <div className={styles.inheritanceToggle}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={inheritUsers}
                    onChange={(e) => handleInheritanceToggle(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>
                    Heredar usuarios de la tarea padre
                  </span>
                </label>
              </div>

              {inheritUsers && (
                <div className={styles.inheritanceModeSelector}>
                  <label
                    htmlFor="inheritMode"
                    className={styles.inheritanceLabel}
                  >
                    Modo de herencia:
                  </label>
                  <select
                    id="inheritMode"
                    value={inheritMode}
                    onChange={(e) => setInheritMode(e.target.value as any)}
                    className={styles.inheritanceSelect}
                  >
                    <option value="all">Todos los usuarios</option>
                    <option value="supervisors_only">
                      Solo supervisores (Lead/Senior)
                    </option>
                    <option value="none">Ninguno</option>
                  </select>
                </div>
              )}

              {inheritUsers && inheritedUsers.length > 0 && (
                <div className={styles.inheritancePreview}>
                  <span className={styles.inheritancePreviewTitle}>
                    Se heredarán {inheritedUsers.length} usuario(s):
                  </span>
                  <div className={styles.inheritanceUsersList}>
                    {inheritedUsers.map((user) => (
                      <div key={user.id} className={styles.inheritanceUserChip}>
                        <div
                          className={styles.userAvatar}
                          style={{ backgroundColor: user.color || "#6b7280" }}
                        >
                          {getUserInitials(user.name)}
                        </div>
                        <span className={styles.inheritanceUserName}>
                          {user.name}
                        </span>
                        <span className={styles.inheritanceUserRole}>
                          ({user.role})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ SECCIÓN MEJORADA: ASIGNACIÓN DE USUARIOS */}
        {users.length > 0 && (
          <div className={styles.formGroup}>
            <label>
              Usuarios asignados ({selectedUsers.length})
              {canInherit && inheritUsers && (
                <span className={styles.inheritanceIndicator}>
                  • {inheritedUsers.length} heredados
                </span>
              )}
            </label>

            {/* Lista de usuarios seleccionados */}
            {selectedUsers.length > 0 && (
              <div className={styles.selectedUsersList}>
                {selectedUsers.map((user) => {
                  const isInherited = getUserInheritanceLabel(user);
                  return (
                    <div key={user.id} className={styles.selectedUserChip}>
                      <div
                        className={styles.userAvatar}
                        style={{ backgroundColor: user.color || "#6b7280" }}
                      >
                        {getUserInitials(user.name)}
                      </div>
                      <span className={styles.userName}>{user.name}</span>
                      <span className={styles.userRole}>({user.role})</span>
                      {isInherited && (
                        <span className={styles.inheritedBadge}>
                          {isInherited}
                        </span>
                      )}
                      <button
                        type="button"
                        className={styles.removeUserButton}
                        onClick={() => handleRemoveUser(user.id)}
                        title="Remover usuario"
                        disabled={isInherited !== null && inheritUsers} // No permitir remover heredados si herencia activa
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botón para agregar usuarios */}
            <div className={styles.userSelectorContainer}>
              <button
                type="button"
                className={styles.addUserButton}
                onClick={() => setShowUserSelector(!showUserSelector)}
              >
                + Asignar usuario adicional
              </button>

              {/* Selector desplegable de usuarios */}
              {showUserSelector && (
                <div className={styles.userDropdown}>
                  <div className={styles.userSearchContainer}>
                    <input
                      type="text"
                      placeholder="Buscar usuario..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className={styles.userSearchInput}
                    />
                  </div>

                  <div className={styles.availableUsersList}>
                    {filteredUsers.length > 0 ? (
                      filteredUsers
                        .filter(
                          (user) => !selectedUsers.find((u) => u.id === user.id)
                        )
                        .map((user) => (
                          <div
                            key={user.id}
                            className={styles.availableUserItem}
                            onClick={() => handleAddUser(user)}
                          >
                            <div
                              className={styles.userAvatar}
                              style={{
                                backgroundColor: user.color || "#6b7280",
                              }}
                            >
                              {getUserInitials(user.name)}
                            </div>
                            <div className={styles.userInfo}>
                              <span className={styles.userName}>
                                {user.name}
                              </span>
                              <span className={styles.userRole}>
                                {user.role} • {user.skillLevel}
                              </span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className={styles.noUsersMessage}>
                        {userSearchQuery
                          ? "No se encontraron usuarios"
                          : "Todos los usuarios ya están asignados"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="color">Color</label>
          <div className={styles.colorSelector}>
            {colorOptions.map((option) => (
              <div
                key={option.value}
                className={`${styles.colorOption} ${
                  color === option.value ? styles.selectedColor : ""
                }`}
                style={{ backgroundColor: option.value }}
                onClick={() => setColor(option.value)}
                title={option.label}
              />
            ))}
          </div>
        </div>

        <div className={styles.formButtons}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button type="submit" className={styles.submitButton}>
            Añadir Tarea
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTaskForm;
