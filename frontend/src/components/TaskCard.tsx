import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Avatar,
  LinearProgress,
  Tooltip,
  Fade,
  Zoom,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import {
  Edit,
  Delete,
  Save,
  Cancel,
  PlayArrow,
  Check,
  AccessTime,
  Person,
  CalendarToday,
  Flag,
  MoreVert
} from '@mui/icons-material';
import { Task, TaskState, TaskPriority } from '../types';

interface TaskCardProps {
  task: Task;
  onUpdate: (id: number, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [loading, setLoading] = useState(false);

  const getPriorityColor = (priority: TaskPriority): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'success';
      case TaskPriority.MEDIUM:
        return 'primary';
      case TaskPriority.HIGH:
        return 'warning';
      case TaskPriority.URGENT:
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityGradient = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)';
      case TaskPriority.MEDIUM:
        return 'linear-gradient(135deg, #2196f3 0%, #03dac6 100%)';
      case TaskPriority.HIGH:
        return 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)';
      case TaskPriority.URGENT:
        return 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)';
      default:
        return 'linear-gradient(135deg, #9e9e9e 0%, #607d8b 100%)';
    }
  };

  const getStateIcon = () => {
    switch (task.state) {
      case TaskState.COMPLETED:
        return <Check sx={{ color: 'success.main' }} />;
      case TaskState.IN_PROGRESS:
        return <PlayArrow sx={{ color: 'warning.main' }} />;
      default:
        return <AccessTime sx={{ color: 'text.secondary' }} />;
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getStateColor = (state: TaskState): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (state) {
      case TaskState.NOT_STARTED:
        return 'default';
      case TaskState.IN_PROGRESS:
        return 'primary';
      case TaskState.COMPLETED:
        return 'success';
      default:
        return 'default';
    }
  };

  const getNextState = (currentState: TaskState): TaskState | null => {
    switch (currentState) {
      case TaskState.NOT_STARTED:
        return TaskState.IN_PROGRESS;
      case TaskState.IN_PROGRESS:
        return TaskState.COMPLETED;
      default:
        return null;
    }
  };

  const getStateActionText = (currentState: TaskState): string => {
    switch (currentState) {
      case TaskState.NOT_STARTED:
        return 'Start Task';
      case TaskState.IN_PROGRESS:
        return 'Complete Task';
      default:
        return 'No Action';
    }
  };

  const handleStateUpdate = async () => {
    const nextState = getNextState(task.state);
    if (!nextState) return;

    setLoading(true);
    try {
      await onUpdate(task.id, { state: nextState });
    } catch (error) {
      console.error('Failed to update task state:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    setLoading(true);
    try {
      await onUpdate(task.id, { 
        title: editTitle.trim(), 
        description: editDescription.trim() || undefined 
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      try {
        await onDelete(task.id);
      } catch (error) {
        console.error('Failed to delete task:', error);
        setLoading(false);
      }
    }
  };

  return (
    <Zoom in={true} timeout={300}>
      <Card 
        elevation={task.state === TaskState.COMPLETED ? 2 : 8}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          overflow: 'hidden',
          background: task.state === TaskState.COMPLETED 
            ? 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: `2px solid transparent`,
          borderImage: task.state === TaskState.COMPLETED 
            ? 'none'
            : getPriorityGradient(task.priority),
          borderImageSlice: task.state === TaskState.COMPLETED ? 0 : 1,
          opacity: task.state === TaskState.COMPLETED ? 0.8 : 1,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 25px -8px ${task.state === TaskState.COMPLETED ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.15)'}`,
            '& .task-actions': {
              opacity: 1
            }
          }
        }}
      >
        {/* Priority Indicator Strip */}
        <Box
          sx={{
            height: 4,
            background: getPriorityGradient(task.priority),
            opacity: task.state === TaskState.COMPLETED ? 0.5 : 1
          }}
        />
        
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Header with Status and Priority */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  background: getPriorityGradient(task.priority),
                  fontSize: '0.875rem'
                }}
              >
                {getStateIcon()}
              </Avatar>
              <Box>
                <Chip
                  size="small"
                  label={task.state.replace('_', ' ')}
                  color={getStateColor(task.state)}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 24
                  }}
                />
              </Box>
            </Box>
            
            <Box className="task-actions" sx={{ opacity: 0, transition: 'opacity 0.2s' }}>
              <Tooltip title="More options">
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <MoreVert />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Title and Description */}
          {isEditing ? (
            <Stack spacing={2}>
              <TextField
                fullWidth
                size="small"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Task title..."
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)..."
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Stack>
          ) : (
            <>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  textDecoration: task.state === TaskState.COMPLETED ? 'line-through' : 'none',
                  color: task.state === TaskState.COMPLETED ? 'text.secondary' : 'text.primary',
                  lineHeight: 1.3,
                  fontSize: '1.1rem'
                }}
              >
                {task.title}
              </Typography>
              
              {task.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {task.description}
                </Typography>
              )}
            </>
          )}

          {/* Metadata Section */}
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                size="small"
                icon={<Flag />}
                label={task.priority}
                sx={{
                  background: getPriorityGradient(task.priority),
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: 'white'
                  }
                }}
              />
              
              {task.category && (
                <Chip
                  size="small"
                  label={task.category}
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 500 }}
                />
              )}
            </Stack>

            {/* Dates Section */}
            {(task.scheduled_date || task.due_date) && (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                <Stack spacing={1}>
                  {task.scheduled_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        Scheduled: {formatDate(task.scheduled_date)}
                        {task.scheduled_time && ` at ${task.scheduled_time}`}
                      </Typography>
                    </Box>
                  )}
                  
                  {task.due_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ fontSize: 16, color: 'error.main' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main' }}>
                        Due: {formatDate(task.due_date)}
                        {task.due_time && ` at ${task.due_time}`}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            )}
          </Box>
        </CardContent>

        <Divider />

        {/* Actions */}
        <CardActions sx={{ p: 2, justifyContent: 'space-between', bgcolor: 'grey.50' }}>
          {isEditing ? (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveEdit}
                disabled={loading || !editTitle.trim()}
                startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(task.title);
                  setEditDescription(task.description || '');
                }}
                disabled={loading}
                startIcon={<Cancel />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Cancel
              </Button>
            </Stack>
          ) : (
            <>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Edit task">
                  <IconButton
                    size="small"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    <Edit sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete task">
                  <IconButton
                    size="small"
                    onClick={handleDelete}
                    disabled={loading}
                    sx={{
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'error.dark',
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    <Delete sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* State Transition Button */}
              {getNextState(task.state) && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleStateUpdate}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : getStateIcon()}
                  sx={{
                    background: getPriorityGradient(task.priority),
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2,
                    '&:hover': {
                      opacity: 0.9,
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  {getNextState(task.state)?.replace('_', ' ')}
                </Button>
              )}
            </>
          )}
        </CardActions>
      </Card>
    </Zoom>
  );
};

export default TaskCard;