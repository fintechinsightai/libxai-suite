// types/ganttTypes.ts - VERSIÓN COMERCIAL LIMPIA

// ========== TIPOS ACTUALMENTE EN USO ==========

export interface Task {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  progress?: number;
  color?: string;
  dependencies?: string[];
  priority?: "baja" | "normal" | "alta" | "crítica";
  description?: string;
  resources?: string[]; // Legacy compatibility
  parent?: string;
  subtasks?: Task[];

  // ✅ RECURSOS ACTIVOS
  assignedUsers?: User[]; // Usuarios asignados (SÍ SE USA)

  // ✅ HERENCIA - NUEVA FUNCIONALIDAD
  parentId?: string; // Para referenciar tarea padre
  inheritUsers?: boolean; // Si hereda usuarios del padre
  inheritanceConfig?: TaskInheritanceConfig; // Configuración de herencia
}

export interface User {
  id: string;
  name: string;
  initials: string; // Para avatares (ej: "JP", "MS") - SÍ SE USA
  email?: string;
  color: string; // Color hex para identificación visual - SÍ SE USA
  role: string | UserRole; // "Developer", "Designer", "PM", etc. - SÍ SE USA
  department?: string; // "Engineering", "Design", "Marketing" - SÍ SE USA
  skillLevel: SkillLevel; // SÍ SE USA
  skills?: string[]; // ["React", "TypeScript", "Node.js"] - SÍ SE USA
  hourlyRate?: number; // Para cálculos de costo - SÍ SE USA
  isActive: boolean; // Si está disponible - SÍ SE USA
  workingHours?: WorkingHours; // Horario de trabajo - SÍ SE USA
  unavailableDates?: string[]; // Fechas no disponibles - SÍ SE USA
  maxHoursPerWeek?: number; // Máximo de horas por semana - SÍ SE USA

  // FUTURE: avatar?: string; // URL de imagen o base64
}

export interface WorkingHours {
  start: string; // "09:00" - SÍ SE USA
  end: string; // "17:00" - SÍ SE USA
  timezone: string; // "America/Bogota" - SÍ SE USA
  workingDays: number[]; // [1,2,3,4,5] (lunes a viernes) - SÍ SE USA
}

export interface ResourceAssignment {
  id: string;
  taskId: string;
  userId: string;
  role: "Owner" | "Contributor" | "Reviewer" | "Observer"; // SÍ SE USA
  allocatedHours: number; // SÍ SE USA
  estimatedHours: number; // SÍ SE USA
  assignedDate: string; // SÍ SE USA
  startDate?: string; // SÍ SE USA
  endDate?: string; // SÍ SE USA
  status: "Assigned" | "Active" | "Completed" | "Blocked"; // SÍ SE USA

  // FUTURE: actualHours?: number;
  // FUTURE: notes?: string;
}

// ✅ NUEVA FUNCIONALIDAD - HERENCIA DE USUARIOS
export interface TaskInheritanceConfig {
  inheritUsers: boolean; // Si hereda usuarios automáticamente
  inheritMode: "all" | "supervisors_only" | "none"; // Modo de herencia
  roleMapping?: {
    // Cómo mapear roles padre → hijo
    Owner: "Reviewer" | "Owner";
    Contributor: "Contributor" | "Reviewer";
    Reviewer: "Reviewer" | "Observer";
    Observer: "Observer";
  };
  allowOverride?: boolean; // Si permite override manual
}

// ========== ENUMS ACTIVOS ==========

export enum UserRole {
  DEVELOPER = "Developer", // SÍ SE USA
  DESIGNER = "Designer", // SÍ SE USA
  PROJECT_MANAGER = "Project Manager", // SÍ SE USA
  QA_ENGINEER = "QA Engineer", // SÍ SE USA

  // FUTURE ROLES:
  // DEVOPS = "DevOps",
  // BUSINESS_ANALYST = "Business Analyst",
  // PRODUCT_OWNER = "Product Owner",
  // SCRUM_MASTER = "Scrum Master",
}

export enum SkillLevel {
  JUNIOR = "Junior", // SÍ SE USA
  MID = "Mid", // SÍ SE USA
  SENIOR = "Senior", // SÍ SE USA
  LEAD = "Lead", // SÍ SE USA
}

// ========== TIPOS PREPARADOS PARA FUTURAS FUNCIONALIDADES ==========

/* FUTURE FEATURE: Distribución de carga de trabajo
export interface WorkloadDistribution {
  userId: string;
  allocatedHours: number;
  allocatedPercentage: number;
  role: "Owner" | "Contributor" | "Reviewer" | "Observer";
  assignedDate: string;
  status: "Assigned" | "Active" | "Completed" | "Blocked";
}
*/

/* FUTURE FEATURE: Análisis de carga de usuarios
export interface UserWorkload {
  userId: string;
  user: User;
  totalAllocatedHours: number;
  availableHours: number;
  utilizationPercent: number;
  overallocated: boolean;
  conflictingTasks: TaskConflict[];
  weeklyDistribution: WeeklyWorkload[];
}
*/

/* FUTURE FEATURE: Detección de conflictos
export interface TaskConflict {
  taskId1: string;
  taskId2: string;
  conflictType: "TimeOverlap" | "Overallocation" | "SkillMismatch";
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  suggestedResolution?: string;
}
*/

/* FUTURE FEATURE: Distribución semanal
export interface WeeklyWorkload {
  weekStartDate: string;
  allocatedHours: number;
  availableHours: number;
  utilizationPercent: number;
  overallocated: boolean;
}
*/

/* FUTURE FEATURE: Sugerencias de IA
export interface ResourceSuggestion {
  taskId: string;
  suggestedUsers: UserSuggestion[];
  reason: string;
  confidence: number;
  estimatedImprovement: string;
  alternativeOptions?: UserSuggestion[];
}

export interface UserSuggestion {
  user: User;
  matchScore: number;
  reasons: string[];
  estimatedEfficiency: number;
  riskFactors?: string[];
}
*/

/* FUTURE FEATURE: Métricas del proyecto
export interface ProjectResourceMetrics {
  totalUsers: number;
  activeUsers: number;
  averageUtilization: number;
  overallocatedUsers: number;
  underutilizedUsers: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  efficiencyRatio: number;
  criticalSkillGaps: string[];
  recommendedActions: string[];
}
*/

/* FUTURE FEATURE: Configuración de vistas
export interface ResourceViewConfig {
  showAvailability: boolean;
  showSkills: boolean;
  showWorkload: boolean;
  groupBy: "department" | "role" | "skillLevel" | "none";
  sortBy: "name" | "utilization" | "availability" | "role";
  filterBy: {
    departments?: string[];
    roles?: string[];
    skillLevels?: SkillLevel[];
    availability?: "available" | "busy" | "overloaded" | "all";
  };
}
*/

/* FUTURE FEATURE: Configuración del Gantt
export interface GanttResourceConfig {
  showMiniAvatars: boolean;
  showResourceNames: boolean;
  showWorkloadIndicators: boolean;
  avatarSize: "xs" | "sm" | "md";
  maxAvatarsPerTask: number;
  showOverallocationWarnings: boolean;
}
*/

/* FUTURE FEATURE: Tipos helper
export type TaskWithResourceInfo = Task & {
  resourceInfo?: {
    totalUsers: number;
    primaryOwner?: User;
    isOverallocated: boolean;
    skillsMatch: number;
    estimatedCompletion: string;
  };
};

export type UserWithWorkload = User & {
  currentWorkload?: UserWorkload;
  availability?: "available" | "busy" | "overloaded" | "unavailable";
};
*/

/* FUTURE FEATURE: Callbacks y eventos
export interface ResourceEventCallbacks {
  onUserAssign?: (taskId: string, userId: string, role: string) => void;
  onUserUnassign?: (taskId: string, userId: string) => void;
  onWorkloadUpdate?: (userId: string, workload: UserWorkload) => void;
  onResourceConflict?: (conflict: TaskConflict) => void;
  onResourceOptimization?: (suggestions: ResourceSuggestion[]) => void;
}
*/

/* FUTURE FEATURE: Configuración general
export interface LibGanttResourceConfig {
  enableResourceManagement: boolean;
  enableAIOptimization: boolean;
  enableWorkloadTracking: boolean;
  enableSkillMatching: boolean;
  enableConflictDetection: boolean;
  autoAssignResources: boolean;
  showResourceDashboard: boolean;
  resourceViewConfig: ResourceViewConfig;
  ganttResourceConfig: GanttResourceConfig;
}
*/

// ========== ENUMS FUTUROS ==========

/* FUTURE FEATURE: Roles de asignación
export enum AssignmentRole {
  OWNER = "Owner",
  CONTRIBUTOR = "Contributor",
  REVIEWER = "Reviewer",
  OBSERVER = "Observer",
}

export enum AssignmentStatus {
  ASSIGNED = "Assigned",
  ACTIVE = "Active",
  COMPLETED = "Completed",
  BLOCKED = "Blocked",
}
*/
