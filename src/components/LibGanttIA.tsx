import { useState, useRef, useEffect } from "react";
import { Task } from "../types/ganttTypes";
import GanttChart from "./GanttChart";
import TaskList from "./TaskList";
import AddTaskForm from "./AddTaskForm";
import ThemeToggle from "./ThemeToggle";
import GridConfigModal from "./GridConfigModal"; // NUEVO IMPORT
import { useTheme } from "../context/ThemeContext";
import styles from "../styles/LibGanttIA.module.css";

// Tipo para la escala de tiempo
export type TimeScale = "day" | "week" | "month";

// Tipo para opciones de exportación - ACTUALIZADO PARA INCLUIR PROJECT
export type ExportFormat = "pdf" | "excel" | "csv" | "png" | "project";

// NUEVOS TIPOS PARA CONFIGURACIÓN DE GRILLA
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

// Interfaz para datos de exportación
interface ExportData {
  ID: string;
  Nombre: string;
  Nivel: string;
  Inicio: string;
  Fin: string;
  Progreso: string;
  Dependencias: string;
  Prioridad: string;
  Recursos: string;
}

interface LibGanttIAProps {
  onGenerateTasks?: (prompt: string) => Promise<Task[]>;
  initialTasks?: Task[];
  showIAAssistant?: boolean;
  title?: string;
}

const LibGanttIA: React.FC<LibGanttIAProps> = ({
  onGenerateTasks = async () => [],
  initialTasks = [],
  showIAAssistant = true,
  title = "LibGantt-IA",
}) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [openMap, setOpenMap] = useState<{ [key: string]: boolean }>({});
  const [prompt, setPrompt] = useState<string>("");
  const [showIAChat, setShowIAChat] = useState<boolean>(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState<boolean>(false);
  const [timeScale, setTimeScale] = useState<TimeScale>("week");
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  const [showExportMessage, setShowExportMessage] = useState<boolean>(false);
  const [exportMessageText, setExportMessageText] = useState<string>("");

  // ESTADO PARA CONTROLAR EL MODAL DE GRILLA (EXTERNO)
  const [showGridModal, setShowGridModal] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("es");
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    showLines: true,
    lineStyle: "solid",
    gridSize: "medium",
    gridType: "complete",
    visualDensity: 50,
    horizontalColor: "#60A5FA",
    verticalColor: "#8B5CF6",
    highlightWeekends: false,
    showCurrentTime: false,
  });

  // Referencia para el componente GanttChart con tipo específico
  const ganttChartRef = useRef<{ exportToImage?: () => void }>(null);
  const ganttContainerRef = useRef<HTMLDivElement>(null);

  // Usar el contexto de tema (si está disponible)
  const theme = useTheme?.() || { theme: "dark", toggleTheme: () => {} };

  const handleGenerate = async () => {
    if (prompt.trim()) {
      const generatedTasks = await onGenerateTasks(prompt);
      setTasks(generatedTasks);
      setOpenMap({});
      setPrompt("");
      setShowIAChat(false);
    }
  };

  const toggleTaskOpen = (taskId: string) => {
    setOpenMap((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // FUNCIÓN PARA MANEJAR CAMBIOS EN LA CONFIGURACIÓN DE GRILLA
  const handleGridConfigChange = (key: keyof GridConfig, value: any) => {
    setGridConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Funciones para controlar la escala de tiempo
  const decreaseScale = () => {
    if (timeScale === "month") setTimeScale("week");
    else if (timeScale === "week") setTimeScale("day");
  };

  const increaseScale = () => {
    if (timeScale === "day") setTimeScale("week");
    else if (timeScale === "week") setTimeScale("month");
  };

  const getScaleText = () => {
    switch (timeScale) {
      case "day":
        return language === "es" ? "Día" : "Day";
      case "week":
        return language === "es" ? "Semana" : "Week";
      case "month":
        return language === "es" ? "Mes" : "Month";
      default:
        return language === "es" ? "Semana" : "Week";
    }
  };

  // Función para añadir una nueva tarea
  const handleAddTask = (newTask: Task) => {
    const taskId = `task-${Date.now()}`;
    const taskWithId = { ...newTask, id: taskId };

    if (newTask.parent) {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.name === newTask.parent) {
            setOpenMap((prev) => ({
              ...prev,
              [task.id]: true,
            }));

            const currentSubtasks = task.subtasks || [];
            return {
              ...task,
              subtasks: [...currentSubtasks, taskWithId],
            };
          }
          return task;
        })
      );
    } else {
      setTasks([...tasks, taskWithId]);
    }

    setShowAddTaskForm(false);
  };

  // Función para eliminar una tarea
  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find((task) => task.id === taskId);

    if (taskToDelete) {
      if (taskToDelete.parent) {
        setTasks((prevTasks) => {
          return prevTasks.map((task) => {
            if (task.name === taskToDelete.parent && task.subtasks) {
              return {
                ...task,
                subtasks: task.subtasks.filter((sub) => sub.id !== taskId),
              };
            }
            return task;
          });
        });
      }

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    }
  };

  // Función para editar una tarea
  const handleEditTask = (taskId: string, updatedTask: Task) => {
    setTasks((prevTasks) => {
      return prevTasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, ...updatedTask };
        } else if (
          task.subtasks &&
          task.subtasks.some((sub) => sub.id === taskId)
        ) {
          return {
            ...task,
            subtasks: task.subtasks.map((sub) =>
              sub.id === taskId ? { ...sub, ...updatedTask } : sub
            ),
          };
        }
        return task;
      });
    });
  };

  // Función para manejar actualizaciones de tareas desde el componente GanttChart
  const handleTasksUpdate = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
  };

  // FUNCIONALIDAD DE EXPORTACIÓN

  // Función para mostrar mensaje de exportación
  const showExportNotification = (message: string) => {
    setExportMessageText(message);
    setShowExportMessage(true);
    setTimeout(() => {
      setShowExportMessage(false);
    }, 5000);
  };

  // Función para cerrar el mensaje de exportación
  const handleCloseExportMessage = () => {
    setShowExportMessage(false);
  };

  // Formatear fecha para mostrar correctamente
  const formatDate = (dateString: string | undefined) => {
    try {
      if (!dateString) return "Fecha no valida";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Fecha no valida";
      }
      return date
        .toLocaleDateString("es-ES", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\//g, "-");
    } catch {
      return "Fecha no valida";
    }
  };

  // FUNCIONES AUXILIARES PARA EXPORTACIÓN A MS PROJECT
  const convertPriorityToNumber = (priority: string | undefined): number => {
    switch (priority?.toLowerCase()) {
      case "baja":
      case "low":
        return 300;
      case "normal":
      case "medium":
        return 500;
      case "alta":
      case "high":
        return 700;
      case "crítica":
      case "critical":
        return 900;
      default:
        return 500;
    }
  };

  const calculateDuration = (
    startDate: string | undefined,
    endDate: string | undefined
  ): number => {
    if (!startDate || !endDate) return 1;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays || 1;
  };

  const formatDateForProject = (dateString: string | undefined): string => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";

      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${month}/${day}/${year}`;
    } catch (error) {
      return "";
    }
  };

  const ensureEndDate = (
    startDate: string | undefined,
    endDate: string | undefined,
    duration: number
  ): string => {
    if (endDate) return formatDateForProject(endDate);

    if (startDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + duration);
      const calculatedEndDate = start.toISOString().split("T")[0];
      return formatDateForProject(calculatedEndDate);
    }

    return "";
  };

  const calculateWorkHours = (
    startDate: string | undefined,
    endDate: string | undefined,
    resourceCount: number
  ): string => {
    if (!startDate || !endDate) return "8h";

    const duration = calculateDuration(startDate, endDate);
    const totalHours = duration * 8 * (resourceCount || 1);
    return `${totalHours}h`;
  };

  const exportToProjectCSV = () => {
    try {
      const fileName = `LibGantt-IA_Project_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      const headers = [
        "ID",
        "Name",
        "Duration",
        "Start",
        "Finish",
        "Predecessors",
        "Resource Names",
        "Outline Level",
        "Priority",
        "% Complete",
        "Notes",
        "Work",
        "Type",
        "WBS",
      ];

      let csvContent = "";
      csvContent += "\ufeff";
      csvContent += headers.join(",") + "\r\n";

      let currentId = 1;
      const taskIdMap = new Map<string, number>();

      const processTask = (
        task: Task,
        outlineLevel: number = 1,
        parentWBS: string = "",
        subtaskIndex?: number
      ): void => {
        const taskId = currentId++;
        taskIdMap.set(task.name, taskId);

        let wbs: string;
        if (outlineLevel > 1 && parentWBS && subtaskIndex !== undefined) {
          wbs = `${parentWBS}.${subtaskIndex}`;
        } else {
          wbs = `${taskId}`;
        }

        let predecessorIds = "";
        if (task.dependencies && task.dependencies.length > 0) {
          predecessorIds = task.dependencies
            .map((depName) => taskIdMap.get(depName))
            .filter((id) => id !== undefined)
            .join(";");
        }

        const duration = calculateDuration(task.startDate, task.endDate);
        const resourceCount = task.resources?.length || 1;

        const taskData = [
          taskId.toString(),
          `"${task.name || `Tarea ${taskId}`}"`,
          `${duration}d`,
          formatDateForProject(task.startDate),
          ensureEndDate(task.startDate, task.endDate, duration),
          predecessorIds ? `"${predecessorIds}"` : "",
          task.resources ? `"${task.resources.join(";")}"` : "",
          outlineLevel.toString(),
          convertPriorityToNumber(task.priority).toString(),
          Math.round(task.progress || 0).toString(),
          task.description ? `"${task.description.replace(/"/g, '""')}"` : "",
          calculateWorkHours(task.startDate, task.endDate, resourceCount),
          "Fixed Duration",
          `"${wbs}"`,
        ];

        csvContent += taskData.join(",") + "\r\n";

        if (task.subtasks && task.subtasks.length > 0) {
          task.subtasks.forEach((subtask, index) => {
            processTask(subtask, outlineLevel + 1, wbs, index + 1);
          });
        }
      };

      tasks.forEach((task) => processTask(task, 1, ""));

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(link.href), 100);

      showExportNotification(
        `Exportación a CSV para Microsoft Project completada. 
        
        Para importar en Project:
        1. Abrir Microsoft Project
        2. Archivo > Abrir
        3. Seleccionar el archivo CSV
        4. Seguir el asistente de importación`
      );

      return fileName;
    } catch (error) {
      console.error("Error al exportar CSV para Project:", error);
      showExportNotification(
        `Error al exportar CSV para Microsoft Project: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      return null;
    }
  };

  const prepareDataForExport = (taskList: Task[]): ExportData[] => {
    const flattenedTasks: ExportData[] = [];

    const flattenTask = (task: Task, level = 0) => {
      const {
        id,
        name,
        startDate,
        endDate,
        progress,
        dependencies,
        priority,
        resources,
      } = task;

      const formattedTask: ExportData = {
        ID: id || "",
        Nombre: name || "",
        Nivel: level.toString(),
        Inicio: formatDate(startDate),
        Fin: formatDate(endDate),
        Progreso: `${Math.round(progress || 0)}%`,
        Dependencias: dependencies?.join(", ") || "",
        Prioridad: priority || "Normal",
        Recursos: resources?.join(", ") || "",
      };

      flattenedTasks.push(formattedTask);

      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask) => flattenTask(subtask, level + 1));
      }
    };

    taskList.forEach((task) => flattenTask(task));
    return flattenedTasks;
  };

  const removeAccents = (text: string) => {
    return text
      .replace(/[áàäâã]/g, "a")
      .replace(/[éèëê]/g, "e")
      .replace(/[íìïî]/g, "i")
      .replace(/[óòöôõ]/g, "o")
      .replace(/[úùüû]/g, "u")
      .replace(/[ñ]/g, "n")
      .replace(/[ç]/g, "c");
  };

  const exportToPDF = (data: ExportData[]) => {
    const fileName = `LibGantt-IA_${
      new Date().toISOString().split("T")[0]
    }.pdf`;

    try {
      const title = removeAccents("LibGantt-IA: Exportacion de Tareas");
      const dateStr = removeAccents(
        `Fecha de exportacion: ${new Date().toLocaleString("es-ES")}`
      );

      let pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 1000 >>
stream
BT
/F1 16 Tf
50 750 Td
(${title}) Tj
/F1 12 Tf
0 -30 Td
(${dateStr}) Tj
`;

      let yPosition = 700;
      data.forEach((task, index) => {
        const taskName = removeAccents(task.Nombre);
        const taskProgress = task.Progreso;
        const taskStart = task.Inicio;
        const taskEnd = task.Fin;

        yPosition -= 20;
        if (yPosition < 50) {
          yPosition = 700;
        }

        pdfContent += `0 -20 Td
(${
          index + 1
        }. ${taskName}: ${taskStart} - ${taskEnd}, Progreso: ${taskProgress}) Tj
`;
      });

      pdfContent += `ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000010 00000 n
0000000060 00000 n
0000000111 00000 n
0000000220 00000 n
0000001220 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1300
%%EOF`;

      const blob = new Blob([pdfContent], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 100);

      showExportNotification(
        `Exportación a PDF iniciada. El archivo se descargará como: ${fileName}`
      );

      return fileName;
    } catch (error) {
      console.error("Error al exportar a PDF:", error);
      showExportNotification(
        `Error al exportar a PDF: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      return null;
    }
  };

  const exportToExcel = (data: ExportData[]) => {
    try {
      const fileName = `LibGantt-IA_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      let csvContent = "";
      const headers = Object.keys(data[0] || {});
      csvContent += headers.join(",") + "\r\n";

      data.forEach((row) => {
        const rowData = headers.map((header) => {
          let value = row[header as keyof ExportData] || "";
          value = removeAccents(value.toString());
          if (value.includes('"')) {
            value = value.replace(/"/g, '""');
          }
          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n")
          ) {
            value = `"${value}"`;
          }
          return value;
        });
        csvContent += rowData.join(",") + "\r\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 100);

      showExportNotification(
        `Exportación a CSV iniciada. El archivo se descargará como: ${fileName}`
      );

      return fileName;
    } catch (error) {
      console.error("Error al exportar a Excel/CSV:", error);
      showExportNotification(
        `Error al exportar a CSV: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      return null;
    }
  };

  const exportToCSV = (data: ExportData[]) => {
    try {
      const fileName = `LibGantt-IA_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      const processedData = data.map((item) => {
        const newItem: Record<string, string> = {};
        for (const key in item) {
          newItem[key] = removeAccents(
            String(item[key as keyof ExportData] || "")
          );
        }
        return newItem;
      });

      const headers = Object.keys(processedData[0] || {});
      let csvContent = headers.join(",") + "\r\n";

      processedData.forEach((row) => {
        const rowValues = headers.map((header) => {
          const value = row[header] || "";
          return value.includes(",") || value.includes('"')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        });
        csvContent += rowValues.join(",") + "\r\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 100);

      showExportNotification(
        `Exportación a CSV iniciada. El archivo se descargará como: ${fileName}`
      );

      return fileName;
    } catch (error) {
      console.error("Error al exportar a CSV:", error);
      showExportNotification(
        `Error al exportar a CSV: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      return null;
    }
  };

  useEffect(() => {
    if (ganttContainerRef.current && ganttChartRef.current) {
      console.log("Referencias de Gantt establecidas correctamente");
    }
  }, []);

  const exportToPNG = () => {
    try {
      const fileName = `LibGantt-IA_${
        new Date().toISOString().split("T")[0]
      }.png`;

      const container =
        ganttContainerRef.current ||
        (document.querySelector(".gantt") as HTMLElement);

      if (!container) {
        showExportNotification(
          "Error: No se pudo encontrar el contenedor del gráfico Gantt."
        );
        return null;
      }

      const canvas = document.createElement("canvas");
      const width = container.offsetWidth || 800;
      const height = container.offsetHeight || 600;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        showExportNotification(
          "Error: No se pudo crear el contexto del canvas."
        );
        return null;
      }

      ctx.fillStyle = theme.theme === "dark" ? "#1e1e2e" : "#ffffff";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = theme.theme === "dark" ? "#2a2a3c" : "#f0f0f0";
      ctx.fillRect(0, 0, width, 40);

      ctx.fillStyle = theme.theme === "dark" ? "#ffffff" : "#333333";
      ctx.font = "bold 16px Arial";
      ctx.fillText("LibGantt-IA: Vista de Tareas", 20, 25);

      ctx.strokeStyle = theme.theme === "dark" ? "#444444" : "#dddddd";
      ctx.lineWidth = 1;

      for (let y = 80; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      for (let x = 180; x < width; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      ctx.fillStyle = theme.theme === "dark" ? "#333333" : "#e0e0e0";
      ctx.fillRect(180, 40, width - 180, 40);

      ctx.fillStyle = theme.theme === "dark" ? "#ffffff" : "#333333";
      ctx.font = "12px Arial";
      const months = ["MAYO 2025", "JUNIO 2025", "JULIO 2025"];
      months.forEach((month, i) => {
        ctx.fillText(month, 180 + i * 300, 65);
      });

      ctx.beginPath();
      ctx.moveTo(0, 80);
      ctx.lineTo(width, 80);
      ctx.lineWidth = 2;
      ctx.stroke();

      let y = 100;
      const barColors = [
        "#4285F4",
        "#FBBC05",
        "#34A853",
        "#EA4335",
        "#9C27B0",
        "#FF7043",
        "#00ACC1",
        "#AB47BC",
      ];

      tasks.forEach((task, i) => {
        const color = barColors[i % barColors.length];
        const progress = task.progress || 0;

        ctx.fillStyle = theme.theme === "dark" ? "#ffffff" : "#333333";
        ctx.font = "bold 14px Arial";
        ctx.fillText(task.name || `Tarea ${i + 1}`, 10, y + 15);

        const barWidth = 250 + i * 30;

        ctx.fillStyle = theme.theme === "dark" ? "#444444" : "#e9e9e9";
        ctx.fillRect(180, y, barWidth, 30);

        ctx.fillStyle = color;
        ctx.fillRect(180, y, barWidth * (progress / 100), 30);

        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Arial";
        if (progress > 0) {
          ctx.fillText(`${progress}%`, 190, y + 20);
        }

        y += 40;
      });

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            showExportNotification("Error: No se pudo generar la imagen PNG.");
            return;
          }

          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(link.href), 100);

          showExportNotification(
            `Exportación a PNG iniciada. El archivo se descargará como: ${fileName}`
          );
        },
        "image/png",
        1.0
      );

      return fileName;
    } catch (error) {
      console.error("Error al exportar a PNG:", error);
      showExportNotification(
        `Error al exportar a PNG: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      return null;
    }
  };

  const handleExport = (format: ExportFormat) => {
    try {
      switch (format) {
        case "pdf":
          const pdfData = prepareDataForExport(tasks);
          if (!pdfData || pdfData.length === 0) {
            showExportNotification("No hay datos disponibles para exportar.");
            return;
          }
          exportToPDF(pdfData);
          break;
        case "excel":
          const excelData = prepareDataForExport(tasks);
          if (!excelData || excelData.length === 0) {
            showExportNotification("No hay datos disponibles para exportar.");
            return;
          }
          exportToExcel(excelData);
          break;
        case "csv":
          const csvData = prepareDataForExport(tasks);
          if (!csvData || csvData.length === 0) {
            showExportNotification("No hay datos disponibles para exportar.");
            return;
          }
          exportToCSV(csvData);
          break;
        case "png":
          exportToPNG();
          break;
        case "project":
          if (!tasks || tasks.length === 0) {
            showExportNotification("No hay tareas disponibles para exportar.");
            return;
          }
          exportToProjectCSV();
          break;
        default:
          console.error("Formato de exportación no soportado");
          showExportNotification("Formato de exportación no soportado");
      }
      setShowExportOptions(false);
    } catch (error) {
      console.error("Error en la exportación:", error);
      showExportNotification(
        `Error durante la exportación: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      setShowExportOptions(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Barra superior con logo y avatar */}
      <div className={styles.topbarMain}>
        <div className={styles.logoSection}>
          <div className={styles.logoCircle}>IA</div>
          <span className={styles.logoText}>{title}</span>
        </div>

        {/* Buscador y avatar */}
        <div className={styles.rightSection}>
          <input
            type="text"
            placeholder={
              language === "es"
                ? "Buscar en el proyecto..."
                : "Search in project..."
            }
            className={styles.searchBar}
          />

          {/* Botón de cambio de tema integrado */}
          <div className={styles.themeToggleWrapper}>
            <ThemeToggle />
          </div>
          <div className={styles.userAvatar}>JP</div>
        </div>
      </div>

      {/* Barra de control del diagrama Gantt */}
      <div className={styles.topbarSub}>
        {/* Vista Gantt como único botón activo */}
        <div className={styles.viewTabs}>
          <button className={styles.viewTabActive}>
            {language === "es" ? "Vista Gantt" : "Gantt View"}
          </button>
        </div>

        {/* Control de escala de tiempo centrado */}
        <div className={styles.scaleGroup}>
          <div className={styles.scaleControl}>
            <button
              onClick={decreaseScale}
              title={language === "es" ? "Aumentar detalle" : "Increase detail"}
            >
              -
            </button>
            <span>{getScaleText()}</span>
            <button
              onClick={increaseScale}
              title={language === "es" ? "Reducir detalle" : "Decrease detail"}
            >
              +
            </button>
          </div>
        </div>

        {/* Botones de Grilla, IA y Exportar */}
        <div className={styles.actionGroup}>
          {/* BOTÓN DE CONFIGURACIÓN DE GRILLA - SOLO EL BOTÓN */}
          <button
            className={styles.gridConfigButton}
            onClick={() => setShowGridModal(true)}
            title={
              language === "es" ? "Configuración de Grilla" : "Grid Settings"
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H14V2H10V4ZM4 6H2V10H4V6ZM20 10V6H16V10H20ZM14 20V16H10V20H14ZM20 14V18H16V14H20ZM6 10V6H2V10H6ZM12 18V14H8V18H12ZM18 12H22V8H18V12ZM12 12V8H8V12H12ZM6 18V14H2V18H6ZM18 6V2H14V6H18ZM6 4V2H2V4H6ZM14 14H18V10H14V14ZM22 18V14H18V18H22ZM22 6V2H18V6H22Z" />
            </svg>
            {language === "es" ? "Grilla" : "Grid"}
          </button>

          {showIAAssistant && (
            <button
              className={styles.aiBadge}
              onClick={() => setShowIAChat(!showIAChat)}
            >
              <div className={styles.aiIcon}>IA</div>
              {language === "es" ? "Asistente IA" : "AI Assistant"}
            </button>
          )}
          {/* Contenedor para el menú desplegable de exportación */}
          <div className={styles.exportContainer}>
            <button
              className={styles.exportButton}
              onClick={() => setShowExportOptions(!showExportOptions)}
            >
              {language === "es" ? "Exportar" : "Export"}
            </button>

            {/* Menú desplegable de opciones de exportación */}
            {showExportOptions && (
              <div className={styles.exportOptions}>
                <button onClick={() => handleExport("pdf")}>PDF</button>
                <button onClick={() => handleExport("excel")}>Excel</button>
                <button onClick={() => handleExport("csv")}>CSV</button>
                <button onClick={() => handleExport("png")}>
                  {language === "es" ? "Imagen PNG" : "PNG Image"}
                </button>
                <button onClick={() => handleExport("project")}>
                  MS Project (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <h3 className={styles.sectionTitle}>
            {language === "es"
              ? "Estructura de Proyecto (WBS)"
              : "Work Breakdown Structure (WBS)"}
          </h3>
          <TaskList tasks={tasks} openMap={openMap} onToggle={toggleTaskOpen} />
        </div>
        <div className={styles.gantt} ref={ganttContainerRef}>
          <GanttChart
            ref={ganttChartRef}
            tasks={tasks}
            openMap={openMap}
            timeScale={timeScale}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onTasksUpdate={handleTasksUpdate}
            gridConfig={gridConfig}
          />
        </div>
      </div>

      {/* Botón flotante para agregar tarea */}
      <button
        className={styles.addTaskFloating}
        onClick={() => setShowAddTaskForm(true)}
        title={language === "es" ? "Agregar nueva tarea" : "Add new task"}
      >
        +
      </button>

      {/* MODAL DE CONFIGURACIÓN DE GRILLA - COMPONENTE EXTERNO */}
      <GridConfigModal
        isOpen={showGridModal}
        onClose={() => setShowGridModal(false)}
        gridConfig={gridConfig}
        onGridConfigChange={handleGridConfigChange}
        language={language}
      />

      {/* Panel de IA */}
      {showIAChat && showIAAssistant && (
        <div className={styles.iaChatPanel}>
          <div className={styles.iaChatHeader}>
            <div className={styles.iaChatTitle}>
              <div className={styles.aiIcon}>IA</div>
              <span>{language === "es" ? "Asistente IA" : "AI Assistant"}</span>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => setShowIAChat(false)}
            >
              ×
            </button>
          </div>
          <div className={styles.iaChatBody}>
            <textarea
              className={styles.iaChatPrompt}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                language === "es"
                  ? "Describe las tareas del proyecto..."
                  : "Describe the project tasks..."
              }
            />
            <button className={styles.iaChatSubmit} onClick={handleGenerate}>
              {language === "es" ? "Generar tareas" : "Generate tasks"}
            </button>
          </div>
        </div>
      )}

      {/* Modal para añadir tarea */}
      {showAddTaskForm && (
        <div className={styles.modalOverlay}>
          <AddTaskForm
            onAdd={handleAddTask}
            onCancel={() => setShowAddTaskForm(false)}
            parentTasks={tasks.filter((task) => !task.parent)}
          />
        </div>
      )}

      {/* Modal de notificación de exportación */}
      {showExportMessage && (
        <div className={styles.modalOverlay} onClick={handleCloseExportMessage}>
          <div
            className={styles.exportMessageModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.exportMessageContent}>
              <p>{exportMessageText}</p>
              <button
                className={styles.exportMessageButton}
                onClick={handleCloseExportMessage}
              >
                {language === "es" ? "Aceptar" : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibGanttIA;
