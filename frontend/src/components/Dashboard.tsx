import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Fab,
  Backdrop,
  Paper,
  Chip,
  Tooltip,
  Skeleton,
  Card,
  CardContent,
  Zoom,
  Slide,
  Fade
} from '@mui/material';
import { 
  Logout, 
  Add, 
  Dashboard as DashboardIcon,
  Assignment,
  TrendingUp
} from '@mui/icons-material';
import { TaskState } from '../types';
import { useTasks, useAuth } from '../hooks/useApi';
import AuthForm from '../components/AuthForm';
import EnhancedTaskForm from '../components/EnhancedTaskForm';
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import AIAssistant from '../components/AIAssistant';
import ReminderService from '../components/ReminderService';

const Dashboard: React.FC = () => {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [currentFilter, setCurrentFilter] = useState<TaskState | undefined>(undefined);
  const { tasks, loading, error, createTask, updateTask, deleteTask, refetch } = useTasks(currentFilter, isAuthenticated);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Local auth state
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Check localStorage directly as backup
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // Watch for auth changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [isAuthenticated]);

  // Calculate task counts by state
  const taskCounts = tasks.reduce((counts, task) => {
    counts[task.state] = (counts[task.state] || 0) + 1;
    return counts;
  }, {} as Record<TaskState, number>);

  // Ensure all states have a count
  Object.values(TaskState).forEach(state => {
    if (!(state in taskCounts)) {
      taskCounts[state] = 0;
    }
  });

  // Handle successful authentication
  const handleAuthSuccess = () => {
    // Update local auth state immediately
    setIsLoggedIn(true);
    // Double-check localStorage
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Authentication successful, token found');
      // Trigger task fetch
      setTimeout(() => {
        refetch();
      }, 100);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
        <AppBar position="static" color="default" elevation={0}>
          <Toolbar>
            <Skeleton variant="text" width={200} height={32} />
            <Box sx={{ flexGrow: 1 }} />
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 1 }} />
            <Skeleton variant="rounded" width={80} height={32} />
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="rounded" width="100%" height={300} sx={{ mb: 4, borderRadius: 3 }} />
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Grid xs={12} md={6} lg={4} key={item}>
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  // Use both authentication states for reliability
  if (!isAuthenticated && !isLoggedIn) {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Enhanced Header with Gradient */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <DashboardIcon sx={{ mr: 2, fontSize: 32, color: 'white' }} />
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: 'white' }}>
                Task Management System
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: -0.5 }}>
                with AI Assistant • {tasks.length} active tasks
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Task Stats Chips */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
              <Tooltip title="Total Tasks">
                <Chip 
                  icon={<Assignment sx={{ fontSize: 18 }} />}
                  label={tasks.length}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                />
              </Tooltip>
              <Tooltip title="Completed Today">
                <Chip
                  icon={<TrendingUp sx={{ fontSize: 18 }} />}
                  label={tasks.filter(t => t.state === TaskState.COMPLETED).length}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                />
              </Tooltip>
            </Box>
            
            <TaskFilters
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              taskCounts={taskCounts}
            />
            
            <Tooltip title="Logout">
              <Button
                variant="outlined"
                size="small"
                onClick={logout}
                startIcon={<Logout />}
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { 
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Logout
              </Button>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Task Creation Backdrop */}
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={showTaskForm}
          onClick={() => setShowTaskForm(false)}
        >
          <Paper
            elevation={24}
            sx={{
              p: 0,
              borderRadius: 3,
              maxWidth: 900,
              width: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <EnhancedTaskForm 
              onSubmit={async (taskData) => { 
                await createTask(
                  taskData.title, 
                  taskData.description,
                  taskData.scheduled_date,
                  taskData.scheduled_time,
                  taskData.due_date,
                  taskData.due_time,
                  taskData.priority,
                  taskData.category,
                  taskData.reminder_time
                );
                setShowTaskForm(false);
              }} 
              onCancel={() => setShowTaskForm(false)}
              isLoading={loading}
            />
          </Paper>
        </Backdrop>

        {/* Tasks Display */}
        <Box>
          {loading ? (
            <Fade in={loading}>
              <Box sx={{ py: 8 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <CircularProgress 
                    size={60} 
                    thickness={4}
                    sx={{
                      color: 'primary.main',
                      '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                      }
                    }}
                  />
                  <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
                    Loading your tasks...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Please wait while we fetch your latest updates
                  </Typography>
                </Box>
                
                {/* Advanced Loading Skeletons */}
                <Grid container spacing={3}>
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <Grid xs={12} md={6} lg={4} key={item}>
                      <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Skeleton variant="rectangular" width={40} height={20} sx={{ borderRadius: 1, mr: 2 }} />
                            <Skeleton variant="circular" width={24} height={24} />
                          </Box>
                          <Skeleton variant="text" sx={{ fontSize: '1.2rem', mb: 1 }} />
                          <Skeleton variant="text" sx={{ mb: 2 }} />
                          <Skeleton variant="text" width="60%" sx={{ mb: 3 }} />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Skeleton variant="rounded" width={60} height={32} />
                            <Skeleton variant="rounded" width={60} height={32} />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Fade>
          ) : error ? (
            <Alert 
              severity="error" 
              action={
                <Button color="inherit" size="small" onClick={refetch}>
                  RETRY
                </Button>
              }
            >
              <Typography variant="subtitle2">Error loading tasks</Typography>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          ) : tasks.length === 0 ? (
            <Fade in={!loading}>
              <Paper 
                elevation={0} 
                sx={{ 
                  textAlign: 'center', 
                  py: 12, 
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  borderRadius: 4,
                  border: '2px dashed',
                  borderColor: 'grey.300'
                }}
              >
                <Box sx={{ mb: 4 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '6rem', 
                      mb: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                  >
                    📝
                  </Typography>
                  
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                    {currentFilter ? `No ${currentFilter.toLowerCase()} tasks` : 'Welcome to Your Task Hub!'}
                  </Typography>
                  
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                    {currentFilter
                      ? `You don't have any tasks in "${currentFilter}" state. Try switching filters or create a new task.`
                      : 'Start organizing your day by creating your first task. Use the floating action button or ask the AI assistant for help!'
                    }
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {!currentFilter && (
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<Add />}
                        onClick={() => setShowTaskForm(true)}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          py: 1.5,
                          px: 4,
                          borderRadius: 3,
                          textTransform: 'none',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25)'
                          },
                          transition: 'all 0.3s ease-in-out'
                        }}
                      >
                        Create Your First Task
                      </Button>
                    )}
                    
                    {currentFilter && (
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => setCurrentFilter(undefined)}
                        sx={{
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          py: 1.5,
                          px: 4,
                          borderRadius: 3,
                          textTransform: 'none',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25)'
                          },
                          transition: 'all 0.3s ease-in-out'
                        }}
                      >
                        View All Tasks
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Fade>
          ) : (
            <Fade in={!loading} timeout={600}>
              <Box>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 3, 
                    mb: 3, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Assignment sx={{ fontSize: 28, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {currentFilter ? `${currentFilter} Tasks` : 'All Tasks'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • 
                          {currentFilter ? ` Filtered by ${currentFilter}` : ' Complete overview'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={`Total: ${tasks.length}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                      {tasks.filter(t => t.state === TaskState.COMPLETED).length > 0 && (
                        <Chip
                          label={`Completed: ${tasks.filter(t => t.state === TaskState.COMPLETED).length}`}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                </Paper>
                
                <Grid container spacing={3}>
                  {tasks.map((task, index) => (
                    <Grid xs={12} md={6} lg={4} key={task.id}>
                      <Slide 
                        direction="up" 
                        in={!loading} 
                        timeout={300 + (index * 100)}
                        style={{ transitionDelay: `${index * 50}ms` }}
                      >
                        <div>
                          <TaskCard
                            task={task}
                            onUpdate={async (id, updates) => { await updateTask(id, updates); }}
                            onDelete={deleteTask}
                          />
                        </div>
                      </Slide>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Fade>
          )}
        </Box>
      </Container>

      {/* Floating Action Button */}
      <Zoom in={!showTaskForm}>
        <Fab
          color="primary"
          aria-label="add task"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease-in-out',
            zIndex: 1000
          }}
          onClick={() => {
            setShowTaskForm(true);
          }}
        >
          <Add sx={{ fontSize: 32 }} />
        </Fab>
      </Zoom>

      {/* AI Assistant */}
      <AIAssistant onTasksUpdate={refetch} />

      {/* Reminder Service */}
      <ReminderService tasks={tasks} />

      {/* Enhanced Footer */}
      <Paper 
        component="footer" 
        elevation={8}
        sx={{ 
          bgcolor: 'white',
          mt: 8,
          borderTop: '4px solid',
          borderImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) 1'
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
              Day Planner with AI Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Built with React + FastAPI + Gemini AI • Material-UI Design System
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Chip size="small" label="React" color="primary" variant="outlined" />
              <Chip size="small" label="FastAPI" color="secondary" variant="outlined" />
              <Chip size="small" label="Material-UI" color="primary" variant="outlined" />
              <Chip size="small" label="AI Powered" color="secondary" variant="outlined" />
            </Box>
          </Box>
        </Container>
      </Paper>
    </Box>
  );
};

export default Dashboard;