import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";
import { getColumnPermissionContext, canUserBeAssignedToBoard } from "@/lib/board-permissions";
import { CreateTaskRequest } from "@/lib/types/task";
import { broadcastBoardUpdate } from "@/lib/websocket/server";

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/columns/[id]/tasks - Get column tasks
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

        // Get tasks for this column, sorted by position
        const tasks = await Task.find({ columnId })
            .sort({ position: 1 })
            .populate("assigneeId", "_id name email picture");

        // Transform tasks to include metadata
        const tasksWithMetadata = await Promise.all(
            tasks.map(async (task) => {
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

                return {
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
            })
        );

        return NextResponse.json({ tasks: tasksWithMetadata });
    } catch (error) {
        console.error("Error fetching column tasks:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/columns/[id]/tasks - Create new task
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        const body: CreateTaskRequest = await request.json();
        const { title, description, assigneeId, startDate, dueDate, labels, position } = body;

        // Validate required fields
        if (!title || title.trim().length === 0) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (title.length > 200) {
            return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 });
        }

        if (description && description.length > 2000) {
            return NextResponse.json({ error: "Description must be 2000 characters or less" }, { status: 400 });
        }

        await connectDB();

        // Validate assignee (must be board member)
        if (assigneeId) {
            const canAssign = await canUserBeAssignedToBoard((context.board as any)._id.toString(), assigneeId);
            if (!canAssign) {
                return NextResponse.json({ error: "Assignee must be a board member" }, { status: 400 });
            }
        }

        // Validate labels (must exist on board)
        if (labels && labels.length > 0) {
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

        // Validate date constraints
        if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
            return NextResponse.json({ error: "Start date cannot be after due date" }, { status: 400 });
        }

        // Determine position - if not provided, add to end
        let taskPosition = position;
        if (taskPosition === undefined) {
            taskPosition = await (Task as any).getNextPosition(columnId);
        } else {
            // If position is provided, make space for it
            await Task.updateMany({ columnId, position: { $gte: taskPosition } }, { $inc: { position: 1 } });
        }

        // Create new task
        const task = new Task({
            title: title.trim(),
            description: description?.trim(),
            assigneeId: assigneeId || null,
            startDate: startDate ? new Date(startDate) : null,
            dueDate: dueDate ? new Date(dueDate) : null,
            labels: labels || [],
            columnId,
            position: taskPosition,
        });

        await task.save();

        // Populate assignee for response
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

        // Broadcast task creation
        broadcastBoardUpdate((context.board as any)._id.toString(), "task_created", {
            boardId: (context.board as any)._id.toString(),
            columnId,
            task: taskResponse,
            createdBy: (context.user as any)?._id.toString(),
        });

        return NextResponse.json({ task: taskResponse }, { status: 201 });
    } catch (error) {
        console.error("Error creating task:", error);

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
