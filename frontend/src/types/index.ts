export enum TaskState {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed"
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  state: TaskState;
  created_at: string;
  updated_at: string;
  user_id: number;
  scheduled_date?: string;
  scheduled_time?: string;
  due_date?: string;
  due_time?: string;
  reminder_time?: number; // minutes before due time
  priority: TaskPriority;
  category?: string;
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export interface TaskCreate {
  title: string;
  description?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  due_date?: string;
  due_time?: string;
  reminder_time?: number;
  priority?: TaskPriority;
  category?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  state?: TaskState;
  scheduled_date?: string;
  scheduled_time?: string;
  due_date?: string;
  due_time?: string;
  reminder_time?: number;
  priority?: TaskPriority;
  category?: string;
}

export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface UserCreate {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface AICommandRequest {
  command: string;
}

export interface AICommandResponse {
  success: boolean;
  message: string;
  action?: string;
  task_id?: number;
  tasks?: Task[];
}

export interface StateTransitions {
  states: string[];
  transitions: Record<string, string[]>;
  rules: string[];
}