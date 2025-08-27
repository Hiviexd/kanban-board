export interface BoardWebSocketEvents {
    // Board events
    board_updated: {
        boardId: string;
        changes: {
            title?: string;
            description?: string;
            labels?: any[];
            isPublic?: boolean;
        };
        updatedBy: string;
    };

    // Column events
    column_created: {
        boardId: string;
        column: any;
        createdBy: string;
    };

    column_updated: {
        boardId: string;
        columnId: string;
        changes: {
            title?: string;
            position?: number;
        };
        updatedBy: string;
    };

    column_deleted: {
        boardId: string;
        columnId: string;
        deletedBy: string;
    };

    // Task events
    task_created: {
        boardId: string;
        columnId: string;
        task: any;
        createdBy: string;
    };

    task_updated: {
        boardId: string;
        columnId: string;
        taskId: string;
        changes: {
            title?: string;
            description?: string;
            assigneeId?: string;
            startDate?: Date;
            dueDate?: Date;
            labels?: string[];
            isComplete?: boolean;
            position?: number;
        };
        updatedBy: string;
    };

    task_moved: {
        boardId: string;
        taskId: string;
        sourceColumnId: string;
        targetColumnId: string;
        oldPosition: number;
        newPosition: number;
        movedBy: string;
    };

    task_deleted: {
        boardId: string;
        columnId: string;
        taskId: string;
        deletedBy: string;
    };

    // User presence events
    user_joined: {
        boardId: string;
        user: {
            id: string;
            name: string;
            picture?: string;
        };
    };

    user_left: {
        boardId: string;
        userId: string;
    };

    // Member management events
    member_added: {
        boardId: string;
        member: {
            userId: string;
            name: string;
            email: string;
            picture?: string;
            role: string;
        };
        addedBy: string;
    };

    member_removed: {
        boardId: string;
        memberId: string;
        removedBy: string;
    };

    member_role_updated: {
        boardId: string;
        memberId: string;
        newRole: string;
        updatedBy: string;
    };
}

export interface ClientToServerEvents extends BoardWebSocketEvents {
    join_board: {
        boardId: string;
    };

    leave_board: {
        boardId: string;
    };
}

export interface ServerToClientEvents extends BoardWebSocketEvents {
    // System events
    connected: {
        userId: string;
    };

    error: {
        message: string;
        code?: string;
    };

    // Presence events
    board_presence_updated: {
        boardId: string;
        users: Array<{
            id: string;
            name: string;
            picture?: string;
            joinedAt: Date;
        }>;
    };
}

export interface WebSocketData {
    userId: string;
    boardIds: Set<string>;
}

export type WebSocketEventName = keyof (ClientToServerEvents & ServerToClientEvents);
