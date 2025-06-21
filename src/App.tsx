// App.tsx (DEMO COMERCIAL - INICIA VACÍO)
import React from "react";
import LibGanttIA from "./components/LibGanttIA";
import { ThemeProvider } from "./context/ThemeContext";
import {
  mockUsers,
  mockResourceAssignments,
  fakeGenerateTasksAPI,
} from "./mockData/resources";
import "./styles/variables.css";

function App() {
  return (
    <ThemeProvider>
      <LibGanttIA
        onGenerateTasks={fakeGenerateTasksAPI}
        users={mockUsers}
        resourceAssignments={mockResourceAssignments}
        initialTasks={[]}
        showIAAssistant={true}
        title="LibGantt-IA Demo"
      />
    </ThemeProvider>
  );
}

export default App;
