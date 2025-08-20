import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import AdminDashboard from "@/components/admin/admin-dashboard";
import { getAuthContext } from "@/lib/auth-utils";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { User as UserType, UserRole, UserStatus } from "@/lib/types/user";

export default async function AdminPage() {
    const authContext = await getAuthContext();

    if (!authContext.isAuthenticated) {
        redirect("/auth/login");
    }

    if (!authContext.isAdmin) {
        redirect("/");
    }

    let users: UserType[] = [];
    try {
        await connectDB();
        const userDocs = await User.find({}).sort({ createdAt: -1 }).lean();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        users = (userDocs as any[]).map(
            (user): UserType => ({
                _id: user._id.toString(),
                auth0Id: user.auth0Id,
                email: user.email,
                name: user.name,
                picture: user.picture || undefined,
                role: user.role as UserRole,
                status: user.status as UserStatus,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
                lastLoginAt: user.lastLoginAt?.toISOString() || undefined,
            })
        );
    } catch (error) {
        console.error("Failed to fetch users server-side:", error);
    }

    return (
        <MainLayout>
            <AdminDashboard initialUsers={users} />
        </MainLayout>
    );
}
