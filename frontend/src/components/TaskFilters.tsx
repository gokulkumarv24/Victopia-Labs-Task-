import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Badge,
  Typography,
  Chip,
  ListItemIcon,
  ListItemText,
  Fade,
  Tooltip
} from '@mui/material';
import {
  FilterList,
  KeyboardArrowDown,
  RadioButtonUnchecked,
  PlayArrow,
  CheckCircle,
  AllInclusive
} from '@mui/icons-material';
import { TaskState } from '../types';

interface TaskFiltersProps {
  currentFilter: TaskState | undefined;
  onFilterChange: (filter: TaskState | undefined) => void;
  taskCounts: Record<TaskState, number>;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ 
  currentFilter, 
  onFilterChange, 
  taskCounts 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFilterSelect = (filter: TaskState | undefined) => {
    onFilterChange(filter);
    handleClose();
  };

  const getStateIcon = (state: TaskState | undefined) => {
    switch (state) {
      case TaskState.NOT_STARTED:
        return <RadioButtonUnchecked />;
      case TaskState.IN_PROGRESS:
        return <PlayArrow />;
      case TaskState.COMPLETED:
        return <CheckCircle />;
      default:
        return <AllInclusive />;
    }
  };

  const getStateGradient = (state: TaskState | undefined) => {
    switch (state) {
      case TaskState.NOT_STARTED:
        return 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)';
      case TaskState.IN_PROGRESS:
        return 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
      case TaskState.COMPLETED:
        return 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)';
      default:
        return 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)';
    }
  };

  const filterOptions = [
    { 
      label: 'All Tasks', 
      value: undefined, 
      count: Object.values(taskCounts).reduce((a, b) => a + b, 0),
      description: 'View all tasks'
    },
    { 
      label: 'Not Started', 
      value: TaskState.NOT_STARTED, 
      count: taskCounts[TaskState.NOT_STARTED],
      description: 'Tasks ready to begin'
    },
    { 
      label: 'In Progress', 
      value: TaskState.IN_PROGRESS, 
      count: taskCounts[TaskState.IN_PROGRESS],
      description: 'Currently active tasks'
    },
    { 
      label: 'Completed', 
      value: TaskState.COMPLETED, 
      count: taskCounts[TaskState.COMPLETED],
      description: 'Finished tasks'
    },
  ];

  const currentOption = filterOptions.find(option => option.value === currentFilter) || filterOptions[0];
  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  return (
    <Box sx={{ position: 'relative' }}>
      <Tooltip title="Filter tasks by status" arrow>
        <Button
          variant="contained"
          onClick={handleClick}
          endIcon={<KeyboardArrowDown sx={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out'
          }} />}
          startIcon={<FilterList />}
          sx={{
            background: getStateGradient(currentFilter),
            borderRadius: 3,
            px: 3,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)'
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {currentOption.label}
            </Typography>
            <Badge
              badgeContent={currentOption.count}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: 'text.primary',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }
              }}
            />
          </Box>
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        TransitionComponent={Fade}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{
          elevation: 12,
          sx: {
            mt: 1,
            borderRadius: 3,
            minWidth: 280,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid',
            borderColor: 'divider',
            '& .MuiMenuItem-root': {
              borderRadius: 2,
              mx: 1,
              my: 0.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateX(4px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }
            }
          }
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Filter Tasks
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {totalTasks} total tasks
          </Typography>
        </Box>

        {filterOptions.map((option) => (
          <MenuItem
            key={option.label}
            onClick={() => handleFilterSelect(option.value)}
            selected={option.value === currentFilter}
            sx={{
              py: 1.5,
              background: option.value === currentFilter 
                ? `${getStateGradient(option.value)} !important`
                : 'transparent',
              color: option.value === currentFilter ? 'white' : 'text.primary',
              '&.Mui-selected': {
                '& .MuiListItemIcon-root': {
                  color: 'white'
                },
                '& .MuiTypography-root': {
                  color: 'white'
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {getStateIcon(option.value)}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {option.label}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      opacity: 0.8,
                      color: option.value === currentFilter ? 'inherit' : 'text.secondary'
                    }}>
                      {option.description}
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={option.count}
                    size="small"
                    sx={{
                      backgroundColor: option.value === currentFilter 
                        ? 'rgba(255,255,255,0.9)'
                        : getStateGradient(option.value),
                      color: option.value === currentFilter 
                        ? 'text.primary'
                        : 'white',
                      fontWeight: 600,
                      minWidth: 32
                    }}
                  />
                </Box>
              }
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default TaskFilters;