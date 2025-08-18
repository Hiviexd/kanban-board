"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Ban, Shield } from "lucide-react";
import { User, UserRole, UserStatus } from "@/lib/types/user";

interface AdminStatsProps {
    users: User[];
}

interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    adminUsers: number;
}

export default function AdminStats({ users }: AdminStatsProps) {
    const stats: AdminStats = {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status === UserStatus.ACTIVE).length,
        bannedUsers: users.filter((u) => u.status === UserStatus.BANNED).length,
        adminUsers: users.filter((u) => u.role === UserRole.ADMIN).length,
    };

    return (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">Total registered users</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
                    <Ban className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.bannedUsers}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.bannedUsers > 0 ? "Requires attention" : "All users active"}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.adminUsers}</div>
                    <p className="text-xs text-muted-foreground">System administrators</p>
                </CardContent>
            </Card>
        </div>
    );
}
