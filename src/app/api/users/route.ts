import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { UserRole, UserStatus } from "@/lib/models/User";
import { auth0 } from "@/lib/auth0";
import { requireAdmin } from "@/lib/auth-utils";

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
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
export async function POST(request: NextRequest) {
    try {
        const session = await auth0.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { sub: auth0Id, email, name, picture } = session.user;

        // Check if user already exists
        let user = await User.findOne({ auth0Id });

        if (user) {
            // Update existing user
            user.email = email;
            user.name = name;
            user.picture = picture;
            user.lastLoginAt = new Date();
            await user.save();
        } else {
            // Create new user
            user = new User({
                auth0Id,
                email,
                name,
                picture,
                role: UserRole.USER, // Default role
                status: UserStatus.ACTIVE,
                lastLoginAt: new Date(),
            });
            await user.save();
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error creating/syncing user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
