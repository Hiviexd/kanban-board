import { BoardLabel } from "./board";
import { User } from "./user";

export type TaskPriority = "high" | "medium" | "low" | "none";

export interface Task {
    _id: string;
    title: string;
    description?: string;
    assigneeId?: string; // Single assignee (board member only)
    startDate?: Date;
    dueDate?: Date;
    labels: string[]; // Array of label IDs from the board's label set
    isComplete: boolean;
    columnId: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
}

// Extended task interface with populated/computed properties for display
export interface TaskWithMetadata extends Task {
    assignee?: User;
    boardLabels: BoardLabel[]; // Resolved labels from board
    priority: TaskPriority;
    isOverdue: boolean;
    daysUntilDue?: number;
    canEdit: boolean;
}

// Request/Response types for API
export interface CreateTaskRequest {
    title: string;
    description?: string;
    assigneeId?: string;
    startDate?: Date;
    dueDate?: Date;
    labels?: string[];
    position?: number;
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    assigneeId?: string;
    startDate?: Date;
    dueDate?: Date;
    labels?: string[];
    isComplete?: boolean;
    position?: number;
}

export interface MoveTaskRequest {
    columnId: string;
    position: number;
}

// Drag and drop types
export interface TaskDragData {
    id: string;
    title: string;
    position: number;
    columnId: string;
}

export interface TaskDropResult {
    draggedTaskId: string;
    sourceColumnId: string;
    targetColumnId: string;
    newPosition: number;
    oldPosition: number;
}

// Task filtering and sorting types
export interface TaskFilters {
    assigneeId?: string;
    labels?: string[];
    isComplete?: boolean;
    priority?: TaskPriority;
    overdue?: boolean;
    dueDateRange?: {
        start?: Date;
        end?: Date;
    };
}

export type TaskSortField = "title" | "dueDate" | "createdAt" | "position" | "priority";
export type TaskSortOrder = "asc" | "desc";

export interface TaskSort {
    field: TaskSortField;
    order: TaskSortOrder;
}

// Task statistics
export interface TaskStats {
    total: number;
    completed: number;
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    unassigned: number;
}

// Task activity/history types
export interface TaskActivity {
    id: string;
    taskId: string;
    userId: string;
    action: "created" | "updated" | "moved" | "completed" | "reopened" | "assigned" | "unassigned";
    details?: Record<string, any>;
    timestamp: Date;
}

export interface TaskComment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}
