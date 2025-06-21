// utils/resourceUtils.ts - Funciones utilitarias para recursos

import {
  User,
  Task,
  ResourceAssignment,
  UserWorkload,
  TaskConflict,
  ResourceSuggestion,
  UserSuggestion,
  ProjectResourceMetrics,
} from "../types/ganttTypes";

// ========== FUNCIONES DE CÁLCULO DE CARGA DE TRABAJO ==========

/**
 * Calcula la carga de trabajo de un usuario
 */
export const calculateUserWorkload = (
  user: User,
  assignments: ResourceAssignment[],
  dateRange?: { start: Date; end: Date }
): UserWorkload => {
  const userAssignments = assignments.filter((a) => a.userId === user.id);

  const totalAllocatedHours = userAssignments.reduce(
    (total, assignment) => total + assignment.allocatedHours,
    0
  );

  const availableHours = user.maxHoursPerWeek || 40;
  const utilizationPercent = Math.round(
    (totalAllocatedHours / availableHours) * 100
  );
  const overallocated = utilizationPercent > 100;

  // TODO: Implementar cálculo de conflictos y distribución semanal
  const conflictingTasks: TaskConflict[] = [];
  const weeklyDistribution = [
    {
      weekStartDate: new Date().toISOString().split("T")[0],
      allocatedHours: totalAllocatedHours,
      availableHours: availableHours,
      utilizationPercent: utilizationPercent,
      overallocated: overallocated,
    },
  ];

  return {
    userId: user.id,
    user,
    totalAllocatedHours,
    availableHours,
    utilizationPercent,
    overallocated,
    conflictingTasks,
    weeklyDistribution,
  };
};

/**
 * Obtiene usuarios asignados a una tarea específica
 */
export const getUsersForTask = (
  taskId: string,
  users: User[],
  assignments: ResourceAssignment[]
): User[] => {
  const taskAssignments = assignments.filter((a) => a.taskId === taskId);
  return taskAssignments
    .map((assignment) => users.find((user) => user.id === assignment.userId))
    .filter(Boolean) as User[];
};

/**
 * Obtiene asignaciones de una tarea específica
 */
export const getTaskAssignments = (
  taskId: string,
  assignments: ResourceAssignment[]
): ResourceAssignment[] => {
  return assignments.filter((a) => a.taskId === taskId);
};

/**
 * Verifica si un usuario está disponible en un rango de fechas
 */
export const isUserAvailable = (
  user: User,
  startDate: Date,
  endDate: Date,
  assignments: ResourceAssignment[]
): boolean => {
  if (!user.isActive) return false;

  // Verificar fechas no disponibles
  const unavailableDates = user.unavailableDates || [];
  const dateRange = getDateRange(startDate, endDate);

  const hasUnavailableDates = dateRange.some((date) =>
    unavailableDates.includes(date.toISOString().split("T")[0])
  );

  if (hasUnavailableDates) return false;

  // Verificar sobrecarga
  const workload = calculateUserWorkload(user, assignments);
  return workload.utilizationPercent < 100;
};

/**
 * Genera rango de fechas entre dos fechas
 */
export const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

// ========== FUNCIONES DE ANÁLISIS Y SUGERENCIAS ==========

/**
 * Analiza las habilidades requeridas vs disponibles
 */
export const analyzeSkillMatch = (
  requiredSkills: string[],
  user: User
): number => {
  if (!requiredSkills.length) return 100;
  if (!user.skills?.length) return 0;

  const matchingSkills = requiredSkills.filter((skill) =>
    user.skills!.some(
      (userSkill) =>
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  );

  return Math.round((matchingSkills.length / requiredSkills.length) * 100);
};

/**
 * Sugiere usuarios para una tarea basándose en habilidades y disponibilidad
 */
export const suggestUsersForTask = (
  task: Task,
  users: User[],
  assignments: ResourceAssignment[]
): UserSuggestion[] => {
  const taskStartDate = task.startDate ? new Date(task.startDate) : new Date();
  const taskEndDate = task.endDate
    ? new Date(task.endDate)
    : new Date(
        taskStartDate.getTime() + (task.duration || 1) * 24 * 60 * 60 * 1000
      );

  const suggestions: UserSuggestion[] = users
    .filter((user) => user.isActive)
    .map((user) => {
      const skillMatch = analyzeSkillMatch(task.requiredSkills || [], user);
      const isAvailable = isUserAvailable(
        user,
        taskStartDate,
        taskEndDate,
        assignments
      );
      const workload = calculateUserWorkload(user, assignments);

      let matchScore = 0;
      const reasons: string[] = [];
      const riskFactors: string[] = [];

      // Calcular puntuación de coincidencia
      if (skillMatch > 80) {
        matchScore += 40;
        reasons.push(`Excelente coincidencia de habilidades (${skillMatch}%)`);
      } else if (skillMatch > 50) {
        matchScore += 25;
        reasons.push(`Buena coincidencia de habilidades (${skillMatch}%)`);
      } else if (skillMatch > 0) {
        matchScore += 10;
        reasons.push(`Coincidencia parcial de habilidades (${skillMatch}%)`);
      }

      // Disponibilidad
      if (isAvailable) {
        matchScore += 30;
        reasons.push("Usuario disponible");
      } else {
        riskFactors.push("Usuario no disponible en las fechas");
      }

      // Carga de trabajo
      if (workload.utilizationPercent < 50) {
        matchScore += 20;
        reasons.push("Baja carga de trabajo actual");
      } else if (workload.utilizationPercent < 80) {
        matchScore += 10;
        reasons.push("Carga de trabajo moderada");
      } else if (workload.utilizationPercent >= 100) {
        riskFactors.push("Usuario sobrecargado");
      }

      // Nivel de experiencia
      switch (user.skillLevel) {
        case "Lead":
          matchScore += 10;
          reasons.push("Experiencia de liderazgo");
          break;
        case "Senior":
          matchScore += 8;
          reasons.push("Experiencia senior");
          break;
        case "Mid":
          matchScore += 5;
          reasons.push("Experiencia intermedia");
          break;
        case "Junior":
          matchScore += 2;
          reasons.push("Desarrollador junior");
          break;
      }

      const estimatedEfficiency = Math.min(100, matchScore + skillMatch / 2);

      return {
        user,
        matchScore: Math.min(100, matchScore),
        reasons,
        estimatedEfficiency,
        riskFactors: riskFactors.length > 0 ? riskFactors : undefined,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return suggestions;
};

/**
 * Detecta conflictos entre tareas
 */
export const detectTaskConflicts = (
  tasks: Task[],
  assignments: ResourceAssignment[]
): TaskConflict[] => {
  const conflicts: TaskConflict[] = [];

  // Buscar solapamientos de tiempo por usuario
  const userAssignmentMap = new Map<string, ResourceAssignment[]>();

  assignments.forEach((assignment) => {
    if (!userAssignmentMap.has(assignment.userId)) {
      userAssignmentMap.set(assignment.userId, []);
    }
    userAssignmentMap.get(assignment.userId)!.push(assignment);
  });

  userAssignmentMap.forEach((userAssignments, userId) => {
    for (let i = 0; i < userAssignments.length; i++) {
      for (let j = i + 1; j < userAssignments.length; j++) {
        const assignment1 = userAssignments[i];
        const assignment2 = userAssignments[j];

        const task1 = tasks.find((t) => t.id === assignment1.taskId);
        const task2 = tasks.find((t) => t.id === assignment2.taskId);

        if (!task1 || !task2) continue;

        // Verificar solapamiento de fechas
        const start1 = new Date(task1.startDate || Date.now());
        const end1 = new Date(
          start1.getTime() + (task1.duration || 1) * 24 * 60 * 60 * 1000
        );
        const start2 = new Date(task2.startDate || Date.now());
        const end2 = new Date(
          start2.getTime() + (task2.duration || 1) * 24 * 60 * 60 * 1000
        );

        const hasOverlap = start1 < end2 && start2 < end1;

        if (hasOverlap) {
          const totalHours =
            assignment1.allocatedHours + assignment2.allocatedHours;
          const severity =
            totalHours > 60
              ? "Critical"
              : totalHours > 40
              ? "High"
              : totalHours > 30
              ? "Medium"
              : "Low";

          conflicts.push({
            taskId1: assignment1.taskId,
            taskId2: assignment2.taskId,
            conflictType: "TimeOverlap",
            severity,
            description: `Usuario ${userId} asignado a tareas solapadas (${totalHours}h total)`,
            suggestedResolution: "Ajustar cronograma o reasignar recursos",
          });
        }
      }
    }
  });

  return conflicts;
};

/**
 * Calcula métricas generales del proyecto
 */
export const calculateProjectMetrics = (
  users: User[],
  tasks: Task[],
  assignments: ResourceAssignment[]
): ProjectResourceMetrics => {
  const activeUsers = users.filter((u) => u.isActive);
  const workloads = activeUsers.map((user) =>
    calculateUserWorkload(user, assignments)
  );

  const totalUsers = users.length;
  const activeUserCount = activeUsers.length;
  const averageUtilization =
    workloads.length > 0
      ? Math.round(
          workloads.reduce((sum, w) => sum + w.utilizationPercent, 0) /
            workloads.length
        )
      : 0;

  const overallocatedUsers = workloads.filter((w) => w.overallocated).length;
  const underutilizedUsers = workloads.filter(
    (w) => w.utilizationPercent < 50
  ).length;

  const totalEstimatedHours = assignments.reduce(
    (sum, a) => sum + a.estimatedHours,
    0
  );
  const totalActualHours = assignments.reduce(
    (sum, a) => sum + (a.actualHours || 0),
    0
  );
  const efficiencyRatio =
    totalEstimatedHours > 0
      ? Math.round((totalActualHours / totalEstimatedHours) * 100) / 100
      : 1;

  // Detectar brechas de habilidades críticas
  const allRequiredSkills = tasks.flatMap((t) => t.requiredSkills || []);
  const availableSkills = activeUsers.flatMap((u) => u.skills || []);
  const criticalSkillGaps = allRequiredSkills.filter(
    (skill) =>
      !availableSkills.some((available) =>
        available.toLowerCase().includes(skill.toLowerCase())
      )
  );

  // Generar recomendaciones
  const recommendedActions: string[] = [];

  if (overallocatedUsers > 0) {
    recommendedActions.push(
      `Redistribuir carga de ${overallocatedUsers} usuario(s) sobrecargado(s)`
    );
  }

  if (underutilizedUsers > 0) {
    recommendedActions.push(
      `Asignar más trabajo a ${underutilizedUsers} usuario(s) subutilizado(s)`
    );
  }

  if (criticalSkillGaps.length > 0) {
    recommendedActions.push(
      `Capacitar o contratar para: ${criticalSkillGaps.join(", ")}`
    );
  }

  if (averageUtilization < 70) {
    recommendedActions.push(
      "Considerar reducir el equipo o acelerar el cronograma"
    );
  } else if (averageUtilization > 90) {
    recommendedActions.push(
      "Considerar ampliar el equipo o extender el cronograma"
    );
  }

  return {
    totalUsers,
    activeUsers: activeUserCount,
    averageUtilization,
    overallocatedUsers,
    underutilizedUsers,
    totalEstimatedHours,
    totalActualHours,
    efficiencyRatio,
    criticalSkillGaps: [...new Set(criticalSkillGaps)],
    recommendedActions,
  };
};

// ========== FUNCIONES DE FORMATEO ==========

/**
 * Formatea las horas de trabajo
 */
export const formatWorkHours = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)}min`;
  if (hours < 8) return `${hours.toFixed(1)}h`;

  const days = Math.floor(hours / 8);
  const remainingHours = hours % 8;

  if (remainingHours === 0) return `${days}d`;
  return `${days}d ${remainingHours.toFixed(1)}h`;
};

/**
 * Formatea el porcentaje de utilización
 */
export const formatUtilization = (percent: number): string => {
  return `${Math.round(percent)}%`;
};

/**
 * Obtiene el color basado en la utilización
 */
export const getUtilizationColor = (percent: number): string => {
  if (percent >= 100) return "#EF4444"; // Rojo - Sobrecargado
  if (percent >= 80) return "#F59E0B"; // Amarillo - Ocupado
  if (percent >= 50) return "#10B981"; // Verde - Óptimo
  return "#6B7280"; // Gris - Subutilizado
};

/**
 * Obtiene el estado de disponibilidad
 */
export const getAvailabilityStatus = (
  user: User,
  workload?: UserWorkload
): "available" | "busy" | "overloaded" | "unavailable" => {
  if (!user.isActive) return "unavailable";
  if (!workload) return "available";

  if (workload.overallocated) return "overloaded";
  if (workload.utilizationPercent >= 80) return "busy";
  return "available";
};

// ========== FUNCIONES DE VALIDACIÓN ==========

/**
 * Valida si una asignación es válida
 */
export const validateResourceAssignment = (
  assignment: Omit<ResourceAssignment, "id">,
  user: User,
  task: Task,
  existingAssignments: ResourceAssignment[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!user.isActive) {
    errors.push("El usuario no está activo");
  }

  if (assignment.allocatedHours <= 0) {
    errors.push("Las horas asignadas deben ser mayor a 0");
  }

  if (assignment.allocatedHours > (user.maxHoursPerWeek || 40)) {
    errors.push(
      `Las horas exceden el máximo semanal del usuario (${
        user.maxHoursPerWeek || 40
      }h)`
    );
  }

  // Verificar si ya está asignado a la tarea
  const existingAssignment = existingAssignments.find(
    (a) => a.taskId === assignment.taskId && a.userId === assignment.userId
  );

  if (existingAssignment) {
    errors.push("El usuario ya está asignado a esta tarea");
  }

  // Verificar habilidades requeridas
  if (task.requiredSkills && task.requiredSkills.length > 0) {
    const skillMatch = analyzeSkillMatch(task.requiredSkills, user);
    if (skillMatch === 0) {
      errors.push("El usuario no tiene las habilidades requeridas");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ========== FUNCIONES DE EXPORTACIÓN/IMPORTACIÓN ==========

/**
 * Exporta datos de recursos para backup
 */
export const exportResourceData = (
  users: User[],
  assignments: ResourceAssignment[]
) => {
  return {
    version: "1.0",
    exportDate: new Date().toISOString(),
    users,
    assignments,
  };
};

/**
 * Importa datos de recursos desde backup
 */
export const importResourceData = (
  data: any
): { users: User[]; assignments: ResourceAssignment[] } => {
  // Validar estructura básica
  if (!data.users || !Array.isArray(data.users)) {
    throw new Error("Formato de datos inválido: usuarios requeridos");
  }

  if (!data.assignments || !Array.isArray(data.assignments)) {
    throw new Error("Formato de datos inválido: asignaciones requeridas");
  }

  return {
    users: data.users,
    assignments: data.assignments,
  };
};
