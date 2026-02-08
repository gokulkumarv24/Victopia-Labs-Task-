import re
import json
import logging
from typing import Dict, Any, List, Optional
from app.services.task_service import TaskService, TaskStateService
from app.schemas.task import TaskCreate, TaskUpdate, TaskState, AICommandResponse, TaskResponse
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import google.genai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    logger.warning("Google Genai not available. AI features will use fallback parsing.")
    GEMINI_AVAILABLE = False


class AIService:
    """
    AI service for natural language command interpretation.
    
    IMPORTANT: This service ONLY interprets user intent and converts it to structured actions.
    It does NOT contain business logic and CANNOT bypass validation or state checks.
    All actual operations are performed through TaskService.
    """
    
    def __init__(self, task_service: TaskService):
        self.task_service = task_service
        self.gemini_client = None
        
        # Initialize Gemini if available and configured
        if GEMINI_AVAILABLE and settings.GEMINI_API_KEY:
            try:
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Gemini AI initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini AI: {e}")
                self.gemini_client = None
    
    async def process_command(self, command: str, user_id: int) -> AICommandResponse:
        """
        Process a natural language command and execute the corresponding action.
        
        This method:
        1. Interprets the user's intent
        2. Extracts relevant parameters
        3. Calls the appropriate TaskService method
        4. Returns the result
        
        It does NOT contain business logic or bypass validation.
        """
        try:
            # Parse the command to understand intent
            parsed_command = await self._parse_command(command)
            
            # Execute the action through TaskService (never bypass this!)
            result = await self._execute_action(parsed_command, user_id)
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing command '{command}': {e}")
            return AICommandResponse(
                success=False,
                message=f"Sorry, I couldn't process that command: {str(e)}"
            )
    
    async def _parse_command(self, command: str) -> Dict[str, Any]:
        """
        Parse natural language command into structured action.
        Uses Gemini AI if available, otherwise falls back to pattern matching.
        """
        if self.gemini_client:
            return await self._parse_with_gemini(command)
        else:
            return self._parse_with_patterns(command)
    
    async def _parse_with_gemini(self, command: str) -> Dict[str, Any]:
        """Parse command using Gemini AI"""
        from datetime import datetime, timedelta
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        
        prompt = f"""
        You are a personal day planner assistant. Parse this task management command into a JSON structure. 
        Today's date is {today}.

        The system supports these actions:
        - create: Create a new task with scheduling
        - update_state: Change task state (Not Started -> In Progress -> Completed)
        - update_task: Update task details including schedule
        - delete: Delete a task  
        - list: Show tasks (optionally filtered by state, date, or category)
        - chat: Respond conversationally for greetings, help, or general questions

        Available states: "Not Started", "In Progress", "Completed"
        Available priorities: "LOW", "MEDIUM", "HIGH", "URGENT" (always uppercase)
        
        For dates, convert relative terms to actual dates:
        - "today" -> "{today}"
        - "tomorrow" -> "{tomorrow}"
        - For specific dates like "Monday", "next Friday", calculate the actual date
        - Use format YYYY-MM-DD (example: "2026-02-08")
        
        For times, use 24-hour format HH:MM (example: "15:00" for 3 PM)
        
        Examples:
        - "Schedule meeting tomorrow at 3pm" -> {{"action": "create", "task_title": "meeting", "due_date": "{tomorrow}", "due_time": "15:00"}}
        - "Remind me to call John today" -> {{"action": "create", "task_title": "call John", "due_date": "{today}"}}
        - "Add high priority work task for next Monday" -> {{"action": "create", "task_title": "work task", "priority": "HIGH", "category": "Work"}}

        Command: "{command}"
        
        IMPORTANT: 
        - For dates, use ACTUAL dates like "{today}" or "{tomorrow}", NOT format strings like "YYYY-MM-DD"
        - For times, use actual times like "15:00", NOT format strings like "HH:MM"
        - Only include fields that are relevant to the command
        
        Respond with JSON only:
        {{
            "action": "create|update_state|update_task|delete|list|chat",
            "task_title": "title if creating or identifying task",
            "scheduled_date": "actual date like {today} if scheduling start date",
            "scheduled_time": "actual time like 15:00 if scheduling start time", 
            "due_date": "actual date like {today} if setting due date",
            "due_time": "actual time like 15:00 if setting due time",
            "reminder_time": 15,
            "priority": "LOW|MEDIUM|HIGH|URGENT",
            "category": "Work|Personal|Study|Health|Finance|Shopping|Travel|Social|Household|Other",
            "new_state": "state if updating state",
            "new_title": "new title if updating task",
            "new_description": "new description if updating task",
            "date_filter": "actual date if filtering by date",
            "state_filter": "state if filtering list",
            "category_filter": "category if filtering by category",
            "message": "conversational response for chat action",
            "confidence": 0.8
        }}
        """
        
        try:
            response = await self.gemini_client.aio.models.generate_content(
                model="gemini-flash-latest",
                contents=prompt
            )
            
            # Extract JSON from response
            json_text = response.text.strip()
            if json_text.startswith('```json'):
                json_text = json_text[7:-3]
            elif json_text.startswith('```'):
                json_text = json_text[3:-3]
            
            parsed_result = json.loads(json_text)
            
            # Normalize the parsed result to ensure proper formatting
            parsed_result = self._normalize_parsed_command(parsed_result)
            
            return parsed_result
        except Exception as e:
            logger.error(f"Gemini parsing failed: {e}")
            # Fallback to pattern matching
            fallback_result = self._parse_with_patterns(command)
            return self._normalize_parsed_command(fallback_result)
    
    def _normalize_parsed_command(self, parsed_command: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize a parsed command to ensure proper formatting for validation.
        This handles priority case conversion and date format conversion.
        """
        from datetime import datetime, timedelta
        import re
        
        # Log the parsed command for debugging
        logger.info(f"Normalizing parsed command: {parsed_command}")
        
        # Normalize priority to uppercase
        if "priority" in parsed_command and parsed_command["priority"]:
            priority_map = {
                "low": "LOW",
                "medium": "MEDIUM", 
                "high": "HIGH",
                "urgent": "URGENT"
            }
            priority_value = str(parsed_command["priority"]).lower()
            if priority_value in priority_map:
                parsed_command["priority"] = priority_map[priority_value]
        
        # Normalize dates
        today = datetime.now().date()
        
        # Helper function to convert date strings to proper format
        def normalize_date_field(date_value):
            if not date_value:
                return None
                
            date_str = str(date_value).lower().strip()
            # Remove brackets
            date_str = re.sub(r'[\[\]]', '', date_str)
            
            # Handle format strings that AI might return
            if date_str in ["yyyy-mm-dd", "yyyy/mm/dd", "[yyyy-mm-dd]"]:
                logger.warning(f"AI returned format string instead of actual date: {date_str}")
                return None
            
            # Handle relative date terms
            if date_str in ["today", "[today]"]:
                return str(today)
            elif date_str in ["tomorrow", "[tomorrow]"]:
                return str(today + timedelta(days=1))
            elif date_str in ["yesterday", "[yesterday]"]:
                return str(today - timedelta(days=1))
            elif "next week" in date_str:
                return str(today + timedelta(days=7))
            elif "next month" in date_str:
                return str(today + timedelta(days=30))
            
            # If it's already a proper date format, keep it
            try:
                # Try to parse it to validate format
                datetime.strptime(date_str, "%Y-%m-%d")
                return date_str
            except ValueError:
                logger.warning(f"Could not parse date: {date_str}")
                return None
        
        # Handle scheduled_date
        if "scheduled_date" in parsed_command:
            normalized_date = normalize_date_field(parsed_command["scheduled_date"])
            if normalized_date:
                parsed_command["scheduled_date"] = normalized_date
            else:
                # Remove invalid date field
                parsed_command.pop("scheduled_date", None)
        
        # Handle due_date
        if "due_date" in parsed_command:
            normalized_date = normalize_date_field(parsed_command["due_date"])
            if normalized_date:
                parsed_command["due_date"] = normalized_date
            else:
                # Remove invalid date field
                parsed_command.pop("due_date", None)
                
        # Handle date_filter for list commands
        if "date_filter" in parsed_command:
            normalized_date = normalize_date_field(parsed_command["date_filter"])
            if normalized_date:
                parsed_command["date_filter"] = normalized_date
            else:
                # Remove invalid date field
                parsed_command.pop("date_filter", None)
        
        # Normalize times - handle format strings
        def normalize_time_field(time_value):
            if not time_value:
                return None
                
            time_str = str(time_value).lower().strip()
            
            # Handle format strings that AI might return
            if time_str in ["hh:mm", "hh:mm:ss", "[hh:mm]"]:
                logger.warning(f"AI returned time format string instead of actual time: {time_str}")
                return None
                
            # Handle common time terms
            time_mappings = {
                "morning": "09:00",
                "afternoon": "14:00", 
                "evening": "18:00",
                "night": "20:00",
                "noon": "12:00",
                "midnight": "00:00"
            }
            
            if time_str in time_mappings:
                return time_mappings[time_str]
                
            # If it looks like a valid time, keep it
            if re.match(r'^\d{1,2}:\d{2}$', time_str):
                return time_str
                
            logger.warning(f"Could not parse time: {time_str}")
            return None
        
        # Handle scheduled_time
        if "scheduled_time" in parsed_command:
            normalized_time = normalize_time_field(parsed_command["scheduled_time"])
            if normalized_time:
                parsed_command["scheduled_time"] = normalized_time
            else:
                parsed_command.pop("scheduled_time", None)
        
        # Handle due_time
        if "due_time" in parsed_command:
            normalized_time = normalize_time_field(parsed_command["due_time"])
            if normalized_time:
                parsed_command["due_time"] = normalized_time
            else:
                parsed_command.pop("due_time", None)
        
        # Log the normalized result
        logger.info(f"Normalized result: {parsed_command}")
        
        return parsed_command
    
    def _parse_with_patterns(self, command: str) -> Dict[str, Any]:
        """Enhanced pattern-based command parsing for day planner functionality"""
        import re
        from datetime import datetime, timedelta
        
        command_lower = command.lower().strip()
        
        # Handle conversational greetings and general queries first
        greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]
        if command_lower in greetings:
            return {"action": "chat", "message": "greeting", "confidence": 0.9}
        
        help_words = ["help", "what can you do", "how do you work", "commands"]
        if any(word in command_lower for word in help_words):
            return {"action": "chat", "message": "help", "confidence": 0.9}
        
        # Time extraction patterns for day planner
        time_patterns = [
            (r'(\d{1,2}):(\d{2})\s*(am|pm)?', 'specific_time'),
            (r'(\d{1,2})\s*(am|pm)', 'hour_ampm'),
            (r'morning', '09:00'),
            (r'afternoon', '14:00'), 
            (r'evening', '18:00'),
            (r'night', '20:00')
        ]
        
        # Schedule/appointment keywords - enhanced for day planning
        if any(word in command_lower for word in ["schedule", "plan", "appointment", "meeting", "remind", "at", "on", "book"]):
            result = {"action": "create", "confidence": 0.8}
            
            # Extract title with better patterns
            title_patterns = [
                r'(?:schedule|plan|book) (.+?) (?:at|on|for|tomorrow|today)',
                r'remind me to (.+?)(?:\s+at|\s+on|\s+for|\s+tomorrow|\s+today|$)',
                r'(?:schedule|plan|remind me to|book) (.+)'
            ]
            
            for pattern in title_patterns:
                match = re.search(pattern, command_lower)
                if match:
                    title = match.group(1).strip()
                    result["task_title"] = title
                    break
                    
            if not result.get("task_title"):
                # Fallback: remove scheduling words
                title = re.sub(r'\b(schedule|plan|remind me to|book|at|on|for)\b', '', command_lower).strip()
                result["task_title"] = title or "Scheduled task"
            
            # Extract time
            for pattern, time_type in time_patterns:
                match = re.search(pattern, command_lower)
                if match:
                    if time_type == 'specific_time':
                        hour, minute = int(match.group(1)), int(match.group(2))
                        ampm = match.group(3)
                        if ampm == 'pm' and hour < 12:
                            hour += 12
                        elif ampm == 'am' and hour == 12:
                            hour = 0
                        result["due_time"] = f"{hour:02d}:{minute:02d}"
                    elif time_type == 'hour_ampm':
                        hour = int(match.group(1))
                        ampm = match.group(2)
                        if ampm == 'pm' and hour < 12:
                            hour += 12
                        elif ampm == 'am' and hour == 12:
                            hour = 0
                        result["due_time"] = f"{hour:02d}:00"
                    else:
                        result["due_time"] = time_type
                    break
            
            # Extract date
            today = datetime.now().date()
            if "today" in command_lower:
                result["due_date"] = str(today)
            elif "tomorrow" in command_lower:
                result["due_date"] = str(today + timedelta(days=1))
            
            # Set priority based on urgency words
            if any(word in command_lower for word in ["urgent", "asap", "immediately"]):
                result["priority"] = "URGENT"
            elif any(word in command_lower for word in ["important", "high"]):
                result["priority"] = "HIGH"
            elif any(word in command_lower for word in ["low", "minor"]):
                result["priority"] = "LOW"
            else:
                result["priority"] = "MEDIUM"  # Default priority
                
            # Set reminders for scheduled items
            if "remind" in command_lower:
                result["reminder_time"] = 15  # default 15 minutes
                        
            return result
            
        # Enhanced show/list patterns for day planner
        if any(word in command_lower for word in ["show", "list", "what's", "schedule", "agenda", "today", "tomorrow", "view"]):
            result = {"action": "list", "confidence": 0.8}
            
            # Date filters
            today = datetime.now().date()
            if any(phrase in command_lower for phrase in ["today", "today's"]):
                result["date_filter"] = str(today)
            elif any(phrase in command_lower for phrase in ["tomorrow", "tomorrow's"]):
                result["date_filter"] = str(today + timedelta(days=1))
                
            # State filters
            if "completed" in command_lower:
                result["state_filter"] = "Completed"
            elif "progress" in command_lower:
                result["state_filter"] = "In Progress"
            elif "pending" in command_lower or "not started" in command_lower:
                result["state_filter"] = "Not Started"
                
            return result

        # Handle general conversation that doesn't contain task keywords
        task_keywords = ["add", "create", "new", "make", "start", "begin", "complete", "finish", "done", "delete", "remove", "show", "list", "view", "see", "task", "todo", "schedule", "plan"]
        if not any(keyword in command_lower for keyword in task_keywords):
            return {"action": "chat", "message": "general", "confidence": 0.8}
        
        # Create task patterns (only when explicitly mentioned)
        create_patterns = [
            r"(?:add|create|new|make)\s+(?:a\s+)?(?:task\s+)?(?:to\s+)?(.+)",
            r"(.+)\s+(?:task|todo)",
        ]
        
        for pattern in create_patterns:
            match = re.search(pattern, command_lower)
            if match and any(word in command_lower for word in ["add", "create", "new", "make"]):
                return {
                    "action": "create",
                    "task_title": match.group(1).strip(),
                    "confidence": 0.8
                }
        
        # State update patterns
        if any(word in command_lower for word in ["start", "begin", "working"]):
            task_match = re.search(r"(?:start|begin|working on)\s+(.+?)(?:\s+task)?$", command_lower)
            if task_match:
                return {
                    "action": "update_state",
                    "task_title": task_match.group(1).strip(),
                    "new_state": "In Progress",
                    "confidence": 0.9
                }
        
        if any(word in command_lower for word in ["complete", "finish", "done"]):
            task_match = re.search(r"(?:complete|finish|mark\s+(?:as\s+)?(?:completed|done)|done)\s+(.+?)(?:\s+task)?$", command_lower)
            if task_match:
                return {
                    "action": "update_state",
                    "task_title": task_match.group(1).strip(),
                    "new_state": "Completed",
                    "confidence": 0.9
                }
        
        # Delete patterns
        delete_patterns = [
            r"(?:delete|remove)\s+(.+?)(?:\s+task)?$",
        ]
        
        for pattern in delete_patterns:
            match = re.search(pattern, command_lower)
            if match:
                return {
                    "action": "delete",
                    "task_title": match.group(1).strip(),
                    "confidence": 0.8
                }
        
        # Default: conversational response for unclear input
        return {
            "action": "chat",
            "message": "unclear",
            "confidence": 0.5
        }
    
    async def _execute_action(self, parsed_command: Dict[str, Any], user_id: int) -> AICommandResponse:
        """
        Execute the parsed action through TaskService.
        This ensures all business logic and validation is respected.
        """
        action = parsed_command.get("action")
        
        try:
            if action == "chat":
                # Handle conversational responses
                message_type = parsed_command.get("message", "general")
                
                if message_type == "greeting":
                    return AICommandResponse(
                        success=True,
                        message="Hello! I'm your personal day planner assistant. I can help you:\n\n📅 **Schedule Tasks:**\n• 'Schedule meeting tomorrow at 3pm'\n• 'Plan study session for today at 8pm'\n• 'Remind me to call John at 2pm'\n\n📋 **Manage Tasks:**\n• 'Show my schedule for today'\n• 'What's on my agenda tomorrow?'\n• 'Mark presentation as completed'\n\n⏰ **Set Reminders:**\n• 'Remind me 30 minutes before the meeting'\n• 'Set reminder for doctor appointment'\n\nHow can I help organize your day?"
                    )
                elif message_type == "help":
                    return AICommandResponse(
                        success=True,
                        message="I'm your AI day planner! Here's how I can help:\n\n📅 **Scheduling:**\n• 'Schedule meeting tomorrow at 3pm'\n• 'Plan workout for today morning'\n• 'Book dentist appointment Friday 2pm'\n\n⏰ **Time Management:**\n• 'Show my schedule for today'\n• 'What's due tomorrow?'\n• 'List urgent tasks'\n\n🔔 **Reminders:**\n• 'Remind me 15 minutes before meeting'\n• 'Set reminder for grocery shopping'\n\n✅ **Task Updates:**\n• 'Start working on presentation'\n• 'Complete the research task'\n• 'Delete old appointment'\n\n🏷️ **Categories & Priorities:**\n• 'Add high priority work task'\n• 'Create personal reminder'\n\nJust tell me what you need to plan or organize!"
                    )
                else:
                    return AICommandResponse(
                        success=True,
                        message="I'm your personal task assistant! I can help you create, manage, and track your tasks. Try asking me to:\n\n• 'Add a new task'\n• 'Show my current tasks'\n• 'Mark a task as done'\n\nWhat would you like me to help you with?"
                    )
            
            elif action == "create":
                task_title = parsed_command.get("task_title", "").strip()
                if not task_title:
                    return AICommandResponse(
                        success=False,
                        message="Please provide a task title."
                    )
                
                # Extract additional properties from parsed command
                task_create_data = {"title": task_title}
                
                # Add description if provided
                if "description" in parsed_command and parsed_command["description"]:
                    task_create_data["description"] = parsed_command["description"].strip()
                
                # Add priority if provided
                if "priority" in parsed_command and parsed_command["priority"]:
                    task_create_data["priority"] = parsed_command["priority"]
                
                # Add category if provided
                if "category" in parsed_command and parsed_command["category"]:
                    task_create_data["category"] = parsed_command["category"]
                
                # Add scheduling information
                if "scheduled_date" in parsed_command and parsed_command["scheduled_date"]:
                    task_create_data["scheduled_date"] = parsed_command["scheduled_date"]
                
                if "scheduled_time" in parsed_command and parsed_command["scheduled_time"]:
                    task_create_data["scheduled_time"] = parsed_command["scheduled_time"]
                
                if "due_date" in parsed_command and parsed_command["due_date"]:
                    task_create_data["due_date"] = parsed_command["due_date"]
                
                if "due_time" in parsed_command and parsed_command["due_time"]:
                    task_create_data["due_time"] = parsed_command["due_time"]
                
                if "reminder_time" in parsed_command and parsed_command["reminder_time"]:
                    task_create_data["reminder_time"] = int(parsed_command["reminder_time"])
                
                # Create the task
                try:
                    # Log the final task creation data
                    logger.info(f"Creating task with data: {task_create_data}")
                    
                    task_create = TaskCreate(**task_create_data)
                    task = self.task_service.create_task(task_create, user_id)
                    
                    # Build a more detailed success message
                    message_parts = [f"Created task: '{task.title}'"]
                    
                    if task.scheduled_date:
                        message_parts.append(f"📅 Scheduled for {task.scheduled_date}")
                        if task.scheduled_time:
                            message_parts[-1] += f" at {task.scheduled_time}"
                    
                    if task.due_date:
                        message_parts.append(f"⏰ Due {task.due_date}")
                        if task.due_time:
                            message_parts[-1] += f" at {task.due_time}"
                    
                    if task.priority and task.priority != "Medium":
                        message_parts.append(f"🔥 Priority: {task.priority}")
                    
                    if task.reminder_time:
                        message_parts.append(f"🔔 Reminder: {task.reminder_time} minutes before due")
                    
                    logger.info(f"Successfully created task {task.id}: {task.title} for user {user_id}")
                    
                    return AICommandResponse(
                        success=True,
                        message="\n".join(message_parts),
                        action="create",
                        task_id=task.id
                    )
                except Exception as e:
                    logger.error(f"Failed to create task: {e}")
                    logger.error(f"Task data that failed validation: {task_create_data}")
                    return AICommandResponse(
                        success=False,
                        message=f"Failed to create task: {str(e)}"
                    )
            
            elif action == "update_state":
                task_title = parsed_command.get("task_title", "").strip()
                new_state = parsed_command.get("new_state")
                
                if not task_title:
                    return AICommandResponse(
                        success=False,
                        message="Please specify which task to update."
                    )
                
                # Find matching tasks
                matching_tasks = self.task_service.search_tasks_by_title(task_title, user_id)
                
                if not matching_tasks:
                    return AICommandResponse(
                        success=False,
                        message=f"No tasks found matching '{task_title}'"
                    )
                
                if len(matching_tasks) > 1:
                    task_titles = [task.title for task in matching_tasks]
                    return AICommandResponse(
                        success=False,
                        message=f"Multiple tasks found: {', '.join(task_titles)}. Please be more specific."
                    )
                
                # Update the task state
                task = matching_tasks[0]
                try:
                    new_state_enum = TaskState(new_state)
                    task_update = TaskUpdate(state=new_state_enum)
                    updated_task = self.task_service.update_task(task.id, task_update, user_id)
                    
                    return AICommandResponse(
                        success=True,
                        message=f"Updated '{task.title}' to '{new_state}'",
                        action="update_state",
                        task_id=updated_task.id
                    )
                except ValueError as e:
                    return AICommandResponse(
                        success=False,
                        message=f"Invalid state: {new_state}"
                    )
            
            elif action == "list":
                state_filter = parsed_command.get("state_filter")
                state_enum = None
                
                if state_filter:
                    try:
                        state_enum = TaskState(state_filter)
                    except ValueError:
                        return AICommandResponse(
                            success=False,
                            message=f"Invalid state filter: {state_filter}"
                        )
                
                tasks = self.task_service.get_tasks(user_id, state_enum)
                
                if not tasks:
                    filter_msg = f" in state '{state_filter}'" if state_filter else ""
                    return AICommandResponse(
                        success=True,
                        message=f"No tasks found{filter_msg}",
                        action="list",
                        tasks=[]
                    )
                
                task_responses = [TaskResponse.model_validate(task) for task in tasks]
                filter_msg = f" in state '{state_filter}'" if state_filter else ""
                
                return AICommandResponse(
                    success=True,
                    message=f"Found {len(tasks)} task(s){filter_msg}",
                    action="list",
                    tasks=task_responses
                )
            
            elif action == "delete":
                task_title = parsed_command.get("task_title", "").strip()
                
                if not task_title:
                    return AICommandResponse(
                        success=False,
                        message="Please specify which task to delete."
                    )
                
                # Find matching tasks
                matching_tasks = self.task_service.search_tasks_by_title(task_title, user_id)
                
                if not matching_tasks:
                    return AICommandResponse(
                        success=False,
                        message=f"No tasks found matching '{task_title}'"
                    )
                
                if len(matching_tasks) > 1:
                    task_titles = [task.title for task in matching_tasks]
                    return AICommandResponse(
                        success=False,
                        message=f"Multiple tasks found: {', '.join(task_titles)}. Please be more specific."
                    )
                
                # Delete the task
                task = matching_tasks[0]
                self.task_service.delete_task(task.id, user_id)
                
                return AICommandResponse(
                    success=True,
                    message=f"Deleted task: '{task.title}'",
                    action="delete",
                    task_id=task.id
                )
            
            else:
                return AICommandResponse(
                    success=False,
                    message="I couldn't understand what you want to do. Try commands like 'create task', 'start task', 'complete task', or 'show tasks'."
                )
        
        except Exception as e:
            logger.error(f"Error executing action {action}: {e}")
            return AICommandResponse(
                success=False,
                message=f"Error: {str(e)}"
            )