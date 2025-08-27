import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

interface SearchUsersResponse {
    users: {
        _id: string;
        name: string;
        email: string;
        picture?: string;
    }[];
}

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50); // Max 50 results

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
        }

        await connectDB();

        // Search users by name or email (case-insensitive)
        const searchRegex = new RegExp(query.trim(), "i");
        const users = await User.find({
            $or: [{ name: searchRegex }, { email: searchRegex }],
        })
            .select("_id name email picture")
            .limit(limit)
            .lean();

        const response: SearchUsersResponse = {
            users: users.map((user) => ({
                _id: (user as any)._id.toString(),
                name: user.name,
                email: user.email,
                picture: user.picture,
            })),
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Search users error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
