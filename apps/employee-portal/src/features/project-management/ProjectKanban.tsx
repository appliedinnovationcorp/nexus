// Project Kanban Board - Advanced Task Management

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, MoreHorizontal, Calendar, User, Flag, Clock, 
  MessageSquare, Paperclip, CheckCircle, AlertCircle,
  Filter, Search, Settings, Users, Tag
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';

import { projectService } from '@/services/project-service';
import { useAuthStore } from '@/stores/auth-store';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  attachments: number;
  comments: number;
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  estimatedHours?: number;
  actualHours?: number;
  projectId: string;
  milestoneId?: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  limit?: number;
  color: string;
}

interface KanbanFilters {
  assignee?: string;
  priority?: string;
  tags?: string[];
  dueDate?: 'overdue' | 'today' | 'this-week' | 'this-month';
  search?: string;
}

export function ProjectKanban({ projectId }: { projectId: string }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [columns, setColumns] = useState<Column[]>([
    { id: 'backlog', title: 'Backlog', tasks: [], color: '#6B7280' },
    { id: 'todo', title: 'To Do', tasks: [], color: '#3B82F6' },
    { id: 'in-progress', title: 'In Progress', tasks: [], limit: 3, color: '#F59E0B' },
    { id: 'review', title: 'Review', tasks: [], limit: 2, color: '#8B5CF6' },
    { id: 'done', title: 'Done', tasks: [], color: '#10B981' }
  ]);

  const [filters, setFilters] = useState<KanbanFilters>({});
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['project-tasks', projectId, filters],
    queryFn: () => projectService.getTasks(projectId, filters),
    staleTime: 30000,
  });

  // Fetch team members for assignment
  const { data: teamMembers } = useQuery({
    queryKey: ['project-team', projectId],
    queryFn: () => projectService.getTeamMembers(projectId),
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      projectService.updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) =>
      projectService.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      setIsCreateTaskOpen(false);
    },
  });

  // Organize tasks into columns
  useEffect(() => {
    if (tasks) {
      const updatedColumns = columns.map(column => ({
        ...column,
        tasks: tasks.filter(task => task.status === column.id)
      }));
      setColumns(updatedColumns);
    }
  }, [tasks]);

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // Check WIP limits
    if (destColumn.limit && destColumn.tasks.length >= destColumn.limit && source.droppableId !== destination.droppableId) {
      alert(`Column "${destColumn.title}" has reached its WIP limit of ${destColumn.limit}`);
      return;
    }

    const task = sourceColumn.tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Update task status
    updateTaskMutation.mutate({
      taskId: draggableId,
      updates: { status: destination.droppableId as Task['status'] }
    });
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority];
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Flag className="h-3 w-3 text-red-500" />;
      case 'high':
        return <Flag className="h-3 w-3 text-orange-500" />;
      case 'medium':
        return <Flag className="h-3 w-3 text-blue-500" />;
      default:
        return <Flag className="h-3 w-3 text-gray-400" />;
    }
  };

  const isOverdue = (dueDate?: Date) => {
    return dueDate && new Date() > dueDate;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Project Board</h2>
          <p className="text-gray-600">Manage tasks and track progress</p>
        </div>
        <div className="flex space-x-2">
          <KanbanFilters filters={filters} onFiltersChange={setFilters} />
          <Button onClick={() => setIsCreateTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 h-full min-w-max pb-4">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <h3 className="font-semibold">{column.title}</h3>
                      <Badge variant="secondary">{column.tasks.length}</Badge>
                      {column.limit && (
                        <Badge 
                          variant={column.tasks.length >= column.limit ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          WIP: {column.limit}
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Tasks */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "space-y-3 min-h-[200px] transition-colors",
                          snapshot.isDraggingOver && "bg-blue-50 rounded-lg"
                        )}
                      >
                        {column.tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "transition-all",
                                  snapshot.isDragging && "rotate-2 scale-105"
                                )}
                              >
                                <TaskCard 
                                  task={task} 
                                  onClick={() => openTaskDetail(task)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add Task Button */}
                  <Button
                    variant="ghost"
                    className="w-full mt-3 border-2 border-dashed border-gray-300 hover:border-gray-400"
                    onClick={() => setIsCreateTaskOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSubmit={(taskData) => createTaskMutation.mutate(taskData)}
        projectId={projectId}
        teamMembers={teamMembers || []}
      />

      {/* Task Detail Dialog */}
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          isOpen={isTaskDetailOpen}
          onClose={() => setIsTaskDetailOpen(false)}
          onUpdate={(updates) => updateTaskMutation.mutate({ taskId: selectedTask.id, updates })}
          teamMembers={teamMembers || []}
        />
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: task.priority === 'urgent' ? '#EF4444' : '#E5E7EB' }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Task Header */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
          <div className="flex items-center space-x-1 ml-2">
            {getPriorityIcon(task.priority)}
          </div>
        </div>

        {/* Task Description */}
        {task.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Subtasks Progress */}
        {totalSubtasks > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Subtasks</span>
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Task Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Assignee */}
            {task.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {task.assignee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div className={cn(
                "flex items-center space-x-1 text-xs",
                isOverdue(task.dueDate) ? "text-red-600" : "text-gray-600"
              )}>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.dueDate, 'MMM dd')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-gray-400">
            {/* Comments */}
            {task.comments > 0 && (
              <div className="flex items-center space-x-1 text-xs">
                <MessageSquare className="h-3 w-3" />
                <span>{task.comments}</span>
              </div>
            )}

            {/* Attachments */}
            {task.attachments > 0 && (
              <div className="flex items-center space-x-1 text-xs">
                <Paperclip className="h-3 w-3" />
                <span>{task.attachments}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Filters Component
function KanbanFilters({ 
  filters, 
  onFiltersChange 
}: { 
  filters: KanbanFilters; 
  onFiltersChange: (filters: KanbanFilters) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {Object.keys(filters).length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {Object.keys(filters).length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Filter Tasks</h4>
          
          {/* Search */}
          <div>
            <Label>Search</Label>
            <Input
              placeholder="Search tasks..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Priority */}
          <div>
            <Label>Priority</Label>
            <Select
              value={filters.priority || ''}
              onValueChange={(value) => onFiltersChange({ ...filters, priority: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div>
            <Label>Due Date</Label>
            <Select
              value={filters.dueDate || ''}
              onValueChange={(value) => onFiltersChange({ ...filters, dueDate: value as any || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="today">Due today</SelectItem>
                <SelectItem value="this-week">Due this week</SelectItem>
                <SelectItem value="this-month">Due this month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onFiltersChange({})}
            >
              Clear All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Create Task Dialog Component
function CreateTaskDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projectId, 
  teamMembers 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  projectId: string;
  teamMembers: Array<{ id: string; name: string; avatar?: string }>;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    assigneeId: '',
    dueDate: undefined as Date | undefined,
    tags: [] as string[],
    estimatedHours: undefined as number | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      ...formData,
      status: 'todo',
      projectId,
      attachments: 0,
      comments: 0,
      subtasks: [],
      assignee: formData.assigneeId ? teamMembers.find(m => m.id === formData.assigneeId) : undefined,
    };

    onSubmit(taskData);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assigneeId: '',
      dueDate: undefined,
      tags: [],
      estimatedHours: undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assignee</Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Task Detail Dialog Component (simplified)
function TaskDetailDialog({ 
  task, 
  isOpen, 
  onClose, 
  onUpdate, 
  teamMembers 
}: {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  teamMembers: Array<{ id: string; name: string; avatar?: string }>;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Task details would go here */}
          <p>Task detail view would be implemented here with full editing capabilities</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
