// src/App.tsx
import React from "react";
import LibGanttIA from "./components/LibGanttIA";
import { Task } from "./types/ganttTypes";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/variables.css";

function App() {
  // Simulación de una API para obtener tareas
  const fakeAPI = async (): Promise<Task[]> => {
    // Usar la fecha actual como base
    const today = new Date();

    // Función auxiliar para añadir días a una fecha y formatearla como YYYY-MM-DD
    const addDays = (date: Date, days: number): string => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    };

    // Fecha de inicio: hoy
    const startDate = today.toISOString().split("T")[0];

    return [
      {
        id: "1",
        name: "Planeación Estratégica",
        startDate: startDate, // Empieza hoy
        endDate: addDays(today, 5), // AÑADIDO: endDate calculado
        duration: 5,
        progress: 100,
        color: "#3b82f6",
        priority: "alta", // AÑADIDO
        resources: ["Equipo Estrategia"], // AÑADIDO
        subtasks: [
          {
            id: "1.1",
            name: "Estudio de mercado",
            startDate: startDate, // AÑADIDO
            endDate: addDays(today, 2), // AÑADIDO
            duration: 2,
            progress: 100, // AÑADIDO
            priority: "normal", // AÑADIDO
            resources: ["Analista de Mercado"], // AÑADIDO
          },
          {
            id: "1.2",
            name: "Análisis de competencia",
            startDate: addDays(today, 2), // AÑADIDO: empieza después del estudio
            endDate: addDays(today, 4), // AÑADIDO
            duration: 2,
            progress: 100, // AÑADIDO
            priority: "normal", // AÑADIDO
            resources: ["Analista Competencia"], // AÑADIDO
          },
          {
            id: "1.3",
            name: "Definición de objetivos",
            startDate: addDays(today, 4), // AÑADIDO: empieza después del análisis
            endDate: addDays(today, 5), // AÑADIDO
            duration: 1,
            progress: 100, // AÑADIDO
            priority: "alta", // AÑADIDO
            resources: ["Director Proyecto"], // AÑADIDO
          },
        ],
      },
      {
        id: "2",
        name: "Desarrollo Técnico",
        startDate: addDays(today, 5), // 5 días después de hoy
        endDate: addDays(today, 19), // AÑADIDO: endDate calculado
        duration: 14,
        progress: 30,
        color: "#f59e0b",
        priority: "crítica", // AÑADIDO
        resources: ["Equipo Dev", "Tech Lead"], // AÑADIDO
      },
      {
        id: "3",
        name: "Pruebas y QA",
        startDate: addDays(today, 19), // Después del desarrollo técnico
        endDate: addDays(today, 31), // AÑADIDO: endDate calculado
        duration: 12,
        progress: 25,
        color: "#8b5cf6",
        priority: "alta", // AÑADIDO
        resources: ["Equipo QA"], // AÑADIDO
      },
      {
        id: "4",
        name: "Publicación y Marketing",
        startDate: addDays(today, 31), // Después de las pruebas
        endDate: addDays(today, 49), // AÑADIDO: endDate calculado
        duration: 18,
        progress: 5,
        color: "#10b981",
        priority: "normal", // AÑADIDO
        resources: ["Equipo Marketing"], // AÑADIDO
      },
      {
        id: "5",
        name: "Capacitación de Equipo",
        startDate: addDays(today, 40),
        endDate: addDays(today, 45), // AÑADIDO: endDate calculado
        duration: 5,
        progress: 0,
        color: "#ec4899",
        priority: "normal", // AÑADIDO
        resources: ["Trainer", "RRHH"], // AÑADIDO
      },
      {
        id: "6",
        name: "Lanzamiento Fase Beta",
        startDate: addDays(today, 45),
        endDate: addDays(today, 57), // AÑADIDO: endDate calculado
        duration: 12,
        progress: 10,
        color: "#14b8a6",
        priority: "crítica", // AÑADIDO
        resources: ["Equipo Completo"], // AÑADIDO
      },
    ];
  };

  return (
    <ThemeProvider>
      <LibGanttIA onGenerateTasks={fakeAPI} />
    </ThemeProvider>
  );
}

export default App;
