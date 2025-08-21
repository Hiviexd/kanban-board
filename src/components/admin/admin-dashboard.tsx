"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import AdminStats from "./admin-stats";
import UserManagement from "./user-management";
import { Card, CardContent } from "@/components/ui/card";
import { useUsers } from "@/hooks/useUsers";

export default function AdminDashboard() {
    const { data: users = [], isFetching, error, refetch } = useUsers();

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Manage users, roles, and system statistics</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="cursor-pointer">
                        <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <Card className="mb-6 border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error.message}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <AdminStats users={users} />

            {/* User Management Table */}
            <UserManagement />
        </div>
    );
}
