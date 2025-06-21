// mockData/resources.ts - Datos de ejemplo para desarrollo

import {
  User,
  UserRole,
  SkillLevel,
  UserWorkload,
  ResourceAssignment,
  Task,
} from "../types/ganttTypes";

// ========== USUARIOS DE EJEMPLO ==========

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Juan Pablo",
    initials: "JP",
    email: "juan.pablo@empresa.com",
    color: "#3B82F6", // Azul
    role: UserRole.DEVELOPER,
    department: "Engineering",
    skillLevel: SkillLevel.SENIOR,
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    hourlyRate: 50,
    isActive: true,
    workingHours: {
      start: "09:00",
      end: "17:00",
      timezone: "America/Bogota",
      workingDays: [1, 2, 3, 4, 5], // Lunes a viernes
    },
    maxHoursPerWeek: 40,
    unavailableDates: ["2025-06-15", "2025-06-16"], // Ejemplo: vacaciones
  },
  {
    id: "user-2",
    name: "María Silva",
    initials: "MS",
    email: "maria.silva@empresa.com",
    color: "#10B981", // Verde
    role: UserRole.DESIGNER,
    department: "Design",
    skillLevel: SkillLevel.SENIOR,
    skills: ["UI/UX", "Figma", "Adobe Creative Suite", "Prototyping"],
    hourlyRate: 45,
    isActive: true,
    workingHours: {
      start: "08:30",
      end: "16:30",
      timezone: "America/Bogota",
      workingDays: [1, 2, 3, 4, 5],
    },
    maxHoursPerWeek: 40,
  },
  {
    id: "user-3",
    name: "Ana López",
    initials: "AL",
    email: "ana.lopez@empresa.com",
    color: "#F59E0B", // Amarillo/Naranja
    role: UserRole.PROJECT_MANAGER,
    department: "Management",
    skillLevel: SkillLevel.LEAD,
    skills: ["Project Management", "Scrum", "Agile", "Risk Management"],
    hourlyRate: 60,
    isActive: true,
    workingHours: {
      start: "08:00",
      end: "18:00",
      timezone: "America/Bogota",
      workingDays: [1, 2, 3, 4, 5],
    },
    maxHoursPerWeek: 45,
  },
  {
    id: "user-4",
    name: "Roberto García",
    initials: "RG",
    email: "roberto.garcia@empresa.com",
    color: "#8B5CF6", // Púrpura
    role: UserRole.DEVELOPER,
    department: "Engineering",
    skillLevel: SkillLevel.MID,
    skills: ["Python", "Django", "AWS", "Docker"],
    hourlyRate: 40,
    isActive: true,
    workingHours: {
      start: "10:00",
      end: "18:00",
      timezone: "America/Bogota",
      workingDays: [1, 2, 3, 4, 5],
    },
    maxHoursPerWeek: 40,
  },
  {
    id: "user-5",
    name: "Tech Lead",
    initials: "TC",
    email: "tech.lead@empresa.com",
    color: "#EF4444", // Rojo
    role: UserRole.DEVELOPER,
    department: "Engineering",
    skillLevel: SkillLevel.LEAD,
    skills: [
      "Architecture",
      "React",
      "Node.js",
      "Microservices",
      "Team Leadership",
    ],
    hourlyRate: 70,
    isActive: true,
    workingHours: {
      start: "09:00",
      end: "17:00",
      timezone: "America/Bogota",
      workingDays: [1, 2, 3, 4, 5],
    },
    maxHoursPerWeek: 40,
  },
  {
    id: "user-6",
    name: "QA Specialist",
    initials: "QA",
    email: "qa.specialist@empresa.com",
    color: "#06B6D4", // Cyan
    role: UserRole.QA_ENGINEER,
    department: "Quality",
    skillLevel: SkillLevel.SENIOR,
    skills: ["Manual Testing", "Automation", "Selenium", "Test Planning"],
    hourlyRate: 45,
    isActive: true,
    workingHours: {
      start: "09:00",
      end: "17:00",
      timezone: "America/Bogota",
      workingDays: [1, 2, 3, 4, 5],
    },
    maxHoursPerWeek: 40,
  },
  {
    id: "user-7",
    name: "Marketing Lead",
    initials: "MK",
    email: "marketing.lead@empresa.com",
    color: "#EC4899", // Rosa
    role: "Marketing Manager",
    department: "Marketing",
    skillLevel: SkillLevel.SENIOR,
    skills: ["Digital Marketing", "Content Strategy", "SEO", "Analytics"],
    hourlyRate: 50,
    isActive: true,
    workingHours: {
      start: "08:00",
      end: "16:00",
      timezone: "America/Bogota",
      workingDays: [1, 2, 3, 4, 5],
    },
    maxHoursPerWeek: 40,
  },
];

// ========== ASIGNACIONES DE EJEMPLO ==========

export const mockResourceAssignments: ResourceAssignment[] = [
  {
    id: "assignment-1",
    taskId: "task-1", // Planeación Estratégica
    userId: "user-3", // Ana López (PM)
    role: "Owner",
    allocatedHours: 32,
    estimatedHours: 32,
    assignedDate: "2025-05-01",
    startDate: "2025-05-07",
    endDate: "2025-05-15",
    status: "Completed",
  },
  {
    id: "assignment-2",
    taskId: "task-2", // Desarrollo Técnico
    userId: "user-5", // Tech Lead
    role: "Owner",
    allocatedHours: 60,
    estimatedHours: 80,
    assignedDate: "2025-05-10",
    startDate: "2025-05-15",
    status: "Active",
  },
  {
    id: "assignment-3",
    taskId: "task-2", // Desarrollo Técnico
    userId: "user-1", // Juan Pablo
    role: "Contributor",
    allocatedHours: 40,
    estimatedHours: 50,
    assignedDate: "2025-05-10",
    startDate: "2025-05-20",
    status: "Assigned",
  },
  {
    id: "assignment-4",
    taskId: "task-3", // Pruebas y QA
    userId: "user-6", // QA Specialist
    role: "Owner",
    allocatedHours: 35,
    estimatedHours: 40,
    assignedDate: "2025-05-20",
    startDate: "2025-05-30",
    status: "Assigned",
  },
  {
    id: "assignment-5",
    taskId: "task-4", // Publicación y Marketing
    userId: "user-7", // Marketing Lead
    role: "Owner",
    allocatedHours: 20,
    estimatedHours: 25,
    assignedDate: "2025-06-01",
    startDate: "2025-06-06",
    status: "Assigned",
  },
  {
    id: "assignment-6",
    taskId: "task-4", // Publicación y Marketing
    userId: "user-3", // Ana López (coordinación)
    role: "Contributor",
    allocatedHours: 10,
    estimatedHours: 15,
    assignedDate: "2025-06-01",
    startDate: "2025-06-06",
    status: "Assigned",
  },
];

// ========== CARGAS DE TRABAJO DE EJEMPLO ==========

export const mockUserWorkloads: UserWorkload[] = [
  {
    userId: "user-1",
    user: mockUsers[0],
    totalAllocatedHours: 40,
    availableHours: 40,
    utilizationPercent: 100,
    overallocated: false,
    conflictingTasks: [],
    weeklyDistribution: [
      {
        weekStartDate: "2025-06-02",
        allocatedHours: 40,
        availableHours: 40,
        utilizationPercent: 100,
        overallocated: false,
      },
    ],
  },
  {
    userId: "user-5",
    user: mockUsers[4],
    totalAllocatedHours: 60,
    availableHours: 40,
    utilizationPercent: 150,
    overallocated: true,
    conflictingTasks: [
      {
        taskId1: "task-2",
        taskId2: "task-review-1",
        conflictType: "Overallocation",
        severity: "High",
        description: "Tech Lead asignado a más de 40 horas por semana",
        suggestedResolution: "Redistribuir tareas o ajustar cronograma",
      },
    ],
    weeklyDistribution: [
      {
        weekStartDate: "2025-06-02",
        allocatedHours: 60,
        availableHours: 40,
        utilizationPercent: 150,
        overallocated: true,
      },
    ],
  },
  {
    userId: "user-2",
    user: mockUsers[1],
    totalAllocatedHours: 15,
    availableHours: 40,
    utilizationPercent: 37.5,
    overallocated: false,
    conflictingTasks: [],
    weeklyDistribution: [
      {
        weekStartDate: "2025-06-02",
        allocatedHours: 15,
        availableHours: 40,
        utilizationPercent: 37.5,
        overallocated: false,
      },
    ],
  },
];

// ========== PROYECTOS DEMO ==========

export const createDemoProject = (): Task[] => {
  const today = new Date();
  const addDays = (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split("T")[0];
  };

  const startDate = today.toISOString().split("T")[0];

  return [
    {
      id: "1",
      name: "Planeación Estratégica",
      startDate: startDate,
      endDate: addDays(today, 5),
      duration: 5,
      progress: 100,
      color: "#3b82f6",
      priority: "alta",
      assignedUsers: getUsersById(["user-4", "user-1"]),
      subtasks: [
        {
          id: "1.1",
          name: "Estudio de mercado",
          startDate: startDate,
          endDate: addDays(today, 2),
          duration: 2,
          progress: 100,
          priority: "normal",
          assignedUsers: getUsersById(["user-1"]),
        },
        {
          id: "1.2",
          name: "Análisis de competencia",
          startDate: addDays(today, 2),
          endDate: addDays(today, 4),
          duration: 2,
          progress: 100,
          priority: "normal",
          assignedUsers: getUsersById(["user-3"]),
        },
        {
          id: "1.3",
          name: "Definición de objetivos",
          startDate: addDays(today, 4),
          endDate: addDays(today, 5),
          duration: 1,
          progress: 100,
          priority: "alta",
          assignedUsers: getUsersById(["user-4"]),
        },
      ],
    },
    {
      id: "2",
      name: "Desarrollo Técnico",
      startDate: addDays(today, 5),
      endDate: addDays(today, 19),
      duration: 14,
      progress: 30,
      color: "#f59e0b",
      priority: "crítica",
      assignedUsers: getUsersById(["user-1", "user-2"]),
    },
    {
      id: "3",
      name: "Pruebas y QA",
      startDate: addDays(today, 19),
      endDate: addDays(today, 31),
      duration: 12,
      progress: 25,
      color: "#8b5cf6",
      priority: "alta",
      assignedUsers: getUsersById(["user-5"]),
    },
    {
      id: "4",
      name: "Publicación y Marketing",
      startDate: addDays(today, 31),
      endDate: addDays(today, 49),
      duration: 18,
      progress: 5,
      color: "#10b981",
      priority: "normal",
      assignedUsers: getUsersById(["user-3", "user-4"]),
    },
    {
      id: "5",
      name: "Capacitación de Equipo",
      startDate: addDays(today, 40),
      endDate: addDays(today, 45),
      duration: 5,
      progress: 0,
      color: "#ec4899",
      priority: "normal",
      assignedUsers: getUsersById(["user-4"]),
    },
    {
      id: "6",
      name: "Lanzamiento Fase Beta",
      startDate: addDays(today, 45),
      endDate: addDays(today, 57),
      duration: 12,
      progress: 10,
      color: "#14b8a6",
      priority: "crítica",
      assignedUsers: getUsersById(["user-1", "user-2", "user-5"]),
    },
  ];
};

export const createMarketingProject = (): Task[] => {
  const today = new Date();
  const addDays = (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split("T")[0];
  };

  const startDate = today.toISOString().split("T")[0];

  return [
    {
      id: "1",
      name: "Estrategia de Marketing Digital",
      startDate: startDate,
      endDate: addDays(today, 7),
      duration: 7,
      progress: 0,
      color: "#EC4899",
      priority: "alta",
      assignedUsers: getUsersById(["user-7", "user-3"]),
      subtasks: [
        {
          id: "1.1",
          name: "Investigación de mercado",
          startDate: startDate,
          endDate: addDays(today, 3),
          duration: 3,
          progress: 0,
          priority: "alta",
          assignedUsers: getUsersById(["user-7"]),
        },
        {
          id: "1.2",
          name: "Definición de buyer personas",
          startDate: addDays(today, 3),
          endDate: addDays(today, 5),
          duration: 2,
          progress: 0,
          priority: "normal",
          assignedUsers: getUsersById(["user-7"]),
        },
      ],
    },
    {
      id: "2",
      name: "Creación de Contenido",
      startDate: addDays(today, 7),
      endDate: addDays(today, 21),
      duration: 14,
      progress: 0,
      color: "#10B981",
      priority: "normal",
      assignedUsers: getUsersById(["user-2", "user-7"]),
    },
    {
      id: "3",
      name: "Lanzamiento de Campaña",
      startDate: addDays(today, 21),
      endDate: addDays(today, 35),
      duration: 14,
      progress: 0,
      color: "#F59E0B",
      priority: "crítica",
      assignedUsers: getUsersById(["user-7"]),
    },
  ];
};

export const createMobileProject = (): Task[] => {
  const today = new Date();
  const addDays = (date: Date, days: number): string => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split("T")[0];
  };

  const startDate = today.toISOString().split("T")[0];

  return [
    {
      id: "1",
      name: "Diseño UX/UI Mobile",
      startDate: startDate,
      endDate: addDays(today, 10),
      duration: 10,
      progress: 0,
      color: "#10B981",
      priority: "alta",
      assignedUsers: getUsersById(["user-2"]),
    },
    {
      id: "2",
      name: "Desarrollo React Native",
      startDate: addDays(today, 8),
      endDate: addDays(today, 25),
      duration: 17,
      progress: 0,
      color: "#3b82f6",
      priority: "crítica",
      assignedUsers: getUsersById(["user-1", "user-5"]),
    },
    {
      id: "3",
      name: "Testing en Dispositivos",
      startDate: addDays(today, 22),
      endDate: addDays(today, 30),
      duration: 8,
      progress: 0,
      color: "#8b5cf6",
      priority: "alta",
      assignedUsers: getUsersById(["user-6"]),
    },
    {
      id: "4",
      name: "Publicación en Stores",
      startDate: addDays(today, 30),
      endDate: addDays(today, 35),
      duration: 5,
      progress: 0,
      color: "#f59e0b",
      priority: "normal",
      assignedUsers: getUsersById(["user-5", "user-3"]),
    },
  ];
};

// ========== FUNCIONES HELPER PARA MOCKEAR DATOS ==========

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find((user) => user.id === id);
};

export const getUsersById = (userIds: string[]): User[] => {
  return userIds
    .map((id) => mockUsers.find((user) => user.id === id))
    .filter((user) => user !== undefined) as User[];
};

export const getUsersForTask = (taskId: string): User[] => {
  const assignments = mockResourceAssignments.filter(
    (a) => a.taskId === taskId
  );
  return assignments
    .map((assignment) => getUserById(assignment.userId))
    .filter(Boolean) as User[];
};

export const getTaskAssignments = (taskId: string): ResourceAssignment[] => {
  return mockResourceAssignments.filter((a) => a.taskId === taskId);
};

export const getUserWorkload = (userId: string): UserWorkload | undefined => {
  return mockUserWorkloads.find((w) => w.userId === userId);
};

export const getAvailableUsers = (): User[] => {
  return mockUsers.filter((user) => {
    const workload = getUserWorkload(user.id);
    return user.isActive && (!workload || workload.utilizationPercent < 80);
  });
};

export const getOverallocatedUsers = (): User[] => {
  return mockUsers.filter((user) => {
    const workload = getUserWorkload(user.id);
    return workload && workload.overallocated;
  });
};

// ========== COLORES PREDEFINIDOS PARA NUEVOS USUARIOS ==========

export const userColors = [
  "#3B82F6", // Azul
  "#10B981", // Verde
  "#F59E0B", // Amarillo
  "#8B5CF6", // Púrpura
  "#EF4444", // Rojo
  "#06B6D4", // Cyan
  "#EC4899", // Rosa
  "#84CC16", // Lima
  "#F97316", // Naranja
  "#6366F1", // Índigo
];

export const getNextUserColor = (existingColors: string[]): string => {
  const availableColors = userColors.filter(
    (color) => !existingColors.includes(color)
  );
  return availableColors[0] || userColors[0];
};

// ========== API SIMULADA PARA GENERAR TAREAS (IA Assistant) ==========

export const fakeGenerateTasksAPI = async (prompt: string): Promise<Task[]> => {
  console.log("🤖 IA Analizando prompt:", prompt);
  console.log("🔄 Generando estructura de proyecto...");

  // Simular procesamiento de IA más realista
  await new Promise((resolve) => setTimeout(resolve, 2500));

  console.log("✅ IA Completado: Proyecto generado exitosamente");
  console.log("📊 Tareas creadas con asignaciones automáticas de recursos");

  // Analizar el prompt para diferentes tipos de proyecto
  const promptLower = prompt.toLowerCase();

  if (promptLower.includes("marketing") || promptLower.includes("campaña")) {
    console.log("🎯 Tipo detectado: Proyecto de Marketing");
    return createMarketingProject();
  }

  if (
    promptLower.includes("móvil") ||
    promptLower.includes("mobile") ||
    promptLower.includes("app")
  ) {
    console.log("📱 Tipo detectado: Desarrollo Mobile");
    return createMobileProject();
  }

  if (
    promptLower.includes("web") ||
    promptLower.includes("sitio") ||
    promptLower.includes("desarrollo")
  ) {
    console.log("💻 Tipo detectado: Desarrollo Web");
    return createDemoProject();
  }

  // Por defecto, proyecto de desarrollo completo
  console.log("🚀 Tipo detectado: Proyecto de Desarrollo Completo");
  return createDemoProject();
};
