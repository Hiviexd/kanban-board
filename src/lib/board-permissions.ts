import { auth0 } from "./auth0";
import connectDB from "./mongodb";
import User, { IUser } from "./models/User";
import Board, { IBoard, IBoardMember } from "./models/Board";
import Column, { IColumn } from "./models/Column";
import Task, { ITask } from "./models/Task";
import { BoardRole } from "./types/board";
import { UserRole } from "./types/user";

export interface BoardPermissionContext {
    user: IUser | null;
    board: IBoard | null;
    isAuthenticated: boolean;
    isOwner: boolean;
    isEditor: boolean;
    isViewer: boolean;
    isMember: boolean;
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageMembers: boolean;
    userRole?: BoardRole;
}

/**
 * Get comprehensive board permission context for the current user
 */
export async function getBoardPermissionContext(boardId: string): Promise<BoardPermissionContext> {
    try {
        const session = await auth0.getSession();

        if (!session?.user) {
            return {
                user: null,
                board: null,
                isAuthenticated: false,
                isOwner: false,
                isEditor: false,
                isViewer: false,
                isMember: false,
                canView: false,
                canEdit: false,
                canDelete: false,
                canManageMembers: false,
            };
        }

        await connectDB();

        // Get user from database
        const user = await User.findOne({ auth0Id: session.user.sub });
        if (!user) {
            return {
                user: null,
                board: null,
                isAuthenticated: true,
                isOwner: false,
                isEditor: false,
                isViewer: false,
                isMember: false,
                canView: false,
                canEdit: false,
                canDelete: false,
                canManageMembers: false,
            };
        }

        // Get board
        const board = await Board.findById(boardId);
        if (!board) {
            return {
                user,
                board: null,
                isAuthenticated: true,
                isOwner: false,
                isEditor: false,
                isViewer: false,
                isMember: false,
                canView: false,
                canEdit: false,
                canDelete: false,
                canManageMembers: false,
            };
        }

        // Determine user's role and permissions
        const isOwner = board.ownerId.toString() === user._id.toString();
        const memberRecord = board.members.find(
            (member: IBoardMember) => member.userId.toString() === user._id.toString()
        );
        const userRole = memberRecord?.role;
        const isMember = !!memberRecord || isOwner;

        const isEditor = isOwner || userRole === BoardRole.EDITOR;
        const isViewer = isMember || userRole === BoardRole.VIEWER;

        // Calculate permissions
        const canView = board.isPublic || isMember;
        const canEdit = isEditor;
        const canDelete = isOwner;
        const canManageMembers = isOwner;

        return {
            user,
            board,
            isAuthenticated: true,
            isOwner,
            isEditor,
            isViewer,
            isMember,
            canView,
            canEdit,
            canDelete,
            canManageMembers,
            userRole,
        };
    } catch (error) {
        console.error("Error getting board permission context:", error);
        return {
            user: null,
            board: null,
            isAuthenticated: false,
            isOwner: false,
            isEditor: false,
            isViewer: false,
            isMember: false,
            canView: false,
            canEdit: false,
            canDelete: false,
            canManageMembers: false,
        };
    }
}

/**
 * Check if user can view a board
 */
export async function canUserViewBoard(boardId: string): Promise<boolean> {
    const context = await getBoardPermissionContext(boardId);
    return context.canView;
}

/**
 * Check if user can edit a board
 */
export async function canUserEditBoard(boardId: string): Promise<boolean> {
    const context = await getBoardPermissionContext(boardId);
    return context.canEdit;
}

/**
 * Check if user can delete a board
 */
export async function canUserDeleteBoard(boardId: string): Promise<boolean> {
    const context = await getBoardPermissionContext(boardId);
    return context.canDelete;
}

/**
 * Check if user can manage board members
 */
export async function canUserManageBoardMembers(boardId: string): Promise<boolean> {
    const context = await getBoardPermissionContext(boardId);
    return context.canManageMembers;
}

/**
 * Check if user can be assigned to tasks in this board
 */
export async function canUserBeAssignedToBoard(boardId: string, userId: string): Promise<boolean> {
    try {
        await connectDB();

        const board = await Board.findById(boardId);
        if (!board) return false;

        // Check if user is owner
        if (board.ownerId.toString() === userId) return true;

        // Check if user is a member
        const isMember = board.members.some((member: IBoardMember) => member.userId.toString() === userId);

        return isMember;
    } catch (error) {
        console.error("Error checking if user can be assigned to board:", error);
        return false;
    }
}

/**
 * Get board permission context for column operations
 */
export async function getColumnPermissionContext(columnId: string): Promise<BoardPermissionContext> {
    try {
        await connectDB();

        const column = await Column.findById(columnId);
        if (!column) {
            return {
                user: null,
                board: null,
                isAuthenticated: false,
                isOwner: false,
                isEditor: false,
                isViewer: false,
                isMember: false,
                canView: false,
                canEdit: false,
                canDelete: false,
                canManageMembers: false,
            };
        }

        return getBoardPermissionContext(column.boardId.toString());
    } catch (error) {
        console.error("Error getting column permission context:", error);
        return {
            user: null,
            board: null,
            isAuthenticated: false,
            isOwner: false,
            isEditor: false,
            isViewer: false,
            isMember: false,
            canView: false,
            canEdit: false,
            canDelete: false,
            canManageMembers: false,
        };
    }
}

/**
 * Get board permission context for task operations
 */
export async function getTaskPermissionContext(taskId: string): Promise<BoardPermissionContext> {
    try {
        await connectDB();

        const task = await Task.findById(taskId).populate("columnId");
        if (!task) {
            return {
                user: null,
                board: null,
                isAuthenticated: false,
                isOwner: false,
                isEditor: false,
                isViewer: false,
                isMember: false,
                canView: false,
                canEdit: false,
                canDelete: false,
                canManageMembers: false,
            };
        }

        const column = task.columnId as IColumn;
        return getBoardPermissionContext(column.boardId.toString());
    } catch (error) {
        console.error("Error getting task permission context:", error);
        return {
            user: null,
            board: null,
            isAuthenticated: false,
            isOwner: false,
            isEditor: false,
            isViewer: false,
            isMember: false,
            canView: false,
            canEdit: false,
            canDelete: false,
            canManageMembers: false,
        };
    }
}

/**
 * Require board view permission - throws error if not allowed
 */
export async function requireBoardViewPermission(boardId: string): Promise<BoardPermissionContext> {
    const context = await getBoardPermissionContext(boardId);

    if (!context.isAuthenticated) {
        throw new Error("Authentication required");
    }

    if (!context.canView) {
        throw new Error("Insufficient permissions to view this board");
    }

    return context;
}

/**
 * Require board edit permission - throws error if not allowed
 */
export async function requireBoardEditPermission(boardId: string): Promise<BoardPermissionContext> {
    const context = await getBoardPermissionContext(boardId);

    if (!context.isAuthenticated) {
        throw new Error("Authentication required");
    }

    if (!context.canEdit) {
        throw new Error("Insufficient permissions to edit this board");
    }

    return context;
}

/**
 * Require board delete permission - throws error if not allowed
 */
export async function requireBoardDeletePermission(boardId: string): Promise<BoardPermissionContext> {
    const context = await getBoardPermissionContext(boardId);

    if (!context.isAuthenticated) {
        throw new Error("Authentication required");
    }

    if (!context.canDelete) {
        throw new Error("Insufficient permissions to delete this board");
    }

    return context;
}

/**
 * Require board member management permission - throws error if not allowed
 */
export async function requireBoardMemberManagementPermission(boardId: string): Promise<BoardPermissionContext> {
    const context = await getBoardPermissionContext(boardId);

    if (!context.isAuthenticated) {
        throw new Error("Authentication required");
    }

    if (!context.canManageMembers) {
        throw new Error("Insufficient permissions to manage board members");
    }

    return context;
}

/**
 * Get list of boards user can access (member or public)
 */
export async function getUserAccessibleBoards(): Promise<IBoard[]> {
    try {
        const session = await auth0.getSession();

        if (!session?.user) {
            // Return only public boards for non-authenticated users
            await connectDB();
            return Board.find({ isPublic: true }).sort({ updatedAt: -1 });
        }

        await connectDB();

        const user = await User.findOne({ auth0Id: session.user.sub });
        if (!user) {
            // Return only public boards if user not found
            return Board.find({ isPublic: true }).sort({ updatedAt: -1 });
        }

        // Get boards where user is owner or member
        const boards = await Board.find({
            $or: [{ ownerId: user._id }, { "members.userId": user._id }],
        }).sort({ updatedAt: -1 });

        return boards;
    } catch (error) {
        console.error("Error getting user accessible boards:", error);
        return [];
    }
}
