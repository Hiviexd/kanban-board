import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/main-layout";
import AdminDashboard from "@/components/admin/admin-dashboard";
import { getAuthContext } from "@/lib/auth-utils";

export default async function AdminPage() {
    const authContext = await getAuthContext();

    if (!authContext.isAuthenticated) {
        redirect("/auth/login");
    }

    if (!authContext.isAdmin) {
        redirect("/");
    }

    return (
        <MainLayout>
            <AdminDashboard />
        </MainLayout>
    );
}
