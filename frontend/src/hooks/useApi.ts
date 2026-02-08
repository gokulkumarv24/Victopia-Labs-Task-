import { useState, useEffect, useCallback } from 'react';
import { Task, TaskState, TaskCreate, TaskPriority } from '../types';
import { tasksApi } from '../services/api';

export const useTasks = (stateFilter?: TaskState, isAuthenticated: boolean = false) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('fetchTasks: Starting to fetch tasks with filter:', stateFilter);
      setLoading(true);
      setError(null);
      const data = await tasksApi.getTasks(stateFilter);
      console.log('fetchTasks: Successfully fetched', data.length, 'tasks');
      setTasks(data);
    } catch (err: any) {
      console.error('fetchTasks: Error fetching tasks:', err);
      setError(err.response?.data?.detail || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, stateFilter]);

  useEffect(() => {
    fetchTasks();
  }, [stateFilter, isAuthenticated, fetchTasks]);

  const createTask = async (
    title: string, 
    description?: string,
    scheduled_date?: string,
    scheduled_time?: string,
    due_date?: string,
    due_time?: string,
    priority?: TaskPriority,
    category?: string,
    reminder_time?: number
  ) => {
    try {
      const taskData: TaskCreate = {
        title,
        description,
        scheduled_date,
        scheduled_time,
        due_date,
        due_time,
        priority,
        category,
        reminder_time
      };
      const newTask = await tasksApi.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to create task');
    }
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
    try {
      const updatedTask = await tasksApi.updateTask(id, updates);
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
      return updatedTask;
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to update task');
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await tasksApi.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to delete task');
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
};

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const login = (token: string) => {
    console.log('useAuth login called with token:', !!token);
    localStorage.setItem('token', token);
    // Force immediate state update
    setIsAuthenticated(true);
    setLoading(false);
    console.log('Auth state updated: isAuthenticated = true');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    loading,
    login,
    logout
  };
};