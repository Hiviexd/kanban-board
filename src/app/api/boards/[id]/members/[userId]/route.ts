import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Board from "@/lib/models/Board";
import User from "@/lib/models/User";
import { requireBoardMemberManagementPermission } from "@/lib/board-permissions";
import { UpdateBoardMemberRequest } from "@/lib/types/board";
import { BoardRole } from "@/lib/types/board";
import { broadcastBoardUpdate } from "@/lib/websocket/server";

interface RouteParams {
    params: {
        id: string;
        userId: string;
    };
}

// PATCH /api/boards/[id]/members/[userId] - Update member role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const boardId = params.id;
        const userId = params.userId;

        // Check permissions - this will throw if not allowed
        const context = await requireBoardMemberManagementPermission(boardId);

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        const body: UpdateBoardMemberRequest = await request.json();
        const { role } = body;

        // Validate required fields
        if (!role) {
            return NextResponse.json({ error: "role is required" }, { status: 400 });
        }

        // Validate role
        if (!Object.values(BoardRole).includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Cannot update to owner role
        if (role === BoardRole.OWNER) {
            return NextResponse.json({ error: "Cannot update user to owner role" }, { status: 400 });
        }

        // Cannot update the actual owner
        if (context.board.ownerId.toString() === userId) {
            return NextResponse.json({ error: "Cannot update board owner role" }, { status: 400 });
        }

        await connectDB();

        // Find the member
        const memberIndex = context.board.members.findIndex((member) => member.userId.toString() === userId);

        if (memberIndex === -1) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Update member role
        context.board.members[memberIndex].role = role;
        await context.board.save();

        // Get user details for response
        const user = await User.findById(userId).select("_id name email picture");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updatedMember = {
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            picture: user.picture,
            role,
            joinedAt: context.board.members[memberIndex].joinedAt,
            isOwner: false,
        };

        // Broadcast member role update
        broadcastBoardUpdate(boardId, "member_role_updated", {
            boardId,
            memberId: userId,
            newRole: role,
            updatedBy: (context.user as any)?._id.toString(),
        });

        return NextResponse.json({ member: updatedMember });
    } catch (error) {
        console.error("Error updating board member:", error);

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

// DELETE /api/boards/[id]/members/[userId] - Remove member from board
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const boardId = params.id;
        const userId = params.userId;

        // Check permissions - this will throw if not allowed
        const context = await requireBoardMemberManagementPermission(boardId);

        if (!context.board) {
            return NextResponse.json({ error: "Board not found" }, { status: 404 });
        }

        // Cannot remove the actual owner
        if (context.board.ownerId.toString() === userId) {
            return NextResponse.json({ error: "Cannot remove board owner" }, { status: 400 });
        }

        await connectDB();

        // Find the member
        const memberIndex = context.board.members.findIndex((member) => member.userId.toString() === userId);

        if (memberIndex === -1) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // Remove member from board
        context.board.members.splice(memberIndex, 1);
        await context.board.save();

        // Broadcast member removal
        broadcastBoardUpdate(boardId, "member_removed", {
            boardId,
            memberId: userId,
            removedBy: (context.user as any)?._id.toString(),
        });

        // TODO: In a production app, you might want to:
        // 1. Unassign the user from all tasks in this board
        // 2. Notify the removed user
        // 3. Create audit logs

        return NextResponse.json({ message: "Member removed successfully" });
    } catch (error) {
        console.error("Error removing board member:", error);

        if (error instanceof Error) {
            if (error.message === "Authentication required") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Insufficient permissions to manage board members") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
