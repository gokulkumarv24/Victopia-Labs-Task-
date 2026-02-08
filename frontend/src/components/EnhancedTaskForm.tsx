import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Divider,
  Grid
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { Add, Cancel } from '@mui/icons-material';
import { TaskCreate, TaskPriority } from '../types';

interface EnhancedTaskFormProps {
  onSubmit: (task: TaskCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const EnhancedTaskForm: React.FC<EnhancedTaskFormProps> = ({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<TaskCreate>({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    category: '',
    scheduled_date: '',
    scheduled_time: '',
    due_date: '',
    due_time: '',
    reminder_time: undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onSubmit({
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      category: formData.category?.trim() || undefined,
      scheduled_date: formData.scheduled_date || undefined,
      scheduled_time: formData.scheduled_time || undefined,
      due_date: formData.due_date || undefined,
      due_time: formData.due_time || undefined,
      reminder_time: formData.reminder_time || undefined,
    });
  };

  const handleChange = (field: keyof TaskCreate) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const value = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReminderChange = (e: SelectChangeEvent<string | number>) => {
    const value = e.target.value === '' ? undefined : Number(e.target.value);
    setFormData(prev => ({
      ...prev,
      reminder_time: value
    }));
  };

  const categories = [
    'Work', 'Personal', 'Study', 'Health', 'Finance', 
    'Shopping', 'Travel', 'Social', 'Household', 'Other'
  ];

  const reminderOptions = [
    { value: 5, label: '5 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 1440, label: '1 day before' }
  ];

  return (
    <Card elevation={2} sx={{ maxWidth: 800, mx: 'auto', mt: 2, borderRadius: 2 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          ✨ Create New Task
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {/* Title */}
          <TextField
            fullWidth
            label="Task Title"
            value={formData.title}
            onChange={handleChange('title')}
            placeholder="Enter task title..."
            required
            disabled={isLoading}
            sx={{ mb: 3 }}
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            placeholder="Add description (optional)..."
            multiline
            rows={3}
            disabled={isLoading}
            sx={{ mb: 3 }}
          />

          {/* Priority and Category Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={handleChange('priority')}
                  label="Priority"
                  disabled={isLoading}
                >
                  <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
                  <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
                  <MenuItem value={TaskPriority.URGENT}>Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category || ''}
                  onChange={handleChange('category')}
                  label="Category"
                  disabled={isLoading}
                >
                  <MenuItem value="">Select category</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Scheduling Section */}
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            📅 Schedule
          </Typography>
          
          {/* Scheduled Date/Time */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.scheduled_date}
                onChange={handleChange('scheduled_date')}
                disabled={isLoading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={formData.scheduled_time}
                onChange={handleChange('scheduled_time')}
                disabled={isLoading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>

          {/* Due Date/Time */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.due_date}
                onChange={handleChange('due_date')}
                disabled={isLoading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Time"
                type="time"
                value={formData.due_time}
                onChange={handleChange('due_time')}
                disabled={isLoading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>

          {/* Reminder */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Reminder</InputLabel>
            <Select
              value={formData.reminder_time || ''}
              onChange={handleReminderChange}
              label="Reminder"
              disabled={isLoading}
            >
              <MenuItem value="">No reminder</MenuItem>
              {reminderOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Actions */}
          <Divider sx={{ my: 4 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isLoading}
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !formData.title.trim()}
              startIcon={<Add />}
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EnhancedTaskForm;