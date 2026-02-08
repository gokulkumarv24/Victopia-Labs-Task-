import React, { useEffect, useState } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  IconButton,
  Typography,
  Chip,
  Paper,
  Fade,
  Tooltip
} from '@mui/material';
import {
  NotificationsActive,
  NotificationsOff,
  Close,
  Schedule
} from '@mui/icons-material';
import { Task } from '../types';

interface ReminderServiceProps {
  tasks: Task[];
}

interface NotificationStatus {
  permission: NotificationPermission;
  isSupported: boolean;
}

const ReminderService: React.FC<ReminderServiceProps> = ({ tasks }) => {
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>({
    permission: 'default',
    isSupported: false
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);

  // Simple notification function to replace missing showInAppNotification
  const showInAppNotification = (message: string, type: 'success' | 'error' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // Update notification status
  useEffect(() => {
    const updateStatus = () => {
      if ('Notification' in window) {
        setNotificationStatus({
          permission: Notification.permission,
          isSupported: true
        });
      } else {
        setNotificationStatus({
          permission: 'denied',
          isSupported: false
        });
      }
    };

    updateStatus();
    
    // Listen for permission changes
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Main reminder checking logic
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      console.log('🔍 Checking reminders at:', now.toLocaleTimeString());
      console.log('📋 Tasks to check:', tasks.length);
      
      tasks.forEach(task => {
        console.log(`🔍 Checking task: ${task.title}`);
        console.log(`📅 Due date: ${task.due_date}, Due time: ${task.due_time}, Reminder: ${task.reminder_time}min`);
        
        if (!task.due_date || !task.due_time || !task.reminder_time) {
          console.log(`⚠️ Missing data for task ${task.title}`);
          return;
        }
        
        try {
          // Combine due date and time
          const dueDateTime = new Date(`${task.due_date}T${task.due_time}`);
          const reminderTime = new Date(dueDateTime.getTime() - (task.reminder_time * 60 * 1000));
          
          console.log(`⏰ Task: ${task.title}`);
          console.log(`📅 Due: ${dueDateTime.toLocaleString()}`);
          console.log(`🔔 Reminder: ${reminderTime.toLocaleString()}`);
          console.log(`🕐 Current: ${now.toLocaleString()}`);
          
          // Check if we should show reminder (within next 5 minutes for testing)
          const timeDiff = reminderTime.getTime() - now.getTime();
          const timeDiffMinutes = timeDiff / (1000 * 60);
          
          console.log(`⏱️ Time until reminder: ${timeDiffMinutes.toFixed(1)} minutes`);
          
          // Show reminder if it's time (within next 5 minutes) OR if it's overdue by up to 1 hour
          const shouldNotify = (timeDiff > 0 && timeDiff < 300000) || // Next 5 minutes
                              (timeDiff < 0 && Math.abs(timeDiff) < 3600000); // Up to 1 hour overdue
          
          console.log(`🔔 Should notify: ${shouldNotify}`);
          
          // Prevent duplicate notifications within 2 minutes
          const currentTime = now.getTime();
          const timeSinceLastNotification = currentTime - lastNotificationTime;
          
          console.log(`⏳ Time since last notification: ${(timeSinceLastNotification / 60000).toFixed(1)} minutes`);
          
          if (shouldNotify && timeSinceLastNotification > 120000) { // 2 minutes
            console.log(`🚨 TRIGGERING NOTIFICATION for ${task.title}`);
            showNotification(task);
            setLastNotificationTime(currentTime);
          }
        } catch (error) {
          console.error('❌ Error processing reminder for task:', task.title, error);
        }
      });
    };
    
    const showNotification = async (task: Task) => {
      console.log('🔔 showNotification called for:', task.title);
      console.log('📱 Notification support:', notificationStatus.isSupported);
      console.log('🔐 Permission status:', notificationStatus.permission);
      
      if (!notificationStatus.isSupported) {
        console.log('⚠️ Browser notifications not supported, showing in-app notification');
        showInAppNotification(`⏰ Reminder: ${task.title}`, 'error');
        return;
      }

      // Request permission if needed
      if (notificationStatus.permission === 'default') {
        console.log('🔐 Requesting notification permission...');
        try {
          const permission = await Notification.requestPermission();
          console.log('🔐 Permission result:', permission);
          setNotificationStatus(prev => ({ ...prev, permission }));
          
          if (permission === 'granted') {
            createNotification(task);
          } else {
            console.log('❌ Permission denied, showing fallback notification');
            showInAppNotification(`⏰ Reminder: ${task.title} (Browser notifications blocked)`, 'warning');
          }
        } catch (error) {
          console.error('❌ Error requesting permission:', error);
          showInAppNotification(`⏰ Reminder: ${task.title} (Error requesting permission)`, 'error');
        }
      } else if (notificationStatus.permission === 'granted') {
        console.log('✅ Permission granted, creating notification');
        createNotification(task);
      } else {
        console.log('🚫 Notifications blocked, showing fallback');
        // Fallback to in-app notification
        showInAppNotification(`⏰ Reminder: ${task.title} (Notifications blocked - enable in browser settings)`, 'info');
      }
    };
    
    // Test notification function (call from console)
    (window as any).testNotification = () => {
      console.log('🧪 Testing notification system...');
      const testTask = {
        id: 9999,
        title: 'Test Notification',
        description: 'This is a test notification',
        due_time: new Date().toLocaleTimeString(),
        reminder_time: 1
      } as Task;
      showNotification(testTask);
    };
    
    // Add to window for debugging
    (window as any).reminderDebug = {
      tasks,
      notificationStatus,
      checkReminders,
      testNotification: () => (window as any).testNotification()
    };
    
    const createNotification = (task: Task) => {
      console.log('🚀 Creating notification for:', task.title);
      try {
        const notificationBody = `${task.title}${task.due_time ? ` - Due at ${task.due_time}` : ''}${task.description ? `\n${task.description}` : ''}`;
        console.log('📝 Notification body:', notificationBody);
        
        const notification = new Notification('⏰ Task Reminder', {
          body: notificationBody,
          icon: '/favicon.ico',
          tag: `task-${task.id}-${Date.now()}`, // Unique tag with timestamp
          requireInteraction: true,
          badge: '/favicon.ico',
          silent: false
        });
        
        console.log('✅ Browser notification created successfully');
        
        notification.onclick = () => {
          console.log('🖱️ Notification clicked');
          window.focus();
          notification.close();
        };
        
        notification.onshow = () => {
          console.log('👁️ Notification shown to user');
        };
        
        notification.onerror = (error) => {
          console.error('❌ Notification error:', error);
        };
        
        // Auto close after 15 seconds
        setTimeout(() => {
          try {
            notification.close();
            console.log('⏰ Notification auto-closed after 15 seconds');
          } catch (e) {
            console.log('ℹ️ Notification was already closed');
          }
        }, 15000);

        // Show success feedback
        showInAppNotification(`✅ Reminder sent for: ${task.title}`, 'success');
      } catch (error) {
        console.error('Failed to create notification:', error);
        showInAppNotification(`⏰ Reminder: ${task.title}`, 'error');
      }
    };

    const showInAppNotification = (message: string, severity: 'success' | 'info' | 'warning' | 'error') => {
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    };
    
    // Check reminders every 10 seconds for better responsiveness
    const interval = setInterval(checkReminders, 10000);
    
    // Initial check after a short delay
    const initialTimeout = setTimeout(checkReminders, 1000);
    
    console.log('🕐 Reminder service started - checking every 10 seconds');
    
    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [tasks, notificationStatus, lastNotificationTime]);
  
  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Don't request immediately, let user discover the feature
      console.log('Browser notifications are available but not enabled. User can enable them anytime.');
    }
  }, []);

  const getStatusIcon = () => {
    if (!notificationStatus.isSupported) {
      return <NotificationsOff color="error" />;
    }
    
    switch (notificationStatus.permission) {
      case 'granted':
        return <NotificationsActive color="success" />;
      case 'denied':
        return <NotificationsOff color="error" />;
      default:
        return <Schedule color="warning" />;
    }
  };

  const getStatusText = () => {
    if (!notificationStatus.isSupported) {
      return 'Not supported';
    }
    
    switch (notificationStatus.permission) {
      case 'granted':
        return 'Active';
      case 'denied':
        return 'Blocked';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = () => {
    if (!notificationStatus.isSupported) {
      return 'error';
    }
    
    switch (notificationStatus.permission) {
      case 'granted':
        return 'success';
      case 'denied':
        return 'error';
      default:
        return 'warning';
    }
  };

  const handleRequestPermission = async () => {
    if ('Notification' in window && notificationStatus.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationStatus(prev => ({ ...prev, permission }));
        
        if (permission === 'granted') {
          showInAppNotification('✅ Notifications enabled successfully!', 'success');
        } else {
          showInAppNotification('❌ Notifications blocked. You can enable them in browser settings.', 'warning');
        }
      } catch (error) {
        showInAppNotification('❌ Failed to enable notifications.', 'error');
      }
    }
  };

  return (
    <>
      {/* Debug Panel - Only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <Fade in timeout={500}>
          <Paper
            elevation={3}
            sx={{
              position: 'fixed',
              top: 80,
              right: 16,
              zIndex: 1000,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '1px solid',
              borderColor: 'divider',
              minWidth: 280
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              🔧 Reminder Debug Panel
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Notification Status" arrow>
                  <IconButton size="small">
                    {getStatusIcon()}
                  </IconButton>
                </Tooltip>
                
                <Chip
                  size="small"
                  label={getStatusText()}
                  color={getStatusColor() as any}
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                />
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                Tasks with reminders: {tasks.filter(t => t.due_date && t.due_time && t.reminder_time).length}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <button
                  onClick={() => (window as any).testNotification()}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#f5f5f5',
                    cursor: 'pointer'
                  }}
                >
                  🧪 Test Notification
                </button>
                
                <button
                  onClick={() => console.log('📊 Debug info:', (window as any).reminderDebug)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#f5f5f5',
                    cursor: 'pointer'
                  }}
                >
                  📊 Log Debug
                </button>
              </Box>
            </Box>
          </Paper>
        </Fade>
      )}

      {/* In-app Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="info"
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': {
              fontSize: 24
            }
          }}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setSnackbarOpen(false)}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {snackbarMessage}
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReminderService;