import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Board from "@/lib/models/Board";
import User from "@/lib/models/User";
import { requireBoardMemberManagementPermission, requireBoardViewPermission } from "@/lib/board-permissions";
import { AddBoardMemberRequest } from "@/lib/types/board";
import { BoardRole } from "@/lib/types/board";
import { broadcastBoardUpdate } from "@/lib/websocket/server";

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/boards/[id]/members - Get board members
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const boardId = params.id;

        // Check permissions - this will throw if not allowed
        const context = await requireBoardViewPermission(boardId);

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        await connectDB();

        // Get owner details
        const owner = await User.findById(context.board.ownerId).select("_id name email picture");
        if (!owner) {
            return NextResponse.json({ error: "Board owner not found" }, { status: 500 });
        }

        // Get member details
        const memberIds = context.board.members.map((member) => member.userId);
        const memberUsers = await User.find({ _id: { $in: memberIds } }).select("_id name email picture");

        // Combine owner and members with roles
        const members = [
            {
                userId: owner._id.toString(),
                name: owner.name,
                email: owner.email,
                picture: owner.picture,
                role: BoardRole.OWNER,
                joinedAt: context.board.createdAt, // Owner joined when board was created
                isOwner: true,
            },
            ...context.board.members.map((member) => {
                const memberUser = memberUsers.find((user) => user._id.toString() === member.userId.toString());
                return {
                    userId: member.userId.toString(),
                    name: memberUser?.name || "Unknown User",
                    email: memberUser?.email || "",
                    picture: memberUser?.picture,
                    role: member.role,
                    joinedAt: member.joinedAt,
                    isOwner: false,
                };
            }),
        ];

        return NextResponse.json({ members });
    } catch (error) {
        console.error("Error fetching board members:", error);

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

// POST /api/boards/[id]/members - Add member to board
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const boardId = params.id;

        // Check permissions - this will throw if not allowed
        const context = await requireBoardMemberManagementPermission(boardId);

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        const body: AddBoardMemberRequest = await request.json();
        const { userId, role } = body;

        // Validate required fields
        if (!userId || !role) {
            return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
        }

        // Validate role
        if (!Object.values(BoardRole).includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Cannot add owner role
        if (role === BoardRole.OWNER) {
            return NextResponse.json({ error: "Cannot add user as owner" }, { status: 400 });
        }

        await connectDB();

        // Check if user exists
        const userToAdd = await User.findById(userId);
        if (!userToAdd) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user is already the owner
        if (context.board.ownerId.toString() === userId) {
            return NextResponse.json({ error: "User is already the board owner" }, { status: 400 });
        }

        // Check if user is already a member
        const existingMember = context.board.members.find((member) => member.userId.toString() === userId);
        if (existingMember) {
            return NextResponse.json({ error: "User is already a member of this board" }, { status: 400 });
        }

        // Add member to board
        context.board.members.push({
            userId: userToAdd._id,
            role,
            joinedAt: new Date(),
        });

        await context.board.save();

        // Return added member details
        const addedMember = {
            userId: userToAdd._id.toString(),
            name: userToAdd.name,
            email: userToAdd.email,
            picture: userToAdd.picture,
            role,
            joinedAt: new Date(),
            isOwner: false,
        };

        // Broadcast member addition
        broadcastBoardUpdate(boardId, "member_added", {
            boardId,
            member: addedMember,
            addedBy: (context.user as any)?._id.toString(),
        });

        return NextResponse.json({ member: addedMember }, { status: 201 });
    } catch (error) {
        console.error("Error adding board member:", error);

        if (error instanceof Error) {
            if (error.message === "Authentication required") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Insufficient permissions to manage board members") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            if (error.message.includes("validation failed")) {
                return NextResponse.json({ error: "Invalid member data" }, { status: 400 });
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
