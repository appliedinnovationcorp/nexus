// Project Kanban Screen - Mobile-optimized task management

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Pressable,
  Badge,
  Avatar,
  IconButton,
  Fab,
  useColorModeValue,
  useToast,
  Skeleton,
  Alert,
  AlertIcon,
  AlertText
} from 'native-base';
import {
  RefreshControl,
  Dimensions,
  PanGestureHandler,
  State as GestureState
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  User, 
  Flag, 
  MessageCircle, 
  Paperclip,
  Filter,
  Search
} from 'lucide-react-native';

import { TaskCard } from '../components/TaskCard';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { FilterModal } from '../components/FilterModal';
import { projectService } from '../services/project-service';
import { useAuthStore } from '../stores/auth-store';
import { formatDate } from '../utils/formatters';
import { hapticFeedback } from '../utils/haptics';

const { width: screenWidth } = Dimensions.get('window');
const COLUMN_WIDTH = screenWidth * 0.85;

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: Date;
  tags: string[];
  attachments: number;
  comments: number;
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  limit?: number;
}

export function ProjectKanbanScreen({ route, navigation }: any) {
  const { projectId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const [columns, setColumns] = useState<Column[]>([
    { id: 'backlog', title: 'Backlog', tasks: [], color: '#6B7280' },
    { id: 'todo', title: 'To Do', tasks: [], color: '#3B82F6' },
    { id: 'in-progress', title: 'In Progress', tasks: [], color: '#F59E0B', limit: 3 },
    { id: 'review', title: 'Review', tasks: [], color: '#8B5CF6', limit: 2 },
    { id: 'done', title: 'Done', tasks: [], color: '#10B981' }
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Fetch tasks
  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ['project-tasks', projectId, filters],
    queryFn: () => projectService.getTasks(projectId, filters),
    staleTime: 30000,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      projectService.updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      hapticFeedback.success();
      toast.show({
        description: 'Task updated successfully',
        status: 'success'
      });
    },
    onError: () => {
      hapticFeedback.error();
      toast.show({
        description: 'Failed to update task',
        status: 'error'
      });
    }
  });

  // Organize tasks into columns
  useEffect(() => {
    if (tasks) {
      const updatedColumns = columns.map(column => ({
        ...column,
        tasks: tasks.filter((task: Task) => task.status === column.id)
      }));
      setColumns(updatedColumns);
    }
  }, [tasks]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleTaskPress = (task: Task) => {
    hapticFeedback.light();
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleTaskStatusChange = (taskId: string, newStatus: Task['status']) => {
    const task = tasks?.find((t: Task) => t.id === taskId);
    if (!task) return;

    // Check WIP limits
    const targetColumn = columns.find(col => col.id === newStatus);
    if (targetColumn?.limit && targetColumn.tasks.length >= targetColumn.limit) {
      toast.show({
        description: `${targetColumn.title} column has reached its WIP limit`,
        status: 'warning'
      });
      return;
    }

    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus }
    });
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      low: 'gray.500',
      medium: 'blue.500',
      high: 'orange.500',
      urgent: 'red.500'
    };
    return colors[priority];
  };

  const renderColumn = (column: Column) => (
    <Box key={column.id} width={COLUMN_WIDTH} mx={2}>
      <VStack space={3} bg={cardBg} rounded="lg" p={4} shadow={1}>
        {/* Column Header */}
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space={2} alignItems="center">
            <Box w={3} h={3} rounded="full" bg={column.color} />
            <Text fontSize="md" fontWeight="semibold">
              {column.title}
            </Text>
            <Badge variant="subtle" colorScheme="gray">
              {column.tasks.length}
            </Badge>
            {column.limit && (
              <Badge 
                variant={column.tasks.length >= column.limit ? "solid" : "outline"}
                colorScheme={column.tasks.length >= column.limit ? "red" : "gray"}
                size="sm"
              >
                WIP: {column.limit}
              </Badge>
            )}
          </HStack>
          <IconButton
            icon={<MoreVertical size={16} />}
            variant="ghost"
            size="sm"
          />
        </HStack>

        {/* Tasks */}
        <VStack space={3}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => handleTaskPress(task)}
              onStatusChange={handleTaskStatusChange}
              availableStatuses={columns.map(col => ({ id: col.id, title: col.title }))}
            />
          ))}
          
          {/* Add Task Button */}
          <Pressable
            onPress={() => setIsCreateModalOpen(true)}
            p={3}
            borderWidth={2}
            borderColor="gray.300"
            borderStyle="dashed"
            rounded="lg"
            alignItems="center"
            _pressed={{ opacity: 0.7 }}
          >
            <HStack space={2} alignItems="center">
              <Plus size={16} color="#6B7280" />
              <Text color="gray.500" fontSize="sm">
                Add Task
              </Text>
            </HStack>
          </Pressable>
        </VStack>
      </VStack>
    </Box>
  );

  if (isLoading) {
    return (
      <Box flex={1} bg={bgColor} p={4}>
        <VStack space={4}>
          <Skeleton h={10} rounded="lg" />
          <HStack space={4}>
            {[1, 2, 3].map((i) => (
              <VStack key={i} space={3} flex={1}>
                <Skeleton h={6} rounded="md" />
                <Skeleton h={20} rounded="lg" />
                <Skeleton h={20} rounded="lg" />
              </VStack>
            ))}
          </HStack>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flex={1} bg={bgColor} p={4} justifyContent="center">
        <Alert status="error">
          <AlertIcon />
          <AlertText>Failed to load tasks. Pull to refresh.</AlertText>
        </Alert>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={bgColor}>
      {/* Header */}
      <HStack 
        justifyContent="space-between" 
        alignItems="center" 
        p={4} 
        bg={cardBg}
        shadow={1}
      >
        <VStack>
          <Text fontSize="lg" fontWeight="bold">
            Project Board
          </Text>
          <Text fontSize="sm" color="gray.600">
            {tasks?.length || 0} tasks
          </Text>
        </VStack>
        <HStack space={2}>
          <IconButton
            icon={<Filter size={20} />}
            variant="ghost"
            onPress={() => setIsFilterModalOpen(true)}
          />
          <IconButton
            icon={<Search size={20} />}
            variant="ghost"
            onPress={() => navigation.navigate('TaskSearch', { projectId })}
          />
        </HStack>
      </HStack>

      {/* Kanban Columns */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <HStack space={0} px={2}>
          {columns.map(renderColumn)}
        </HStack>
      </ScrollView>

      {/* Floating Action Button */}
      <Fab
        renderInPortal={false}
        shadow={2}
        size="sm"
        icon={<Plus size={20} color="white" />}
        onPress={() => setIsCreateModalOpen(true)}
        bg="blue.500"
        _pressed={{ bg: 'blue.600' }}
      />

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={projectId}
      />

      {selectedTask && (
        <TaskDetailModal
          isOpen={isTaskDetailOpen}
          onClose={() => setIsTaskDetailOpen(false)}
          task={selectedTask}
          onUpdate={(updates) => 
            updateTaskMutation.mutate({ taskId: selectedTask.id, updates })
          }
        />
      )}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </Box>
  );
}

// Task Card Component
function TaskCard({ 
  task, 
  onPress, 
  onStatusChange, 
  availableStatuses 
}: {
  task: Task;
  onPress: () => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  availableStatuses: Array<{ id: string; title: string }>;
}) {
  const cardBg = useColorModeValue('white', 'gray.700');
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const isOverdue = task.dueDate && new Date() > task.dueDate;

  return (
    <Pressable onPress={onPress} _pressed={{ opacity: 0.8 }}>
      <Box
        bg={cardBg}
        rounded="lg"
        p={3}
        shadow={1}
        borderLeftWidth={3}
        borderLeftColor={task.priority === 'urgent' ? 'red.500' : 'gray.200'}
      >
        {/* Task Header */}
        <HStack justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Text fontSize="sm" fontWeight="medium" flex={1} numberOfLines={2}>
            {task.title}
          </Text>
          <Flag size={12} color={getPriorityColor(task.priority)} />
        </HStack>

        {/* Task Description */}
        {task.description && (
          <Text fontSize="xs" color="gray.600" numberOfLines={2} mb={2}>
            {task.description}
          </Text>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <HStack space={1} mb={2} flexWrap="wrap">
            {task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="subtle" size="sm">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <Badge variant="subtle" size="sm">
                +{task.tags.length - 2}
              </Badge>
            )}
          </HStack>
        )}

        {/* Subtasks Progress */}
        {totalSubtasks > 0 && (
          <VStack space={1} mb={2}>
            <HStack justifyContent="space-between">
              <Text fontSize="xs" color="gray.600">
                Subtasks
              </Text>
              <Text fontSize="xs" color="gray.600">
                {completedSubtasks}/{totalSubtasks}
              </Text>
            </HStack>
            <Box bg="gray.200" rounded="full" h={1}>
              <Box
                bg="blue.500"
                rounded="full"
                h={1}
                width={`${(completedSubtasks / totalSubtasks) * 100}%`}
              />
            </Box>
          </VStack>
        )}

        {/* Task Footer */}
        <HStack justifyContent="space-between" alignItems="center">
          <HStack space={2} alignItems="center">
            {/* Assignee */}
            {task.assignee && (
              <Avatar size="xs" source={{ uri: task.assignee.avatar }}>
                {task.assignee.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <HStack space={1} alignItems="center">
                <Calendar size={10} color={isOverdue ? '#EF4444' : '#6B7280'} />
                <Text 
                  fontSize="xs" 
                  color={isOverdue ? 'red.500' : 'gray.600'}
                >
                  {formatDate(task.dueDate, 'MMM dd')}
                </Text>
              </HStack>
            )}
          </HStack>

          <HStack space={2} alignItems="center">
            {/* Comments */}
            {task.comments > 0 && (
              <HStack space={1} alignItems="center">
                <MessageCircle size={10} color="#6B7280" />
                <Text fontSize="xs" color="gray.600">
                  {task.comments}
                </Text>
              </HStack>
            )}

            {/* Attachments */}
            {task.attachments > 0 && (
              <HStack space={1} alignItems="center">
                <Paperclip size={10} color="#6B7280" />
                <Text fontSize="xs" color="gray.600">
                  {task.attachments}
                </Text>
              </HStack>
            )}
          </HStack>
        </HStack>
      </Box>
    </Pressable>
  );
}
