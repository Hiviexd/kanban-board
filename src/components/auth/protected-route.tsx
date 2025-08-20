"use client";

import { useUser } from "@auth0/nextjs-auth0";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/lib/types/user";

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: UserRole;
    fallback?: ReactNode;
}

export default function ProtectedRoute({ children, requiredRole, fallback }: ProtectedRouteProps) {
    const { user, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/auth/login");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            fallback || (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
                        <p className="text-muted-foreground">Please log in to access this page.</p>
                    </div>
                </div>
            )
        );
    }

    // Note: Role checking is handled server-side in API routes for security
    // This component primarily handles authentication, not authorization
    if (requiredRole === UserRole.ADMIN) {
        // Show a note that admin verification happens server-side
        console.log("Admin role required - verification handled server-side");
    }

    return <>{children}</>;
}
