import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { UserRole, UserStatus } from "@/lib/models/User";
import { auth0 } from "@/lib/auth0";
import { requireAdmin } from "@/lib/auth-utils";

interface RouteParams {
    params: {
        userId: string;
    };
}

// GET /api/users/[userId] - Get specific user
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth0.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(params.userId).select("-__v");

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/users/[userId] - Update user role/status (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth0.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        await connectDB();

        const body = await request.json();
        const { role, status } = body;

        // Validate role and status values
        if (role && !Object.values(UserRole).includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        if (status && !Object.values(UserStatus).includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const user = await User.findById(params.userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Update fields if provided
        if (role) user.role = role;
        if (status) user.status = status;

        await user.save();

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/users/[userId] - Delete user (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth0.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const isAdmin = await requireAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        await connectDB();
        const user = await User.findById(params.userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await User.findByIdAndDelete(params.userId);

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
