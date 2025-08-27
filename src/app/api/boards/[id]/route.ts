import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Board from "@/lib/models/Board";
import {
    getBoardPermissionContext,
    requireBoardViewPermission,
    requireBoardEditPermission,
    requireBoardDeletePermission,
} from "@/lib/board-permissions";
import { UpdateBoardRequest } from "@/lib/types/board";
import { broadcastBoardUpdate } from "@/lib/websocket/server";

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/boards/[id] - Get board details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const boardId = params.id;

        // Check permissions - this will throw if not allowed
        const context = await requireBoardViewPermission(boardId);

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        // Return board with metadata and permission context
        const boardResponse = {
            _id: (context.board as any)._id.toString(),
            title: context.board.title,
            description: context.board.description,
            ownerId: context.board.ownerId.toString(),
            members: context.board.members.map((member) => ({
                userId: member.userId.toString(),
                role: member.role,
                joinedAt: member.joinedAt,
            })),
            labels: context.board.labels,
            isPublic: context.board.isPublic,
            createdAt: context.board.createdAt,
            updatedAt: context.board.updatedAt,
            // Add metadata
            memberCount: context.board.members.length + 1, // +1 for owner
            userRole: context.userRole,
            canEdit: context.canEdit,
            canDelete: context.canDelete,
            canManageMembers: context.canManageMembers,
        };

        return NextResponse.json({ board: boardResponse });
    } catch (error) {
        console.error("Error fetching board:", error);

        if (error instanceof Error) {
            if (error.message === "Authentication required") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Insufficient permissions to view this board") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/boards/[id] - Update board
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const boardId = params.id;

        // Check permissions - this will throw if not allowed
        const context = await requireBoardEditPermission(boardId);

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        const body: UpdateBoardRequest = await request.json();
        const { title, description, isPublic, labels } = body;

        // Validate updates
        if (title !== undefined) {
            if (!title || title.trim().length === 0) {
                return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
            }
            if (title.length > 100) {
                return NextResponse.json({ error: "Title must be 100 characters or less" }, { status: 400 });
            }
            context.board.title = title.trim();
        }

        if (description !== undefined) {
            if (description && description.length > 500) {
                return NextResponse.json({ error: "Description must be 500 characters or less" }, { status: 400 });
            }
            context.board.description = description?.trim();
        }

        if (isPublic !== undefined) {
            context.board.isPublic = isPublic;
        }

        if (labels !== undefined) {
            // Validate labels
            for (const label of labels) {
                if (!label.id || !label.name || !label.color) {
                    return NextResponse.json({ error: "Invalid label format" }, { status: 400 });
                }
                if (label.name.length > 50) {
                    return NextResponse.json({ error: "Label name must be 50 characters or less" }, { status: 400 });
                }
                if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(label.color)) {
                    return NextResponse.json({ error: "Invalid label color format" }, { status: 400 });
                }
            }

            // Check for duplicate label IDs
            const labelIds = labels.map((label) => label.id);
            if (labelIds.length !== new Set(labelIds).size) {
                return NextResponse.json({ error: "Duplicate label IDs are not allowed" }, { status: 400 });
            }

            context.board.labels = labels;
        }

        await context.board.save();

        // Broadcast board update
        const changes: any = {};
        if (title !== undefined) changes.title = context.board.title;
        if (description !== undefined) changes.description = context.board.description;
        if (isPublic !== undefined) changes.isPublic = context.board.isPublic;
        if (labels !== undefined) changes.labels = context.board.labels;

        broadcastBoardUpdate(boardId, "board_updated", {
            boardId,
            changes,
            updatedBy: (context.user as any)?._id.toString(),
        });

        // Return updated board
        const boardResponse = {
            _id: (context.board as any)._id.toString(),
            title: context.board.title,
            description: context.board.description,
            ownerId: context.board.ownerId.toString(),
            members: context.board.members.map((member) => ({
                userId: member.userId.toString(),
                role: member.role,
                joinedAt: member.joinedAt,
            })),
            labels: context.board.labels,
            isPublic: context.board.isPublic,
            createdAt: context.board.createdAt,
            updatedAt: context.board.updatedAt,
            memberCount: context.board.members.length + 1,
            userRole: context.userRole,
            canEdit: context.canEdit,
            canDelete: context.canDelete,
            canManageMembers: context.canManageMembers,
        };

        return NextResponse.json({ board: boardResponse });
    } catch (error) {
        console.error("Error updating board:", error);

        if (error instanceof Error) {
            if (error.message === "Authentication required") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Insufficient permissions to edit this board") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            if (error.message.includes("validation failed")) {
                return NextResponse.json({ error: "Invalid board data" }, { status: 400 });
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/boards/[id] - Delete board
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const boardId = params.id;

        // Check permissions - this will throw if not allowed
        const context = await requireBoardDeletePermission(boardId);

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        await connectDB();

        // TODO: In a production app, you might want to:
        // 1. Archive the board instead of deleting
        // 2. Delete associated columns and tasks
        // 3. Notify board members
        // 4. Create audit logs

        // Broadcast board deletion before deleting
        broadcastBoardUpdate(boardId, "board_updated", {
            boardId,
            changes: { deleted: true },
            updatedBy: (context.user as any)?._id.toString(),
        });

        await Board.findByIdAndDelete(boardId);

        return NextResponse.json({ message: "Board deleted successfully" });
    } catch (error) {
        console.error("Error deleting board:", error);

        if (error instanceof Error) {
            if (error.message === "Authentication required") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Insufficient permissions to delete this board") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
