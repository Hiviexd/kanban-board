import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/lib/models/Task";
import { getTaskPermissionContext, canUserBeAssignedToBoard } from "@/lib/board-permissions";
import { UpdateTaskRequest } from "@/lib/types/task";
import { broadcastBoardUpdate } from "@/lib/websocket/server";

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/tasks/[id] - Get task details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const taskId = params.id;

        // Check permissions through task's board
        const context = await getTaskPermissionContext(taskId);

        if (!context.isAuthenticated) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!context.canView) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const task = await Task.findById(taskId).populate("assigneeId", "_id name email picture");
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Get resolved labels from board
        const boardLabels = context.board?.labels || [];
        const resolvedLabels = task.labels
            .map((labelId: string) => boardLabels.find((label) => label.id === labelId))
            .filter(Boolean);

        // Calculate priority and overdue status
        const priority = task.getPriority();
        const isOverdue = task.isOverdue();

        // Calculate days until due
        let daysUntilDue: number | undefined;
        if (task.dueDate && !task.isComplete) {
            const now = new Date();
            const dueDate = new Date(task.dueDate);
            daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        const taskResponse = {
            _id: task._id.toString(),
            title: task.title,
            description: task.description,
            assigneeId: task.assigneeId?.toString(),
            assignee: task.assigneeId
                ? {
                      _id: task.assigneeId._id.toString(),
                      name: task.assigneeId.name,
                      email: task.assigneeId.email,
                      picture: task.assigneeId.picture,
                  }
                : undefined,
            startDate: task.startDate,
            dueDate: task.dueDate,
            labels: task.labels,
            boardLabels: resolvedLabels,
            isComplete: task.isComplete,
            columnId: task.columnId.toString(),
            position: task.position,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            // Metadata
            priority,
            isOverdue,
            daysUntilDue,
            canEdit: context.canEdit,
        };

        return NextResponse.json({ task: taskResponse });
    } catch (error) {
        console.error("Error fetching task:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const taskId = params.id;

        // Check permissions through task's board
        const context = await getTaskPermissionContext(taskId);

        if (!context.isAuthenticated) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!context.canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        await connectDB();

        const task = await Task.findById(taskId).populate("assigneeId", "_id name email picture");
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const body: UpdateTaskRequest = await request.json();
        const { title, description, assigneeId, startDate, dueDate, labels, isComplete, position } = body;

        // Update title if provided
        if (title !== undefined) {
            if (!title || title.trim().length === 0) {
                return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
            }
            if (title.length > 200) {
                return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 });
            }
            task.title = title.trim();
        }

        // Update description if provided
        if (description !== undefined) {
            if (description && description.length > 2000) {
                return NextResponse.json({ error: "Description must be 2000 characters or less" }, { status: 400 });
            }
            task.description = description?.trim();
        }

        // Update assignee if provided (must be board member)
        if (assigneeId !== undefined) {
            if (assigneeId) {
                const canAssign = await canUserBeAssignedToBoard((context.board as any)._id.toString(), assigneeId);
                if (!canAssign) {
                    return NextResponse.json({ error: "Assignee must be a board member" }, { status: 400 });
                }
                task.assigneeId = assigneeId;
            } else {
                task.assigneeId = null;
            }
        }

        // Update dates if provided
        if (startDate !== undefined) {
            task.startDate = startDate ? new Date(startDate) : null;
        }

        if (dueDate !== undefined) {
            task.dueDate = dueDate ? new Date(dueDate) : null;
        }

        // Validate date constraints after updates
        if (task.startDate && task.dueDate && task.startDate > task.dueDate) {
            return NextResponse.json({ error: "Start date cannot be after due date" }, { status: 400 });
        }

        // Update labels if provided (must exist on board)
        if (labels !== undefined) {
            if (labels.length > 0) {
                const boardLabelIds = context.board.labels.map((label) => label.id);
                const invalidLabels = labels.filter((labelId) => !boardLabelIds.includes(labelId));
                if (invalidLabels.length > 0) {
                    return NextResponse.json(
                        {
                            error: "Invalid label IDs",
                            invalidLabels,
                        },
                        { status: 400 }
                    );
                }
            }
            task.labels = labels;
        }

        // Update completion status if provided
        if (isComplete !== undefined) {
            task.isComplete = isComplete;
        }

        // Update position if provided (Trello-style reordering within column)
        if (position !== undefined && position !== task.position) {
            const oldPosition = task.position;
            const newPosition = position;
            const columnId = task.columnId;

            // Reorder other tasks within the same column
            if (oldPosition < newPosition) {
                // Moving forward - shift tasks between old and new position backward
                await Task.updateMany(
                    {
                        columnId,
                        position: { $gt: oldPosition, $lte: newPosition },
                        _id: { $ne: taskId },
                    },
                    { $inc: { position: -1 } }
                );
            } else {
                // Moving backward - shift tasks between new and old position forward
                await Task.updateMany(
                    {
                        columnId,
                        position: { $gte: newPosition, $lt: oldPosition },
                        _id: { $ne: taskId },
                    },
                    { $inc: { position: 1 } }
                );
            }

            task.position = newPosition;
        }

        await task.save();

        // Re-populate assignee for response
        await task.populate("assigneeId", "_id name email picture");

        // Get resolved labels from board
        const boardLabels = context.board.labels || [];
        const resolvedLabels = task.labels
            .map((labelId: string) => boardLabels.find((label) => label.id === labelId))
            .filter(Boolean);

        const taskResponse = {
            _id: task._id.toString(),
            title: task.title,
            description: task.description,
            assigneeId: task.assigneeId?.toString(),
            assignee: task.assigneeId
                ? {
                      _id: task.assigneeId._id.toString(),
                      name: task.assigneeId.name,
                      email: task.assigneeId.email,
                      picture: task.assigneeId.picture,
                  }
                : undefined,
            startDate: task.startDate,
            dueDate: task.dueDate,
            labels: task.labels,
            boardLabels: resolvedLabels,
            isComplete: task.isComplete,
            columnId: task.columnId.toString(),
            position: task.position,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            priority: task.getPriority(),
            isOverdue: task.isOverdue(),
            daysUntilDue:
                task.dueDate && !task.isComplete
                    ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : undefined,
            canEdit: true,
        };

        // Broadcast task update
        const changes: any = {};
        if (title !== undefined) changes.title = task.title;
        if (description !== undefined) changes.description = task.description;
        if (assigneeId !== undefined) changes.assigneeId = task.assigneeId?.toString();
        if (startDate !== undefined) changes.startDate = task.startDate;
        if (dueDate !== undefined) changes.dueDate = task.dueDate;
        if (labels !== undefined) changes.labels = task.labels;
        if (isComplete !== undefined) changes.isComplete = task.isComplete;
        if (position !== undefined) changes.position = task.position;

        broadcastBoardUpdate((context.board as any)._id.toString(), "task_updated", {
            boardId: (context.board as any)._id.toString(),
            columnId: task.columnId.toString(),
            taskId: task._id.toString(),
            changes,
            updatedBy: (context.user as any)?._id.toString(),
        });

        return NextResponse.json({ task: taskResponse });
    } catch (error) {
        console.error("Error updating task:", error);

        if (error instanceof Error) {
            if (error.message.includes("validation failed")) {
                return NextResponse.json({ error: "Invalid task data" }, { status: 400 });
            }
            if (error.message === "Start date cannot be after due date") {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const taskId = params.id;

        // Check permissions through task's board
        const context = await getTaskPermissionContext(taskId);

        if (!context.isAuthenticated) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!context.canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const task = await Task.findById(taskId);
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const columnId = task.columnId;
        const position = task.position;

        // Broadcast task deletion before deleting
        broadcastBoardUpdate((context.board as any)._id.toString(), "task_deleted", {
            boardId: (context.board as any)._id.toString(),
            columnId: columnId.toString(),
            taskId,
            deletedBy: (context.user as any)?._id.toString(),
        });

        // Delete the task
        await Task.findByIdAndDelete(taskId);

        // Reorder remaining tasks in the column
        await Task.updateMany({ columnId, position: { $gt: position } }, { $inc: { position: -1 } });

        return NextResponse.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
