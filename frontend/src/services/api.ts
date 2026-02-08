import axios, { AxiosResponse } from 'axios';
import { 
  Task, 
  TaskCreate, 
  TaskUpdate, 
  TaskState,
  UserCreate, 
  LoginRequest, 
  AuthToken,
  AICommandRequest,
  AICommandResponse,
  StateTransitions
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  register: async (userData: UserCreate): Promise<AxiosResponse> => {
    return api.post('/auth/register', userData);
  },

  login: async (credentials: LoginRequest): Promise<AuthToken> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },
};

// Tasks API
export const tasksApi = {
  // Get all tasks, optionally filtered by state
  getTasks: async (state?: TaskState): Promise<Task[]> => {
    const params = state ? { state } : {};
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // Get a specific task by ID
  getTask: async (id: number): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create a new task
  createTask: async (task: TaskCreate): Promise<Task> => {
    const response = await api.post('/tasks', task);
    return response.data;
  },

  // Update an existing task
  updateTask: async (id: number, updates: TaskUpdate): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, updates);
    return response.data;
  },

  // Delete a task
  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Process AI command
  processAICommand: async (command: AICommandRequest): Promise<AICommandResponse> => {
    const response = await api.post('/tasks/ai-command', command);
    return response.data;
  },

  // Get state transitions info
  getStateTransitions: async (): Promise<StateTransitions> => {
    const response = await api.get('/tasks/states/transitions');
    return response.data;
  },
};

export default api;