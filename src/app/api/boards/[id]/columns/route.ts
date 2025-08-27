import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Column from "@/lib/models/Column";
import { requireBoardViewPermission, requireBoardEditPermission } from "@/lib/board-permissions";
import { CreateColumnRequest } from "@/lib/types/column";
import { broadcastBoardUpdate } from "@/lib/websocket/server";

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/boards/[id]/columns - Get board columns
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const boardId = params.id;

        // Check permissions - this will throw if not allowed
        const context = await requireBoardViewPermission(boardId);

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        await connectDB();

        // Get columns for this board, sorted by position
        const columns = await Column.find({ boardId }).sort({ position: 1 });

        // Transform columns to include metadata
        const columnsWithMetadata = columns.map((column) => ({
            _id: column._id.toString(),
            title: column.title,
            position: column.position,
            boardId: column.boardId.toString(),
            createdAt: column.createdAt,
            updatedAt: column.updatedAt,
            // Add metadata
            taskCount: 0, // We'll populate this later when we have tasks
            canEdit: context.canEdit,
        }));

        return NextResponse.json({ columns: columnsWithMetadata });
    } catch (error) {
        console.error("Error fetching board columns:", error);

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

// POST /api/boards/[id]/columns - Create new column
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const boardId = params.id;

        // Check permissions - this will throw if not allowed
        const context = await requireBoardEditPermission(boardId);

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        const body: CreateColumnRequest = await request.json();
        const { title, position } = body;

        // Validate required fields
        if (!title || title.trim().length === 0) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (title.length > 100) {
            return NextResponse.json({ error: "Title must be 100 characters or less" }, { status: 400 });
        }

        await connectDB();

        // Determine position - if not provided, add to end
        let columnPosition = position;
        if (columnPosition === undefined) {
            columnPosition = await (Column as any).getNextPosition(boardId);
        } else {
            // If position is provided, make space for it
            await Column.updateMany({ boardId, position: { $gte: columnPosition } }, { $inc: { position: 1 } });
        }

        // Create new column
        const column = new Column({
            title: title.trim(),
            position: columnPosition,
            boardId,
        });

        await column.save();

        // Return column with metadata
        const columnResponse = {
            _id: column._id.toString(),
            title: column.title,
            position: column.position,
            boardId: column.boardId.toString(),
            createdAt: column.createdAt,
            updatedAt: column.updatedAt,
            taskCount: 0,
            canEdit: true,
        };

        // Broadcast column creation
        broadcastBoardUpdate(boardId, "column_created", {
            boardId,
            column: columnResponse,
            createdBy: (context.user as any)?._id.toString(),
        });

        return NextResponse.json({ column: columnResponse }, { status: 201 });
    } catch (error) {
        console.error("Error creating column:", error);

        if (error instanceof Error) {
            if (error.message === "Authentication required") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Insufficient permissions to edit this board") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            if (error.message.includes("validation failed")) {
                return NextResponse.json({ error: "Invalid column data" }, { status: 400 });
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
