import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/lib/models/Task";
import Column from "@/lib/models/Column";
import { getTaskPermissionContext } from "@/lib/board-permissions";
import { MoveTaskRequest } from "@/lib/types/task";
import { broadcastBoardUpdate } from "@/lib/websocket/server";

interface RouteParams {
    params: {
        id: string;
    };
}

// POST /api/tasks/[id]/move - Move task between columns or within column
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        const task = await Task.findById(taskId);
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const body: MoveTaskRequest = await request.json();
        const { columnId, position } = body;

        // Validate required fields
        if (!columnId || position === undefined) {
            return NextResponse.json({ error: "columnId and position are required" }, { status: 400 });
        }

        // Validate that the target column exists and belongs to the same board
        const targetColumn = await Column.findById(columnId);
        if (!targetColumn) {
            return NextResponse.json({ error: "Target column not found" }, { status: 404 });
        }

        if (targetColumn.boardId.toString() !== (context.board as any)._id.toString()) {
            return NextResponse.json({ error: "Cannot move task to a different board" }, { status: 400 });
        }

        const sourceColumnId = task.columnId.toString();
        const targetColumnId = columnId;
        const oldPosition = task.position;
        const newPosition = position;

        if (sourceColumnId === targetColumnId) {
            // Moving within the same column
            if (oldPosition === newPosition) {
                // No change needed
                return NextResponse.json({
                    task: {
                        _id: task._id.toString(),
                        columnId: task.columnId.toString(),
                        position: task.position,
                    },
                });
            }

            // Reorder tasks within the same column
            if (oldPosition < newPosition) {
                // Moving forward - shift tasks between old and new position backward
                await Task.updateMany(
                    {
                        columnId: sourceColumnId,
                        position: { $gt: oldPosition, $lte: newPosition },
                        _id: { $ne: taskId },
                    },
                    { $inc: { position: -1 } }
                );
            } else {
                // Moving backward - shift tasks between new and old position forward
                await Task.updateMany(
                    {
                        columnId: sourceColumnId,
                        position: { $gte: newPosition, $lt: oldPosition },
                        _id: { $ne: taskId },
                    },
                    { $inc: { position: 1 } }
                );
            }

            // Update task position
            task.position = newPosition;
            await task.save();
        } else {
            // Moving between different columns - use the static method
            await (Task as any).moveTaskBetweenColumns(
                taskId,
                sourceColumnId,
                targetColumnId,
                oldPosition,
                newPosition
            );

            // Refresh the task to get updated values
            const updatedTask = await Task.findById(taskId);
            if (!updatedTask) {
                return NextResponse.json({ error: "Task not found after move" }, { status: 500 });
            }

            task.columnId = updatedTask.columnId;
            task.position = updatedTask.position;
        }

        // Broadcast task move
        broadcastBoardUpdate((context.board as any)._id.toString(), "task_moved", {
            boardId: (context.board as any)._id.toString(),
            taskId,
            sourceColumnId,
            targetColumnId,
            oldPosition,
            newPosition,
            movedBy: (context.user as any)?._id.toString(),
        });

        // Return updated task basic info
        const taskResponse = {
            _id: task._id.toString(),
            columnId: task.columnId.toString(),
            position: task.position,
            sourceColumnId,
            targetColumnId,
            oldPosition,
            newPosition,
        };

        return NextResponse.json({ task: taskResponse });
    } catch (error) {
        console.error("Error moving task:", error);

        if (error instanceof Error) {
            if (error.message.includes("validation failed")) {
                return NextResponse.json({ error: "Invalid move data" }, { status: 400 });
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
