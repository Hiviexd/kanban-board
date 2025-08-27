import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Column from "@/lib/models/Column";
import Task from "@/lib/models/Task";
import { getColumnPermissionContext } from "@/lib/board-permissions";
import { UpdateColumnRequest } from "@/lib/types/column";
import { broadcastBoardUpdate } from "@/lib/websocket/server";

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/columns/[id] - Get column details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const columnId = params.id;

        // Check permissions through column's board
        const context = await getColumnPermissionContext(columnId);

        if (!context.isAuthenticated) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!context.canView) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const column = await Column.findById(columnId);
        if (!column) {
            return NextResponse.json({ error: "Column not found" }, { status: 404 });
        }

        // Get task count for this column
        const taskCount = await Task.countDocuments({ columnId });

        const columnResponse = {
            _id: column._id.toString(),
            title: column.title,
            position: column.position,
            boardId: column.boardId.toString(),
            createdAt: column.createdAt,
            updatedAt: column.updatedAt,
            taskCount,
            canEdit: context.canEdit,
        };

        return NextResponse.json({ column: columnResponse });
    } catch (error) {
        console.error("Error fetching column:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/columns/[id] - Update column
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const columnId = params.id;

        // Check permissions through column's board
        const context = await getColumnPermissionContext(columnId);

        if (!context.isAuthenticated) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!context.canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const column = await Column.findById(columnId);
        if (!column) {
            return NextResponse.json({ error: "Column not found" }, { status: 404 });
        }

        const body: UpdateColumnRequest = await request.json();
        const { title, position } = body;

        // Update title if provided
        if (title !== undefined) {
            if (!title || title.trim().length === 0) {
                return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
            }
            if (title.length > 100) {
                return NextResponse.json({ error: "Title must be 100 characters or less" }, { status: 400 });
            }
            column.title = title.trim();
        }

        // Update position if provided (Trello-style reordering)
        if (position !== undefined && position !== column.position) {
            const oldPosition = column.position;
            const newPosition = position;
            const boardId = column.boardId;

            // Reorder other columns
            if (oldPosition < newPosition) {
                // Moving forward - shift columns between old and new position backward
                await Column.updateMany(
                    {
                        boardId,
                        position: { $gt: oldPosition, $lte: newPosition },
                        _id: { $ne: columnId },
                    },
                    { $inc: { position: -1 } }
                );
            } else {
                // Moving backward - shift columns between new and old position forward
                await Column.updateMany(
                    {
                        boardId,
                        position: { $gte: newPosition, $lt: oldPosition },
                        _id: { $ne: columnId },
                    },
                    { $inc: { position: 1 } }
                );
            }

            column.position = newPosition;
        }

        await column.save();

        // Get updated task count
        const taskCount = await Task.countDocuments({ columnId });

        const columnResponse = {
            _id: column._id.toString(),
            title: column.title,
            position: column.position,
            boardId: column.boardId.toString(),
            createdAt: column.createdAt,
            updatedAt: column.updatedAt,
            taskCount,
            canEdit: true,
        };

        // Broadcast column update
        const changes: any = {};
        if (title !== undefined) changes.title = column.title;
        if (position !== undefined) changes.position = column.position;

        broadcastBoardUpdate(column.boardId.toString(), "column_updated", {
            boardId: column.boardId.toString(),
            columnId: column._id.toString(),
            changes,
            updatedBy: (context.user as any)?._id.toString(),
        });

        return NextResponse.json({ column: columnResponse });
    } catch (error) {
        console.error("Error updating column:", error);

        if (error instanceof Error) {
            if (error.message.includes("validation failed")) {
                return NextResponse.json({ error: "Invalid column data" }, { status: 400 });
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/columns/[id] - Delete column
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const columnId = params.id;

        // Check permissions through column's board
        const context = await getColumnPermissionContext(columnId);

        if (!context.isAuthenticated) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!context.canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const column = await Column.findById(columnId);
        if (!column) {
            return NextResponse.json({ error: "Column not found" }, { status: 404 });
        }

        const boardId = column.boardId;
        const position = column.position;

        // Check if column has tasks
        const taskCount = await Task.countDocuments({ columnId });
        if (taskCount > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete column with tasks. Please move or delete all tasks first.",
                    taskCount,
                },
                { status: 400 }
            );
        }

        // Broadcast column deletion before deleting
        broadcastBoardUpdate(boardId.toString(), "column_deleted", {
            boardId: boardId.toString(),
            columnId,
            deletedBy: (context.user as any)?._id.toString(),
        });

        // Delete the column
        await Column.findByIdAndDelete(columnId);

        // Reorder remaining columns
        await Column.updateMany({ boardId, position: { $gt: position } }, { $inc: { position: -1 } });

        return NextResponse.json({ message: "Column deleted successfully" });
    } catch (error) {
        console.error("Error deleting column:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
