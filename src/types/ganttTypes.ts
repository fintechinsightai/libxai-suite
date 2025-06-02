// types/ganttTypes.ts

export interface Subtask {
  id: string;
  name: string;
  duration: number;
}

export interface Task {
  id: string;
  name: string;
  duration: number;
  startDate?: string;
  endDate?: string;
  progress?: number;
  subtasks?: Subtask[];
}
