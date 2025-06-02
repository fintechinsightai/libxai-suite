import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Task } from "../types/ganttTypes";
import styles from "../styles/GanttChart.module.css";
import {
  addDays,
  addMonths,
  format,
  differenceInDays,
  getDaysInMonth,
  isBefore,
  isAfter,
  isWithinInterval,
  min,
  max,
} from "date-fns";
import { es } from "date-fns/locale";
import { TimeScale } from "./LibGanttIA";
import { TaskAIAlert, TaskAISuggestions, useTaskAI } from "./TaskAIComponents";
import TaskDetailPanel from "./TaskDetailPanel";

// ========== INTERFACES Y CONSTANTES ==========
interface GanttChartProps {
  tasks: Task[];
  openMap: { [key: string]: boolean };
  timeScale: TimeScale;
  gridConfig: GridConfig;
  onDeleteTask?: (taskId: string) => void;
  onEditTask?: (taskId: string, updatedTask: Task) => void;
  onTasksUpdate?: (tasks: Task[]) => void;
}

interface GridConfig {
  showLines: boolean;
  visualDensity: number;
  horizontalColor: string;
  verticalColor: string;
  lineStyle: string;
  gridType: string;
  showCurrentTime: boolean;
}

interface ResizeState {
  isResizing: boolean;
  resizeTaskId: string | null;
  resizeType: "start" | "end" | "move";
  initialX: number;
  initialWidth: number;
  initialLeft: number;
  initialStartDate: Date | null;
  initialDuration: number;
}

const CURRENT_DATE = new Date();
const SUBTASK_MARGIN = 3;
const RESIZE_HANDLE_WIDTH = 10;

// ========== FUNCIONES UTILITARIAS ==========
const formatDate = (date: Date | null): string => {
  if (!date) return "No establecida";
  return format(date, "dd MMM yyyy", { locale: es });
};

const calculateDateRanges = (tasks: Task[]) => {
  if (!tasks?.length) {
    return {
      earliestDate: CURRENT_DATE,
      latestDate: addMonths(CURRENT_DATE, 2),
    };
  }

  let earliestDate = CURRENT_DATE;
  let latestDate = CURRENT_DATE;

  const processTask = (task: Task) => {
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      if (isBefore(startDate, earliestDate)) earliestDate = startDate;
    }

    if (task.startDate && task.duration) {
      const startDate = new Date(task.startDate);
      const endDate = addDays(startDate, task.duration);
      if (isAfter(endDate, latestDate)) latestDate = endDate;
    }

    task.subtasks?.forEach(processTask);
  };

  tasks.forEach(processTask);
  return {
    earliestDate: addDays(earliestDate, -7),
    latestDate: addDays(latestDate, 14),
  };
};

const getScaleConfig = (timeScale: TimeScale, tasks: Task[]) => {
  const { earliestDate, latestDate } = calculateDateRanges(tasks);
  const totalDaysNeeded = differenceInDays(latestDate, earliestDate) + 1;

  const configs = {
    day: {
      startDate: earliestDate,
      daysVisible: Math.max(31, totalDaysNeeded),
      unitWidth: 48,
    },
    week: {
      startDate: earliestDate,
      daysVisible: Math.max(84, totalDaysNeeded),
      unitWidth: 24,
    },
    month: {
      startDate: earliestDate,
      daysVisible: Math.max(180, totalDaysNeeded),
      unitWidth: 12,
    },
  };

  return configs[timeScale] || configs.week;
};

// ========== FUNCIÓN PARA INICIALIZAR FECHAS DE SUBTAREAS ==========
const initializeSubtaskDates = (parentTask: Task): Task => {
  if (!parentTask.subtasks || parentTask.subtasks.length === 0) {
    return parentTask;
  }

  let currentDate = parentTask.startDate
    ? new Date(parentTask.startDate)
    : new Date();

  const updatedSubtasks = parentTask.subtasks.map((subtask, index) => {
    if (!subtask.startDate) {
      const updatedSubtask = {
        ...subtask,
        startDate: currentDate.toISOString().split("T")[0],
        duration: subtask.duration || 1,
      };
      currentDate = addDays(currentDate, subtask.duration || 1);
      return updatedSubtask;
    }
    return subtask;
  });

  return {
    ...parentTask,
    subtasks: updatedSubtasks,
  };
};

// ========== CALCULAR DIMENSIONES DE TAREA PADRE MEJORADO ==========
const calculateParentTaskDimensions = (parentTask: Task): Task => {
  if (!parentTask.subtasks || parentTask.subtasks.length === 0) {
    return parentTask;
  }

  let earliestStart: Date | null = null;
  let latestEnd: Date | null = null;

  parentTask.subtasks.forEach((subtask) => {
    if (subtask.startDate) {
      const subtaskStart = new Date(subtask.startDate);
      const subtaskEnd = addDays(subtaskStart, subtask.duration || 1);

      if (!earliestStart || isBefore(subtaskStart, earliestStart)) {
        earliestStart = subtaskStart;
      }

      if (!latestEnd || isAfter(subtaskEnd, latestEnd)) {
        latestEnd = subtaskEnd;
      }
    }
  });

  if (earliestStart && latestEnd) {
    const newDuration = differenceInDays(latestEnd, earliestStart);
    return {
      ...parentTask,
      startDate: earliestStart.toISOString().split("T")[0],
      duration: Math.max(1, newDuration),
    };
  }

  return parentTask;
};

// ========== COMPONENTE PRINCIPAL ==========
const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  openMap,
  timeScale,
  gridConfig,
  onDeleteTask,
  onEditTask,
  onTasksUpdate,
}) => {
  // ========== ESTADOS ==========
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [internalTasks, setInternalTasks] = useState<Task[]>(tasks);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskNameEdit, setTaskNameEdit] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [svgUpdateKey, setSvgUpdateKey] = useState(0);
  const [isDraggingSubtask, setIsDraggingSubtask] = useState(false);
  const [draggedParentId, setDraggedParentId] = useState<string | null>(null);

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizeTaskId: null,
    resizeType: "move",
    initialX: 0,
    initialWidth: 0,
    initialLeft: 0,
    initialStartDate: null,
    initialDuration: 0,
  });

  // ========== REFERENCIAS ==========
  const gridRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // *** ESTADO DE ARRASTRE MEJORADO CON SOPORTE PARA SUBTAREAS ***
  const dragStateRef = useRef({
    isDragging: false,
    taskId: null as string | null,
    parentId: null as string | null, // Para subtareas, ID de la tarea padre
    isSubtask: false, // Indica si es una subtarea o tarea principal
    initialTaskDate: null as Date | null,
    initialSubtaskDates: [] as { id: string; date: Date }[],
    startMouseX: 0,
    lastMouseX: 0,
    lastUpdateTime: 0,
    accumulatedDays: 0, // Propiedad para acumular días movidos
    gridRect: null as DOMRect | null,
  });

  const resizeStateRef = useRef(resizeState);
  const internalTasksRef = useRef(internalTasks);
  const configRef = useRef<any>(null);
  const handleMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const handleMouseUpRef = useRef<((e: MouseEvent) => void) | null>(null);

  // ========== HOOKS ==========
  const config = useMemo(
    () => getScaleConfig(timeScale, internalTasks),
    [timeScale, internalTasks]
  );

  const visibleDateRange = useMemo(
    () => ({
      start: config.startDate,
      end: addDays(config.startDate, config.daysVisible),
    }),
    [config]
  );

  const gridHeight = useMemo(
    () =>
      Math.max(
        500,
        tasks.reduce((acc, task) => {
          const isOpen = openMap[task.id];
          const subtasksCount =
            isOpen && task.subtasks?.length ? task.subtasks.length : 0;
          return (
            acc + 40 + subtasksCount * (28 + SUBTASK_MARGIN + SUBTASK_MARGIN)
          );
        }, 150)
      ),
    [tasks, openMap]
  );

  const {
    analyzeTaskForAlerts,
    generateSuggestionsForTask,
    openSuggestionsForTask,
    closeSuggestions,
    applySuggestion,
    showSuggestions,
    selectedTaskId,
  } = useTaskAI(internalTasks);

  // ========== SCROLL HORIZONTAL CON MOUSE ==========
  useEffect(() => {
    let isScrolling = false;
    let startScrollLeft = 0;
    let startX = 0;

    const handleWheelScroll = (e: WheelEvent) => {
      if (!gridContainerRef.current) return;

      if (e.shiftKey || Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        gridContainerRef.current.scrollLeft += e.deltaX || e.deltaY;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!gridContainerRef.current) return;
      isScrolling = true;
      startScrollLeft = gridContainerRef.current.scrollLeft;
      startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrolling || !gridContainerRef.current) return;
      e.preventDefault();

      const x = e.touches[0].clientX;
      const diff = startX - x;
      gridContainerRef.current.scrollLeft = startScrollLeft + diff;
    };

    const handleTouchEnd = () => {
      isScrolling = false;
    };

    const gridElement = gridContainerRef.current;
    if (gridElement) {
      gridElement.addEventListener("wheel", handleWheelScroll, {
        passive: false,
      });
      gridElement.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      gridElement.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      gridElement.addEventListener("touchend", handleTouchEnd);

      return () => {
        gridElement.removeEventListener("wheel", handleWheelScroll);
        gridElement.removeEventListener("touchstart", handleTouchStart);
        gridElement.removeEventListener("touchmove", handleTouchMove);
        gridElement.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, []);

  // ========== FUNCIONES DE ACTUALIZACIÓN ==========
  const updateTasks = useCallback(
    (newTasks: Task[]) => {
      setInternalTasks(newTasks);
      setSvgUpdateKey((prev) => prev + 1);
      if (onTasksUpdate) {
        onTasksUpdate(newTasks);
      } else {
        window.dispatchEvent(
          new CustomEvent("update-tasks", { detail: newTasks })
        );
      }
    },
    [onTasksUpdate]
  );

  // ========== FUNCIONES DE CÁLCULO ==========
  const calculateTop = useCallback(
    (index: number): number => {
      let top = 100;
      for (let i = 0; i < index; i++) {
        const task = tasks[i];
        const isOpen = openMap[task.id];
        const subtasks =
          isOpen && task.subtasks?.length ? task.subtasks.length : 0;
        top += 40 + subtasks * (28 + SUBTASK_MARGIN + SUBTASK_MARGIN);
      }
      return top;
    },
    [tasks, openMap]
  );

  const calculateTaskPosition = useCallback(
    (task: Task, parentTask?: Task) => {
      let taskStart: Date;

      if (task.startDate) {
        taskStart = new Date(task.startDate);
      } else {
        taskStart = visibleDateRange.start;
      }

      const taskOffset = Math.max(
        0,
        differenceInDays(taskStart, visibleDateRange.start)
      );

      return {
        left: taskOffset * config.unitWidth,
        width: (task.duration || 1) * config.unitWidth,
      };
    },
    [config.unitWidth, visibleDateRange.start]
  );

  const getTaskDates = useCallback((task: Task | null) => {
    if (!task) return { startDate: null, endDate: null, duration: 0 };
    const startDate = task.startDate ? new Date(task.startDate) : null;
    const endDate =
      startDate && task.duration ? addDays(startDate, task.duration) : null;
    return { startDate, endDate, duration: task.duration || 0 };
  }, []);

  const getPredecessorTask = useCallback(
    (currentTask: Task | null) => {
      if (!currentTask?.id) return null;
      const currentIndex = internalTasks.findIndex(
        (t) => t.id === currentTask.id
      );
      return currentIndex > 0 ? internalTasks[currentIndex - 1] : null;
    },
    [internalTasks]
  );

  const getTasksWithInitializedDates = useCallback((tasks: Task[]): Task[] => {
    return tasks.map((task) => initializeSubtaskDates(task));
  }, []);

  // ========== ACTUALIZACIÓN DE REFERENCIAS ==========
  useEffect(() => {
    resizeStateRef.current = resizeState;
  }, [resizeState]);

  useEffect(() => {
    internalTasksRef.current = internalTasks;
  }, [internalTasks]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // ========== MANEJADORES DE REDIMENSIONAMIENTO ==========
  const createResizeListeners = useCallback(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const currentResizeState = resizeStateRef.current;
      const currentTasks = internalTasksRef.current;
      const currentConfig = configRef.current;

      if (
        !currentResizeState.isResizing ||
        !currentResizeState.resizeTaskId ||
        !currentConfig
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const deltaX = e.clientX - currentResizeState.initialX;
      const deltaDays = Math.round(deltaX / currentConfig.unitWidth);

      let newStartDate = currentResizeState.initialStartDate;
      let newDuration = currentResizeState.initialDuration;

      if (currentResizeState.resizeType === "start") {
        newStartDate = addDays(currentResizeState.initialStartDate!, deltaDays);
        newDuration = Math.max(
          1,
          currentResizeState.initialDuration - deltaDays
        );
      } else if (currentResizeState.resizeType === "end") {
        newDuration = Math.max(
          1,
          currentResizeState.initialDuration + deltaDays
        );
      }

      const updatedTasks = currentTasks.map((parentTask) => {
        if (parentTask.subtasks) {
          const updatedSubtasks = parentTask.subtasks.map((subtask) => {
            if (subtask.id === currentResizeState.resizeTaskId) {
              return {
                ...subtask,
                startDate: newStartDate!.toISOString().split("T")[0],
                duration: newDuration,
              };
            }
            return subtask;
          });

          const updatedParent = {
            ...parentTask,
            subtasks: updatedSubtasks,
          };

          return calculateParentTaskDimensions(updatedParent);
        }
        return parentTask;
      });

      setInternalTasks(updatedTasks);
    };

    const handleMouseUp = () => {
      const currentResizeState = resizeStateRef.current;

      if (!currentResizeState.isResizing) return;

      setResizeState({
        isResizing: false,
        resizeTaskId: null,
        resizeType: "move",
        initialX: 0,
        initialWidth: 0,
        initialLeft: 0,
        initialStartDate: null,
        initialDuration: 0,
      });

      document.body.style.cursor = "default";
      document.body.classList.remove("resizing");
      updateTasks(internalTasksRef.current);

      if (handleMouseMoveRef.current) {
        document.removeEventListener("mousemove", handleMouseMoveRef.current);
        handleMouseMoveRef.current = null;
      }
      if (handleMouseUpRef.current) {
        document.removeEventListener("mouseup", handleMouseUpRef.current);
        handleMouseUpRef.current = null;
      }
    };

    return { handleMouseMove, handleMouseUp };
  }, [updateTasks]);

  const handleResizeStart = useCallback(
    (
      e: React.MouseEvent,
      task: Task,
      resizeType: "start" | "end",
      isSubtask: boolean = false
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isSubtask) {
        return;
      }

      if (handleMouseMoveRef.current) {
        document.removeEventListener("mousemove", handleMouseMoveRef.current);
      }
      if (handleMouseUpRef.current) {
        document.removeEventListener("mouseup", handleMouseUpRef.current);
      }

      const { left, width } = calculateTaskPosition(task);
      const startDate = task.startDate
        ? new Date(task.startDate)
        : visibleDateRange.start;

      setResizeState({
        isResizing: true,
        resizeTaskId: task.id,
        resizeType,
        initialX: e.clientX,
        initialWidth: width,
        initialLeft: left,
        initialStartDate: startDate,
        initialDuration: task.duration || 1,
      });

      document.body.style.cursor = "ew-resize";
      document.body.classList.add("resizing");

      const { handleMouseMove, handleMouseUp } = createResizeListeners();

      handleMouseMoveRef.current = handleMouseMove;
      handleMouseUpRef.current = handleMouseUp;

      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp);
    },
    [calculateTaskPosition, visibleDateRange.start, createResizeListeners]
  );

  // ========== MANEJADORES DE ARRASTRE - MEJORADOS PARA TAREAS Y SUBTAREAS ==========
  const handleDragStart = useCallback(
    (
      e: React.DragEvent,
      task: Task,
      isSubtask: boolean = false,
      parentId?: string
    ) => {
      console.log(
        `🚀 [DRAG START] Iniciando arrastre de ${
          isSubtask ? "subtarea" : "tarea"
        }:`,
        task.name,
        "ID:",
        task.id
      );

      if (resizeState.isResizing) {
        e.preventDefault();
        return;
      }

      e.dataTransfer.setData("text/plain", "");
      e.dataTransfer.effectAllowed = "move";

      const dragImage = document.createElement("div");
      dragImage.style.cssText =
        "width:1px;height:1px;background:transparent;position:absolute;top:-1000px;";
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);

      // *** OBTENER RECTÁNGULO DEL GRID PARA CÁLCULOS PRECISOS ***
      const gridRect =
        gridContainerRef.current?.getBoundingClientRect() || null;

      const initialTaskDate = task.startDate
        ? new Date(task.startDate)
        : visibleDateRange.start;
      const initialSubtaskDates: { id: string; date: Date }[] = [];

      // Si es una tarea principal y tiene subtareas, guardar sus fechas iniciales
      if (!isSubtask && task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask) => {
          if (subtask.startDate) {
            initialSubtaskDates.push({
              id: subtask.id,
              date: new Date(subtask.startDate),
            });
          }
        });
        console.log(
          "📋 [DRAG START] Subtareas encontradas:",
          initialSubtaskDates.length,
          "(expandidas:",
          openMap[task.id],
          ")"
        );
      }

      // *** INICIALIZAR ESTADO CON CÁLCULO ACUMULATIVO INCLUYENDO TIPO DE TAREA ***
      dragStateRef.current = {
        isDragging: true,
        taskId: task.id,
        parentId: isSubtask ? parentId || null : null,
        isSubtask,
        initialTaskDate,
        initialSubtaskDates,
        startMouseX: e.clientX,
        lastMouseX: e.clientX,
        lastUpdateTime: 0,
        accumulatedDays: 0,
        gridRect,
      };

      setIsDragging(true);
      setDraggedTaskId(task.id);

      // Marcar cuando es una subtarea para comportamientos distintos
      if (isSubtask) {
        setIsDraggingSubtask(true);
        setDraggedParentId(parentId || null);
      }

      console.log(
        `✅ [DRAG START] Estado de arrastre de ${
          isSubtask ? "subtarea" : "tarea"
        } inicializado`
      );
    },
    [resizeState.isResizing, visibleDateRange.start, openMap]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const dragState = dragStateRef.current;
      if (
        !dragState.isDragging ||
        !dragState.taskId ||
        !gridContainerRef.current ||
        !dragState.gridRect
      ) {
        return;
      }

      // Throttling para performance (30fps para mayor suavidad)
      const now = Date.now();
      if (now - dragState.lastUpdateTime < 33) {
        return;
      }
      dragState.lastUpdateTime = now;

      // *** CÁLCULO ACUMULATIVO DE MOVIMIENTO ***
      // Calcular la diferencia total desde el inicio del arrastre
      const currentMouseX = e.clientX;
      const totalDeltaX = currentMouseX - dragState.startMouseX;

      // Convertir la diferencia en píxeles a días
      const totalDeltaDays = Math.round(totalDeltaX / config.unitWidth);

      // Solo actualizar si el total de días ha cambiado
      if (totalDeltaDays === dragState.accumulatedDays) {
        dragState.lastMouseX = currentMouseX;
        return;
      }

      console.log(
        `🔄 [DRAG OVER] Delta total: ${totalDeltaDays} días (deltaX: ${totalDeltaX}px)`
      );

      // Actualizar el acumulado
      dragState.accumulatedDays = totalDeltaDays;
      dragState.lastMouseX = currentMouseX;

      const currentTasks = internalTasksRef.current;

      // Rama diferente si es una subtarea o una tarea principal
      if (dragState.isSubtask && dragState.parentId) {
        // MANEJAR ARRASTRE DE SUBTAREA
        console.log(
          `🔄 [DRAG OVER] Procesando arrastre de subtarea ${dragState.taskId} (padre: ${dragState.parentId})`
        );

        // Encontrar la tarea padre
        const parentIndex = currentTasks.findIndex(
          (t) => t.id === dragState.parentId
        );
        if (parentIndex === -1) {
          console.warn(
            "⚠️ [DRAG OVER] Tarea padre no encontrada:",
            dragState.parentId
          );
          return;
        }

        const parentTask = currentTasks[parentIndex];
        if (!parentTask.subtasks) {
          console.warn("⚠️ [DRAG OVER] La tarea padre no tiene subtareas");
          return;
        }

        // Encontrar la subtarea específica
        const subtaskIndex = parentTask.subtasks.findIndex(
          (st) => st.id === dragState.taskId
        );
        if (subtaskIndex === -1) {
          console.warn(
            "⚠️ [DRAG OVER] Subtarea no encontrada:",
            dragState.taskId
          );
          return;
        }

        // Calcular la nueva fecha para la subtarea
        const newSubtaskDate = addDays(
          dragState.initialTaskDate,
          totalDeltaDays
        );

        // Clonar las tareas para no mutar el estado directamente
        const updatedTasks = [...currentTasks];
        const updatedParentTask = { ...parentTask };

        // Crear una copia de las subtareas
        const updatedSubtasks = [...parentTask.subtasks];

        // Actualizar la subtarea específica
        updatedSubtasks[subtaskIndex] = {
          ...updatedSubtasks[subtaskIndex],
          startDate: newSubtaskDate.toISOString().split("T")[0],
        };

        // Actualizar la tarea padre con las subtareas actualizadas
        updatedParentTask.subtasks = updatedSubtasks;

        // Actualizar la tarea padre en la lista principal y recalcular sus dimensiones
        updatedTasks[parentIndex] =
          calculateParentTaskDimensions(updatedParentTask);

        // Actualizar el estado con las tareas modificadas
        setInternalTasks(updatedTasks);
        setSvgUpdateKey((prev) => prev + 1);
        internalTasksRef.current = updatedTasks;

        console.log("✅ [DRAG OVER] Subtarea actualizada correctamente");
      } else {
        // MANEJAR ARRASTRE DE TAREA PRINCIPAL (código existente)
        const taskIndex = currentTasks.findIndex(
          (t) => t.id === dragState.taskId
        );

        if (taskIndex === -1) {
          console.warn("⚠️ [DRAG OVER] Tarea no encontrada:", dragState.taskId);
          return;
        }

        const task = currentTasks[taskIndex];
        const hasExpandedSubtasks =
          task.subtasks && task.subtasks.length > 0 && openMap[task.id];

        // *** CREAR NUEVAS TAREAS CON FECHAS BASADAS EN LAS INICIALES ***
        const updatedTasks = [...currentTasks];
        const newTaskDate = addDays(dragState.initialTaskDate, totalDeltaDays);

        if (hasExpandedSubtasks && dragState.initialSubtaskDates.length > 0) {
          console.log("🔄 [DRAG OVER] Actualizando subtareas expandidas...");

          const updatedSubtasks = task.subtasks!.map((subtask) => {
            const initialSubtaskData = dragState.initialSubtaskDates.find(
              (d) => d.id === subtask.id
            );

            if (initialSubtaskData) {
              const newSubtaskDate = addDays(
                initialSubtaskData.date,
                totalDeltaDays
              );
              return {
                ...subtask,
                startDate: newSubtaskDate.toISOString().split("T")[0],
              };
            }

            return subtask;
          });

          updatedTasks[taskIndex] = {
            ...task,
            startDate: newTaskDate.toISOString().split("T")[0],
            subtasks: updatedSubtasks,
          };

          updatedTasks[taskIndex] = calculateParentTaskDimensions(
            updatedTasks[taskIndex]
          );

          console.log(
            "✅ [DRAG OVER] Subtareas expandidas actualizadas correctamente"
          );
        } else if (task.subtasks && task.subtasks.length > 0) {
          console.log(
            "🔄 [DRAG OVER] Actualizando tarea padre con subtareas NO expandidas..."
          );

          // *** MOVER SUBTAREAS BASÁNDOSE EN SUS FECHAS INICIALES ***
          const updatedSubtasks = task.subtasks.map((subtask) => {
            const initialSubtaskData = dragState.initialSubtaskDates.find(
              (d) => d.id === subtask.id
            );

            if (initialSubtaskData) {
              const newSubtaskDate = addDays(
                initialSubtaskData.date,
                totalDeltaDays
              );
              return {
                ...subtask,
                startDate: newSubtaskDate.toISOString().split("T")[0],
              };
            }

            return subtask;
          });
          // Solo actualizar las fechas, mantener la duración original
          updatedTasks[taskIndex] = {
            ...task,
            startDate: newTaskDate.toISOString().split("T")[0],
            subtasks: updatedSubtasks,
            duration: task.duration, // Mantener duración original
          };

          console.log(
            "✅ [DRAG OVER] Tarea padre con subtareas cerradas actualizada correctamente"
          );
        } else {
          console.log("🔄 [DRAG OVER] Actualizando tarea sin subtareas...");

          updatedTasks[taskIndex] = {
            ...task,
            startDate: newTaskDate.toISOString().split("T")[0],
          };

          console.log(
            "✅ [DRAG OVER] Tarea sin subtareas actualizada correctamente"
          );
        }

        // Actualizar las tareas en el estado
        setInternalTasks(updatedTasks);
        setSvgUpdateKey((prev) => prev + 1);
        internalTasksRef.current = updatedTasks;

        console.log("✅ [DRAG OVER] Estado actualizado");
      }
    },
    [config.unitWidth, openMap, calculateParentTaskDimensions]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      console.log("🏁 [DRAG END] Finalizando arrastre");

      const dragState = dragStateRef.current;

      if (!dragState.isDragging) {
        return;
      }

      // *** APLICAR RECÁLCULO DE DIMENSIONES SOLO AL FINAL ***
      const finalTasks = internalTasksRef.current.map((task) => {
        if (
          task.subtasks &&
          task.subtasks.length > 0 &&
          (task.id === dragState.taskId || task.id === dragState.parentId)
        ) {
          console.log(
            `🔧 [DRAG END] Recalculando dimensiones finales para: ${task.name}`
          );
          return calculateParentTaskDimensions(task);
        }
        return task;
      });

      // Resetear estado de arrastre
      dragStateRef.current = {
        isDragging: false,
        taskId: null,
        parentId: null,
        isSubtask: false,
        initialTaskDate: null,
        initialSubtaskDates: [],
        startMouseX: 0,
        lastMouseX: 0,
        lastUpdateTime: 0,
        accumulatedDays: 0,
        gridRect: null,
      };

      setIsDragging(false);
      setDraggedTaskId(null);
      setIsDraggingSubtask(false);
      setDraggedParentId(null);

      // Actualizar con las dimensiones finales correctas
      updateTasks(finalTasks);

      // Forzar actualización de líneas de conexión después de un pequeño delay
      setTimeout(() => {
        setSvgUpdateKey((prev) => prev + 1);
        console.log("✅ [DRAG END] Arrastre finalizado completamente");
      }, 50);
    },
    [updateTasks, calculateParentTaskDimensions]
  );

  // ========== MANEJADOR PARA ENTER EN INPUTS ==========
  const handleKeyDownInTaskEdit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const updatedTasks = internalTasks.map((t) =>
          t.id === editingTaskId ? { ...t, name: taskNameEdit } : t
        );
        updateTasks(updatedTasks);
        setEditingTaskId(null);
      }
    },
    [internalTasks, editingTaskId, taskNameEdit, updateTasks]
  );

  // ========== MANEJADORES DEL PANEL ==========
  const handleOpenPanel = useCallback((task: Task) => {
    setSelectedTask(task);
    setEditedTask({ ...task });
    setIsEditMode(false);
    setConfirmDelete(false);
  }, []);

  const handleEditTask = useCallback(() => setIsEditMode(true), []);

  const handleDeleteTask = useCallback(() => {
    if (!editedTask) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    if (onDeleteTask) {
      onDeleteTask(editedTask.id);
      setSelectedTask(null);
      setEditedTask(null);
      setConfirmDelete(false);
      return;
    }

    const updatedTasks = internalTasks.filter(
      (task) => task.id !== editedTask.id
    );

    if (editedTask.parent) {
      const parentTask = internalTasks.find(
        (t) => t.name === editedTask.parent
      );
      if (parentTask?.subtasks) {
        const updatedParent = {
          ...parentTask,
          subtasks: parentTask.subtasks.filter((st) => st.id !== editedTask.id),
        };
        const finalTasks = updatedTasks.map((t) =>
          t.id === parentTask.id ? updatedParent : t
        );
        updateTasks(finalTasks);
      }
    } else {
      updateTasks(updatedTasks);
    }

    setSelectedTask(null);
    setEditedTask(null);
    setConfirmDelete(false);
  }, [confirmDelete, editedTask, internalTasks, onDeleteTask, updateTasks]);

  const handleCancelEdit = useCallback(() => {
    if (selectedTask) setEditedTask({ ...selectedTask });
    setIsEditMode(false);
    setConfirmDelete(false);
  }, [selectedTask]);

  const handleSaveChanges = useCallback(() => {
    if (!editedTask) return;

    if (onEditTask) {
      onEditTask(editedTask.id, editedTask);
      setSelectedTask(editedTask);
      setIsEditMode(false);
      return;
    }

    const updatedTasks = internalTasks.map((task) => {
      if (task.id === editedTask.id) {
        return editedTask;
      } else if (task.subtasks?.some((st) => st.id === editedTask.id)) {
        return {
          ...task,
          subtasks: task.subtasks.map((st) =>
            st.id === editedTask.id ? editedTask : st
          ),
        };
      }
      return task;
    });

    updateTasks(updatedTasks);
    setSelectedTask(editedTask);
    setIsEditMode(false);
  }, [editedTask, internalTasks, onEditTask, updateTasks]);

  const handleClosePanel = useCallback(() => {
    setSelectedTask(null);
    setEditedTask(null);
    setIsEditMode(false);
    setConfirmDelete(false);
  }, []);

  // Modificación para handleUpdateTask en GanttChart.tsx
  const handleUpdateTask = useCallback(
    (updatedTask: Task) => {
      setEditedTask(updatedTask);

      // Si es una subtarea (tiene parent)
      if (updatedTask.parent) {
        const updatedTasks = [...internalTasks];
        const parentIndex = updatedTasks.findIndex(
          (t) => t.name === updatedTask.parent
        );

        if (parentIndex !== -1) {
          const parentTask = updatedTasks[parentIndex];

          if (parentTask.subtasks) {
            // Actualizar la subtarea específica
            const updatedSubtasks = parentTask.subtasks.map((subtask) =>
              subtask.id === updatedTask.id ? updatedTask : subtask
            );

            // Actualizar el task padre
            updatedTasks[parentIndex] = {
              ...parentTask,
              subtasks: updatedSubtasks,
            };

            // Recalcular las dimensiones
            updatedTasks[parentIndex] = calculateParentTaskDimensions(
              updatedTasks[parentIndex]
            );

            // Actualizar el estado
            setInternalTasks(updatedTasks);
            setSvgUpdateKey((prev) => prev + 1);
          }
        }
      } else if (selectedTask?.id === updatedTask.id) {
        // Para tareas normales (no subtareas)
        const updatedTasks = internalTasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t
        );
        setInternalTasks(updatedTasks);
        setSvgUpdateKey((prev) => prev + 1);
      }
    },
    [internalTasks, selectedTask, calculateParentTaskDimensions]
  );

  const handleSaveAndClose = useCallback(() => {
    if (!editedTask) return;
    updateTasks(
      internalTasks.map((t) => (t.id === editedTask.id ? editedTask : t))
    );
    setSelectedTask(null);
    setEditedTask(null);
  }, [editedTask, internalTasks, updateTasks]);

  // ========== FUNCIONES DE RENDERIZADO ==========
  const getDaysInRange = useCallback(() => {
    const days = [];
    let currentDate = new Date(visibleDateRange.start);
    const endDate = new Date(visibleDateRange.end);
    while (isBefore(currentDate, endDate)) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    return days;
  }, [visibleDateRange]);

  const groupDaysByMonth = useCallback((days: Date[]) => {
    const months: { [key: string]: Date[] } = {};
    days.forEach((day) => {
      const monthKey = format(day, "yyyy-MM");
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(day);
    });
    return months;
  }, []);

  const renderTimeHeaders = useCallback(() => {
    const days = getDaysInRange();
    const monthGroups = groupDaysByMonth(days);

    switch (timeScale) {
      case "day":
        return (
          <>
            <div className={styles.monthHeader}>
              {Object.entries(monthGroups).map(([key, daysInMonth]) => (
                <div
                  key={key}
                  className={styles.monthBlock}
                  style={{
                    width: `${daysInMonth.length * config.unitWidth}px`,
                  }}
                >
                  {format(daysInMonth[0], "MMMM yyyy", {
                    locale: es,
                  }).toUpperCase()}
                </div>
              ))}
            </div>
            <div className={styles.weekHeader}>
              {days.map((day, i) => (
                <div
                  key={`day-${i}`}
                  className={styles.weekBlock}
                  style={{ width: `${config.unitWidth}px` }}
                >
                  {format(day, "d", { locale: es })}
                </div>
              ))}
            </div>
          </>
        );

      case "week":
        const uniqueMonthsWeek = Array.from(
          new Set(days.map((d) => format(d, "yyyy-MM")))
        ).map((key) => {
          const [year, month] = key.split("-").map(Number);
          return new Date(year, month - 1, 1);
        });

        return (
          <>
            <div className={styles.monthHeader}>
              {uniqueMonthsWeek.map((date, i) => (
                <div
                  key={`month-${i}`}
                  className={styles.monthBlock}
                  style={{
                    width: `${getDaysInMonth(date) * config.unitWidth}px`,
                  }}
                >
                  {format(date, "MMMM yyyy", { locale: es }).toUpperCase()}
                </div>
              ))}
            </div>
            <div className={styles.weekHeader}>
              {Object.entries(monthGroups).flatMap(([key, daysInMonth]) => {
                const weeksInMonth = [];
                for (let i = 0; i < daysInMonth.length; i += 7) {
                  weeksInMonth.push(
                    daysInMonth.slice(i, Math.min(i + 7, daysInMonth.length))
                  );
                }
                return weeksInMonth.map((weekDays, weekIndex) => (
                  <div
                    key={`week-${key}-${weekIndex}`}
                    className={styles.weekBlock}
                    style={{ width: `${weekDays.length * config.unitWidth}px` }}
                  >
                    S{weekIndex + 1}
                  </div>
                ));
              })}
            </div>
          </>
        );

      case "month":
        const uniqueMonths = Array.from(
          new Set(days.map((d) => format(d, "yyyy-MM")))
        ).map((key) => {
          const [year, month] = key.split("-").map(Number);
          return new Date(year, month - 1, 1);
        });

        const quarters: { [key: string]: Date[] } = {};
        uniqueMonths.forEach((month) => {
          const quarterIndex = Math.floor(month.getMonth() / 3);
          const quarterKey = `${month.getFullYear()}-Q${quarterIndex + 1}`;
          if (!quarters[quarterKey]) quarters[quarterKey] = [];
          quarters[quarterKey].push(month);
        });

        return (
          <>
            <div className={styles.monthHeader}>
              {Object.entries(quarters).map(([key, monthsInQuarter]) => {
                const quarterWidth = monthsInQuarter.reduce(
                  (width, month) =>
                    width + getDaysInMonth(month) * config.unitWidth,
                  0
                );
                const [year, quarter] = key.split("-");
                return (
                  <div
                    key={key}
                    className={styles.monthBlock}
                    style={{ width: `${quarterWidth}px` }}
                  >
                    {`${quarter} TRIMESTRE ${year}`}
                  </div>
                );
              })}
            </div>
            <div className={styles.weekHeader}>
              {uniqueMonths.map((month, i) => (
                <div
                  key={`month-${i}`}
                  className={styles.weekBlock}
                  style={{
                    width: `${getDaysInMonth(month) * config.unitWidth}px`,
                  }}
                >
                  {format(month, "MMM", { locale: es }).toUpperCase()}
                </div>
              ))}
            </div>
          </>
        );

      default:
        return null;
    }
  }, [timeScale, getDaysInRange, groupDaysByMonth, config.unitWidth]);

  const renderConnectionLines = useCallback(
    () => (
      <svg
        key={`connections-svg-${svgUpdateKey}`}
        className={styles.connectionsContainer}
      >
        {internalTasks.map((task, taskIndex) => {
          if (taskIndex === 0) return null;

          const prevTask = internalTasks[taskIndex - 1];
          const taskTop = calculateTop(taskIndex);
          const prevTaskTop = calculateTop(taskIndex - 1);
          const { left: taskLeft } = calculateTaskPosition(task);
          const { left: prevTaskLeft, width: prevTaskWidth } =
            calculateTaskPosition(prevTask);
          const prevTaskEnd = prevTaskLeft + prevTaskWidth;

          const startX = prevTaskEnd;
          const startY = prevTaskTop + 40 / 2;
          const endX = taskLeft;
          const endY = taskTop + 40 / 2;
          const dx = endX - startX;
          const dy = endY - startY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const curveFactor = Math.min(Math.max(distance * 0.15, 30), 100);

          let pathData;
          if (Math.abs(dy) > 50) {
            const midX = startX + dx * 0.5;
            pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
          } else {
            pathData = `M ${startX} ${startY} C ${
              startX + curveFactor
            } ${startY}, ${endX - curveFactor} ${endY}, ${endX} ${endY}`;
          }

          return (
            <g key={`main-task-dependency-${task.id}`}>
              <path className={styles.taskDependencyLine} d={pathData} />
              <circle
                cx={endX}
                cy={endY}
                r={4}
                className={styles.dependencyPoint}
              />
            </g>
          );
        })}

        {internalTasks.map((task) => {
          if (!task.subtasks || !openMap[task.id]) return null;

          return task.subtasks.map((subtask, subIndex) => {
            if (subIndex === 0) return null;

            const prevSubtask = task.subtasks![subIndex - 1];
            const parentIndex = internalTasks.findIndex(
              (t) => t.id === task.id
            );
            const taskTop = calculateTop(parentIndex);

            const subTop =
              taskTop + 40 + SUBTASK_MARGIN + subIndex * (28 + SUBTASK_MARGIN);
            const prevSubTop =
              taskTop +
              40 +
              SUBTASK_MARGIN +
              (subIndex - 1) * (28 + SUBTASK_MARGIN);

            const { left: subLeft } = calculateTaskPosition(subtask, task);
            const { left: prevSubLeft, width: prevSubWidth } =
              calculateTaskPosition(prevSubtask, task);
            const prevSubEnd = prevSubLeft + prevSubWidth;

            const startX = prevSubEnd;
            const startY = prevSubTop + 28 / 2;
            const endX = subLeft;
            const endY = subTop + 28 / 2;
            const dx = endX - startX;
            const dy = endY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const curveFactor = Math.min(Math.max(distance * 0.1, 20), 50);

            let pathData;
            if (Math.abs(dy) > 20) {
              const midX = startX + dx * 0.5;
              pathData = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
            } else {
              pathData = `M ${startX} ${startY} C ${
                startX + curveFactor
              } ${startY}, ${endX - curveFactor} ${endY}, ${endX} ${endY}`;
            }

            return (
              <g key={`subtask-dependency-${subtask.id}`}>
                <path className={styles.subtaskDependencyLine} d={pathData} />
                <circle
                  cx={endX}
                  cy={endY}
                  r={3}
                  className={styles.subtaskDependencyPoint}
                />
              </g>
            );
          });
        })}
      </svg>
    ),
    [internalTasks, calculateTop, calculateTaskPosition, svgUpdateKey, openMap]
  );

  const renderSuggestions = useCallback(() => {
    if (!showSuggestions || !selectedTaskId) return null;
    const task = internalTasks.find((t) => t.id === selectedTaskId);
    if (!task) return null;
    const suggestions = generateSuggestionsForTask(selectedTaskId);

    return (
      <TaskAISuggestions
        taskName={task.name}
        suggestions={suggestions}
        onApply={applySuggestion}
        onClose={closeSuggestions}
        position={{ top: "50%", left: "50%" }}
      />
    );
  }, [
    showSuggestions,
    selectedTaskId,
    internalTasks,
    generateSuggestionsForTask,
    applySuggestion,
    closeSuggestions,
  ]);

  // *** RENDERIZADO DE TAREAS - VERSION MEJORADA CON SOPORTE DE ARRASTRE PARA SUBTAREAS ***
  const renderTasks = useCallback(() => {
    console.log("🎨 [RENDER TASKS] Renderizando tareas...");

    const tasksWithDates = getTasksWithInitializedDates(internalTasks);

    return tasksWithDates.flatMap((task, index) => {
      console.log(`📋 [RENDER] Procesando tarea ${index + 1}: ${task.name}`);

      const processedTask =
        task.subtasks && task.subtasks.length > 0
          ? calculateParentTaskDimensions(task)
          : task;

      const { left: taskLeft, width: taskWidth } =
        calculateTaskPosition(processedTask);
      const taskTop = calculateTop(index);
      const taskStart = processedTask.startDate
        ? new Date(processedTask.startDate)
        : visibleDateRange.start;
      const taskEnd = addDays(taskStart, processedTask.duration || 1);

      const isInvisible =
        isAfter(taskStart, addDays(visibleDateRange.end, 30)) ||
        isBefore(taskEnd, addDays(visibleDateRange.start, -30));

      if (isInvisible) {
        console.log(`⚠️ [RENDER] Tarea ${task.name} no visible, saltando...`);
        return [];
      }

      const alert = analyzeTaskForAlerts(processedTask);
      const isLate =
        processedTask.progress < 100 && isAfter(CURRENT_DATE, taskEnd);

      console.log(
        `🔍 [RENDER] Tarea ${task.name} - Posición: ${taskLeft}px, Ancho: ${taskWidth}px`
      );

      const bars = [
        <div
          key={processedTask.id}
          className={`${styles.taskBar} ${isLate ? styles.late : ""} ${
            styles.parentTask
          }`}
          style={{
            top: `${taskTop}px`,
            left: `${taskLeft}px`,
            width: `${taskWidth}px`,
            backgroundColor: processedTask.color || "#3b82f6",
          }}
          data-progress={processedTask.progress || 0}
          data-task-id={processedTask.id}
          onClick={() => handleOpenPanel(processedTask)}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, processedTask)}
          onDragEnd={handleDragEnd}
        >
          {processedTask.progress > 0 && (
            <div
              className={styles.taskProgressIndicator}
              style={{ width: `${processedTask.progress}%` }}
            >
              {processedTask.progress >= 25 && (
                <span className={styles.taskProgressText}>
                  {processedTask.progress}%
                </span>
              )}
            </div>
          )}

          {editingTaskId === processedTask.id ? (
            <input
              className={styles.inlineInput}
              value={taskNameEdit}
              autoFocus
              onBlur={() => {
                const updatedTasks = internalTasks.map((t) =>
                  t.id === processedTask.id ? { ...t, name: taskNameEdit } : t
                );
                updateTasks(updatedTasks);
                setEditingTaskId(null);
              }}
              onKeyDown={handleKeyDownInTaskEdit}
              onChange={(e) => setTaskNameEdit(e.target.value)}
            />
          ) : (
            <span
              className={styles.taskLabel}
              onDoubleClick={() => {
                setEditingTaskId(processedTask.id);
                setTaskNameEdit(processedTask.name);
              }}
            >
              {`${index + 1}. ${processedTask.name}`}
            </span>
          )}

          {processedTask.progress >= 100 && (
            <div className={styles.taskComplete}>✓</div>
          )}

          {alert && (
            <div className={styles.taskAlertContainer}>
              <TaskAIAlert
                message={alert}
                onClick={() => openSuggestionsForTask(processedTask.id)}
              />
            </div>
          )}
        </div>,
      ];

      // *** RENDERIZADO DE SUBTAREAS - IMPLEMENTACIÓN MEJORADA CON DRAG & DROP ***
      if (
        openMap[processedTask.id] &&
        processedTask.subtasks &&
        processedTask.subtasks.length > 0
      ) {
        console.log(
          `📝 [RENDER] Renderizando ${processedTask.subtasks.length} subtareas para ${task.name}`
        );

        processedTask.subtasks.forEach((subtask, subIndex) => {
          const { left: subLeft, width: subWidth } =
            calculateTaskPosition(subtask);
          const subTop =
            taskTop + 40 + SUBTASK_MARGIN + subIndex * (28 + SUBTASK_MARGIN);

          console.log(
            `  🔹 [RENDER] Subtarea ${subIndex + 1}: ${subtask.name}`
          );
          console.log(
            `     📍 Fecha: ${subtask.startDate}, Posición: ${subLeft}px, Ancho: ${subWidth}px`
          );

          const subAlert = analyzeTaskForAlerts(subtask);
          const subTaskStart = subtask.startDate
            ? new Date(subtask.startDate)
            : visibleDateRange.start;
          const subTaskEnd = addDays(subTaskStart, subtask.duration || 1);
          const isSubtaskLate =
            subtask.progress < 100 && isAfter(CURRENT_DATE, subTaskEnd);

          bars.push(
            <div
              key={subtask.id}
              className={`${styles.subtaskBar} ${
                isSubtaskLate ? styles.late : ""
              }`}
              data-sequence-index={subIndex + 1}
              data-progress={subtask.progress || 0}
              style={{
                top: `${subTop}px`,
                left: `${subLeft}px`,
                width: `${subWidth}px`,
              }}
              draggable={true}
              onDragStart={(e) =>
                handleDragStart(e, subtask, true, processedTask.id)
              }
              onDragEnd={handleDragEnd}
              onClick={() =>
                handleOpenPanel({ ...subtask, parent: processedTask.name })
              }
            >
              <div
                className={`${styles.resizeHandle} ${styles.resizeHandleLeft}`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleResizeStart(e, subtask, "start", true);
                }}
              >
                <span className={styles.resizeHandleIcon}>⟵</span>
              </div>

              <div
                className={`${styles.resizeHandle} ${styles.resizeHandleRight}`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleResizeStart(e, subtask, "end", true);
                }}
              >
                <span className={styles.resizeHandleIcon}>⟶</span>
              </div>

              <div className={styles.subtaskContent}>
                <span className={`${styles.taskLabel} ${styles.subtaskLabel}`}>
                  {`${index + 1}.${subIndex + 1} ${subtask.name}`}
                </span>

                {subtask.progress > 0 && (
                  <div
                    className={styles.taskProgressIndicator}
                    style={{ width: `${subtask.progress}%` }}
                  >
                    {subtask.progress >= 50 && (
                      <span className={styles.taskProgressText}>
                        {subtask.progress}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {subAlert && (
                <div className={styles.subtaskAlertContainer}>
                  <TaskAIAlert
                    message={subAlert}
                    onClick={() => openSuggestionsForTask(subtask.id)}
                  />
                </div>
              )}
            </div>
          );
        });

        console.log(
          `✅ [RENDER] Subtareas de ${task.name} renderizadas correctamente`
        );
      }

      return bars;
    });
  }, [
    internalTasks,
    getTasksWithInitializedDates,
    calculateParentTaskDimensions,
    calculateTaskPosition,
    calculateTop,
    visibleDateRange,
    editingTaskId,
    taskNameEdit,
    analyzeTaskForAlerts,
    openSuggestionsForTask,
    handleOpenPanel,
    updateTasks,
    handleDragStart,
    handleDragEnd,
    openMap,
    handleResizeStart,
    handleKeyDownInTaskEdit,
  ]);

  // ========== EFECTOS Y LIMPIEZA ==========
  useEffect(() => {
    console.log("🔄 [EFFECT] Tareas props actualizadas, sincronizando...");
    setInternalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    const listener = (e: CustomEvent<Task[]>) => {
      if (Array.isArray(e.detail)) {
        console.log("📢 [EFFECT] Evento update-tasks recibido");
        setInternalTasks(e.detail);
        setSelectedTask(null);
        setEditedTask(null);
      }
    };
    window.addEventListener("update-tasks", listener as EventListener);
    return () =>
      window.removeEventListener("update-tasks", listener as EventListener);
  }, []);

  useEffect(() => {
    if (selectedTask) {
      const updatedSelectedTask = internalTasks.find(
        (t) => t.id === selectedTask.id
      );
      if (
        updatedSelectedTask &&
        JSON.stringify(updatedSelectedTask) !== JSON.stringify(editedTask)
      ) {
        setEditedTask(updatedSelectedTask);
      }
    }
  }, [internalTasks, selectedTask, editedTask]);

  useEffect(() => {
    const adjustTimelineLine = () => {
      if (!gridRef.current) return;
      const daysDiff = differenceInDays(CURRENT_DATE, visibleDateRange.start);
      const positionLeft = daysDiff * config.unitWidth;
      const timelineLine = gridRef.current.querySelector(
        `.${styles.currentTimeLine}`
      ) as HTMLElement;
      if (timelineLine) {
        timelineLine.style.left = `${positionLeft}px`;
      }
    };

    adjustTimelineLine();
    const resizeObserver = new ResizeObserver(adjustTimelineLine);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [timeScale, config.unitWidth, visibleDateRange.start]);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = `
/* Ocultar círculos de números no deseados */
.number-circle, 
[class*="-number-circle"], 
[class*="circle-number"],
.task-circle-number,
.sub-task-circle-number,
.circle-numbers {
display: none !important;
opacity: 0 !important;
visibility: hidden !important;
}

/* Estilos para redimensionamiento */
body.resizing {
cursor: ew-resize !important;
user-select: none !important;
}

body.resizing * {
cursor: ew-resize !important;
}

/* Estilos para arrastre mejorado y controlado */
.gridContainer {
scroll-behavior: smooth;
}

.taskBar, .subtaskBar {
cursor: move;
transition: box-shadow 0.2s ease, transform 0.1s ease;
}

.taskBar:hover, .subtaskBar:hover {
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Indicador visual durante el arrastre más suave */
.taskBar:active, .subtaskBar:active {
opacity: 0.9;
transform: scale(1.01);
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Mejores estilos para handles de redimensionamiento */
.resizeHandle {
opacity: 0;
transition: opacity 0.2s ease;
z-index: 10;
}

.subtaskBar:hover .resizeHandle {
opacity: 1;
}

.resizeHandle:hover {
opacity: 1 !important;
background-color: rgba(59, 130, 246, 0.1);
}

/* Anti-aliasing para movimiento más suave */
.taskBar, .subtaskBar {
will-change: transform;
transform: translateZ(0);
}

/* Debugging durante desarrollo */
.taskBar[data-task-id] {
border: 1px solid rgba(255, 255, 255, 0.1);
}

.subtaskBar {
border: 1px solid rgba(255, 255, 255, 0.1);
}
`;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  useEffect(() => {
    if (gridRef.current) {
      const timeoutId = setTimeout(() => {
        const svgContainer = gridRef.current?.querySelector(
          ".connectionsContainer"
        );
        if (svgContainer) {
          svgContainer.getBoundingClientRect();
          const svgElements =
            svgContainer.querySelectorAll("path, line, circle");
          svgElements.forEach((el) => el.classList.add(styles.svgAnimated));
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [svgUpdateKey]);

  useEffect(() => {
    return () => {
      if (handleMouseMoveRef.current) {
        document.removeEventListener("mousemove", handleMouseMoveRef.current);
      }
      if (handleMouseUpRef.current) {
        document.removeEventListener("mouseup", handleMouseUpRef.current);
      }
    };
  }, []);

  // ========== RETURN ==========
  const minWidth = Math.max(config.unitWidth * config.daysVisible, 1000);

  return (
    <div className={styles.wrapper} data-time-scale={timeScale}>
      <div
        ref={gridContainerRef}
        className={styles.gridContainer}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={gridRef}
          className={styles.grid}
          style={
            {
              width: `${minWidth}px`,
              height: `${gridHeight}px`,
              // VARIABLES CSS DINÁMICAS PARA CONTROLAR LA GRILLA EXISTENTE:
              "--grid-opacity": gridConfig.showLines
                ? gridConfig.visualDensity / 100
                : 0,
              "--grid-horizontal-color": gridConfig.horizontalColor,
              "--grid-vertical-color": gridConfig.verticalColor,
              "--grid-line-style": gridConfig.lineStyle,
              "--show-current-time": gridConfig.showCurrentTime ? 1 : 0,
            } as React.CSSProperties
          }
          data-grid-type={gridConfig.gridType}
        >
          {renderTimeHeaders()}
          {isWithinInterval(CURRENT_DATE, visibleDateRange) && (
            <div
              className={styles.currentTimeLine}
              style={{
                left: `${
                  differenceInDays(CURRENT_DATE, visibleDateRange.start) *
                  config.unitWidth
                }px`,
                display: gridConfig.showCurrentTime ? "block" : "none",
              }}
            >
              <div className={styles.currentTimeDot}></div>
            </div>
          )}
          {renderConnectionLines()}
          {renderTasks()}
        </div>
      </div>

      {editedTask && (
        <TaskDetailPanel
          task={editedTask}
          selectedTask={selectedTask}
          isEditMode={isEditMode}
          confirmDelete={confirmDelete}
          showProgressIndicator={false}
          onUpdateTask={handleUpdateTask}
          onEdit={handleEditTask}
          onSave={handleSaveChanges}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteTask}
          onClose={handleClosePanel}
          onSaveAndClose={handleSaveAndClose}
          getPredecessorTask={getPredecessorTask}
          formatDate={formatDate}
          getTaskDates={getTaskDates}
          analyzeTaskForAlerts={analyzeTaskForAlerts}
          openSuggestionsForTask={openSuggestionsForTask}
        />
      )}

      {renderSuggestions()}
    </div>
  );
};

export default GanttChart;
