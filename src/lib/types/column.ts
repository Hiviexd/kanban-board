export interface Column {
    _id: string;
    title: string;
    position: number;
    boardId: string;
    createdAt: Date;
    updatedAt: Date;
}

// Extended column interface with computed properties for display
export interface ColumnWithMetadata extends Column {
    taskCount: number;
    canEdit: boolean;
}

// Request/Response types for API
export interface CreateColumnRequest {
    title: string;
    position?: number;
}

export interface UpdateColumnRequest {
    title?: string;
    position?: number;
}

export interface MoveColumnRequest {
    position: number;
}

// Drag and drop types
export interface ColumnDragData {
    id: string;
    title: string;
    position: number;
    boardId: string;
}

export interface ColumnDropResult {
    draggedColumnId: string;
    newPosition: number;
    oldPosition: number;
}
