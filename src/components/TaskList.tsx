import React from "react";
import { Task } from "../types/ganttTypes";
import styles from "../styles/TaskList.module.css";

interface TaskListProps {
  tasks: Task[];
  openMap: { [key: string]: boolean };
  onToggle: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, openMap, onToggle }) => {
  // Determina la clase del badge según el progreso
  const getProgressBadgeStyle = (progress: number) => {
    if (progress === 100) return styles.progressComplete;
    if (progress >= 80) return styles.progressHigh;
    if (progress >= 40) return styles.progressMedium;
    if (progress > 0) return styles.progressLow;
    return styles.progressZero;
  };

  // Calcula la altura de una tarea expandida o colapsada
  const calculateTaskHeight = (
    task: Task,
    isOpen: boolean
  ): React.CSSProperties => {
    const subtasksCount =
      isOpen && task.subtasks?.length ? task.subtasks.length : 0;
    const minHeight = isOpen ? 60 + subtasksCount * 28 : 60;

    return {
      height: isOpen ? "auto" : "60px",
      minHeight,
      paddingBottom: isOpen ? "15px" : "0",
      overflow: "visible",
      transition:
        "height 0.3s ease, min-height 0.3s ease, padding-bottom 0.3s ease",
      transitionDelay: "0.05s",
    };
  };

  // Renderiza una subtarea
  const renderSubtask = (
    subtask: Task,
    taskIndex: number,
    subtaskIndex: number
  ) => (
    <li key={subtask.id} className={styles.subtask}>
      <span className={styles.subLabel}>
        {`${taskIndex + 1}.${subtaskIndex + 1}`} {subtask.name}
      </span>
      <span
        className={`${styles.progressBadge} ${getProgressBadgeStyle(
          subtask.progress || 0
        )}`}
      >
        {subtask.progress || 0}%
      </span>
    </li>
  );

  return (
    <div className={styles.wrapper}>
      {tasks.map((task, i) => {
        const isOpen = openMap[task.id] || false;

        return (
          <div
            key={task.id}
            className={styles.group}
            style={calculateTaskHeight(task, isOpen)}
          >
            <div className={styles.parent}>
              <button
                onClick={() => onToggle(task.id)}
                className={styles.toggleBtn}
                aria-label={isOpen ? "Colapsar tarea" : "Expandir tarea"}
              >
                {isOpen ? "▼" : "▶"}
              </button>
              <span className={styles.parentTitle}>
                {i + 1}. {task.name}
              </span>
              {task.progress !== undefined && (
                <span
                  className={`${styles.progressBadge} ${getProgressBadgeStyle(
                    task.progress
                  )}`}
                >
                  {task.progress}%
                </span>
              )}
            </div>

            {isOpen && task.subtasks?.length > 0 && (
              <ul className={styles.subtaskList}>
                {task.subtasks.map((sub, j) => renderSubtask(sub, i, j))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;
