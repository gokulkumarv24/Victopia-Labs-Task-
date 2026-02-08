import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  Button,
  Chip,
  Fade,
  Zoom,
  CircularProgress,
  Tooltip,
  Backdrop
} from '@mui/material';
import {
  Chat,
  Close,
  Send,
  SmartToy,
  CheckCircle,
  Schedule,
  Assignment
} from '@mui/icons-material';
import { tasksApi } from '../services/api';
import { AICommandResponse, TaskState } from '../types';

interface AIAssistantProps {
  onTasksUpdate: () => void;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  response?: AICommandResponse;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onTasksUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hi! I'm your AI assistant. I can help you manage your tasks using natural language. Try saying things like:\n\n• \"Add a task to prepare presentation\"\n• \"Start working on presentation task\"\n• \"Mark presentation task as completed\"\n• \"Show all completed tasks\"",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await tasksApi.processAICommand({ command: input.trim() });
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
        response
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Refresh tasks if the command was successful
      if (response.success) {
        // Add a small delay to ensure backend transaction is committed
        setTimeout(() => {
          console.log('AI Assistant: Refreshing tasks after successful command');
          onTasksUpdate();
        }, 500);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error: ${error.response?.data?.detail || error.message}`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* AI Assistant Button */}
      <Zoom in={true}>
        <Tooltip title="AI Assistant" placement="left">
          <IconButton
            onClick={() => setIsOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 100,
              left: 24,
              bgcolor: 'secondary.main',
              color: 'white',
              width: 56,
              height: 56,
              boxShadow: 3,
              '&:hover': {
                bgcolor: 'secondary.dark',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease-in-out',
              zIndex: 1000
            }}
          >
            <Chat sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>
      </Zoom>

      {/* Chat Interface */}
      <Backdrop
        open={isOpen}
        onClick={() => setIsOpen(false)}
        sx={{ zIndex: 1300 }}
      >
        <Fade in={isOpen}>
          <Paper
            elevation={24}
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: 'fixed',
              bottom: 100,
              left: 24,
              width: 400,
              maxWidth: '90vw',
              height: 500,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <Box sx={{ 
              p: 2, 
              bgcolor: 'secondary.main', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToy sx={{ fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI Task Assistant
                </Typography>
              </Box>
              <IconButton 
                size="small" 
                onClick={() => setIsOpen(false)}
                sx={{ color: 'white' }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Messages */}
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto', 
              p: 2,
              bgcolor: 'grey.50'
            }}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      maxWidth: '80%',
                      p: 2,
                      bgcolor: message.isUser ? 'secondary.main' : 'white',
                      color: message.isUser ? 'white' : 'text.primary',
                      borderRadius: 2,
                      '& .MuiTypography-root': {
                        color: message.isUser ? 'white' : 'text.primary'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                      {message.text}
                    </Typography>
                    
                    {message.response?.tasks && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ 
                          opacity: 0.8, 
                          mb: 1, 
                          display: 'block',
                          fontWeight: 600
                        }}>
                          📋 Tasks:
                        </Typography>
                        {message.response.tasks.slice(0, 3).map((task) => (
                          <Box key={task.id} sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 0.5,
                            p: 1,
                            bgcolor: message.isUser ? 'rgba(255,255,255,0.1)' : 'grey.50',
                            borderRadius: 1
                          }}>
                            {task.state === TaskState.COMPLETED ? (
                              <CheckCircle sx={{ fontSize: 16, color: message.isUser ? 'white' : 'success.main' }} />
                            ) : task.state === TaskState.IN_PROGRESS ? (
                              <Schedule sx={{ fontSize: 16, color: message.isUser ? 'white' : 'warning.main' }} />
                            ) : (
                              <Assignment sx={{ fontSize: 16, color: message.isUser ? 'white' : 'text.secondary' }} />
                            )}
                            <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                              {task.title}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={task.priority} 
                              sx={{ 
                                height: 16, 
                                fontSize: '0.6rem',
                                bgcolor: message.isUser ? 'rgba(255,255,255,0.2)' : 'grey.200',
                                color: message.isUser ? 'white' : 'text.secondary'
                              }} 
                            />
                          </Box>
                        ))}
                        {message.response.tasks.length > 3 && (
                          <Typography variant="caption" sx={{ opacity: 0.7, fontStyle: 'italic' }}>
                            +{message.response.tasks.length - 3} more tasks
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    <Typography variant="caption" sx={{ 
                      opacity: 0.7, 
                      mt: 1, 
                      display: 'block',
                      fontSize: '0.7rem'
                    }}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} thickness={4} />
                      <Typography variant="body2" color="text.secondary">
                        AI is thinking...
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box component="form" onSubmit={handleSubmit} sx={{ 
              p: 2, 
              borderTop: 1, 
              borderColor: 'grey.200',
              bgcolor: 'white'
            }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about your tasks..."
                  disabled={loading}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !input.trim()}
                  endIcon={<Send />}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    borderRadius: 2
                  }}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Backdrop>
    </>
  );
};

export default AIAssistant;