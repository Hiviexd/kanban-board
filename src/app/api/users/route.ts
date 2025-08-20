import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { auth0 } from "@/lib/auth0";
import { requireAdmin, syncUserFromAuth0 } from "@/lib/auth-utils";

// GET /api/users - Get all users (admin only)
export async function GET(_request: NextRequest) {
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

        const users = await User.find({}).select("-__v").sort({ createdAt: -1 });

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/users - Create or sync user from Auth0
export async function POST(_request: NextRequest) {
    try {
        const session = await auth0.getSession();

        if (!session?.user) {
            console.log("No session or user found in POST /api/users");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("Syncing user from Auth0:", session.user.email);

        const user = await syncUserFromAuth0();

        if (!user) {
            console.error("Failed to sync user from Auth0");
            return NextResponse.json({ error: "Failed to create/sync user" }, { status: 500 });
        }

        console.log("User synced successfully:", user.email);
        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error in POST /api/users:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
