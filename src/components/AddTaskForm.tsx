import React, { useState } from "react";
import { Task } from "../types/ganttTypes";
import styles from "../styles/AddTaskForm.module.css";
// Importar DatePicker y sus estilos
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface AddTaskFormProps {
  onAdd: (task: Task) => void;
  onCancel: () => void;
  parentTasks?: Task[]; // Tareas que podrían ser padres
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({
  onAdd,
  onCancel,
  parentTasks = [],
}) => {
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [duration, setDuration] = useState(5);
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState("#3b82f6");
  const [parentId, setParentId] = useState("");
  const [showValidationError, setShowValidationError] = useState(false);

  const colorOptions = [
    { value: "#3b82f6", label: "Azul" },
    { value: "#f97316", label: "Naranja" },
    { value: "#10b981", label: "Verde" },
    { value: "#8b5cf6", label: "Púrpura" },
    { value: "#ec4899", label: "Rosa" },
    { value: "#6b7280", label: "Gris" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
      setShowValidationError(true);
      return;
    }

    const newTask: Task = {
      id: "", // Se asignará en el componente padre
      name: taskName,
      startDate: startDate.toISOString().split("T")[0], // Convertir Date a string formato YYYY-MM-DD
      duration,
      progress,
      color,
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
            {/* Reemplazar el input nativo por DatePicker */}
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
                  {task.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
