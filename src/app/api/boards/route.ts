import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Board from "@/lib/models/Board";
import User from "@/lib/models/User";
import { auth0 } from "@/lib/auth0";
import { getUserAccessibleBoards } from "@/lib/board-permissions";
import { CreateBoardRequest } from "@/lib/types/board";
import { broadcastBoardUpdate } from "@/lib/websocket/server";

// GET /api/boards - Get user's accessible boards
export async function GET(_request: NextRequest) {
    try {
        const session = await auth0.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const boards = await getUserAccessibleBoards();

        // Transform boards to include metadata
        const boardsWithMetadata = boards.map((board) => ({
            _id: (board as any)._id.toString(),
            title: board.title,
            description: board.description,
            ownerId: board.ownerId.toString(),
            members: board.members.map((member) => ({
                userId: member.userId.toString(),
                role: member.role,
                joinedAt: member.joinedAt,
            })),
            labels: board.labels,
            isPublic: board.isPublic,
            createdAt: board.createdAt,
            updatedAt: board.updatedAt,
            memberCount: board.members.length + 1, // +1 for owner
        }));

        return NextResponse.json({ boards: boardsWithMetadata });
    } catch (error) {
        console.error("Error fetching boards:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/boards - Create new board
export async function POST(request: NextRequest) {
    try {
        const session = await auth0.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Get user from database
        const user = await User.findOne({ auth0Id: session.user.sub });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body: CreateBoardRequest = await request.json();
        const { title, description, isPublic = false, labels } = body;

        // Validate required fields
        if (!title || title.trim().length === 0) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (title.length > 100) {
            return NextResponse.json({ error: "Title must be 100 characters or less" }, { status: 400 });
        }

        if (description && description.length > 500) {
            return NextResponse.json({ error: "Description must be 500 characters or less" }, { status: 400 });
        }

        // Create new board
        const board = new Board({
            title: title.trim(),
            description: description?.trim(),
            ownerId: user._id,
            members: [], // Owner is not included in members array
            isPublic,
            labels: labels || undefined, // Will use default labels if not provided
        });

        await board.save();

        // Return board with metadata
        const boardResponse = {
            _id: board._id.toString(),
            title: board.title,
            description: board.description,
            ownerId: board.ownerId.toString(),
            members: [],
            labels: board.labels,
            isPublic: board.isPublic,
            createdAt: board.createdAt,
            updatedAt: board.updatedAt,
            memberCount: 1, // Just owner
        };

        // Broadcast board creation (owner will see this when they join)
        broadcastBoardUpdate(board._id.toString(), "board_updated", {
            boardId: board._id.toString(),
            changes: {
                title: board.title,
                description: board.description,
                labels: board.labels,
                isPublic: board.isPublic,
            },
            updatedBy: (user as any)._id.toString(),
        });

        return NextResponse.json({ board: boardResponse }, { status: 201 });
    } catch (error) {
        console.error("Error creating board:", error);

        if (error instanceof Error) {
            // Handle validation errors
            if (error.message.includes("validation failed")) {
                return NextResponse.json({ error: "Invalid board data" }, { status: 400 });
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
