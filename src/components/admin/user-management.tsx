"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Shield, Ban, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { User, UserRole, UserStatus } from "@/lib/types/user";
import UserDetailsModal from "./user-details-modal";
import { formatDate, formatRelativeTime } from "@/lib/date-utils";
import { useUsers, useUpdateUserRole, useUpdateUserStatus, useDeleteUser } from "@/hooks/useUsers";

export default function UserManagement() {
    const { data: users = [], refetch } = useUsers();
    const updateUserRole = useUpdateUserRole();
    const updateUserStatus = useUpdateUserStatus();
    const deleteUser = useDeleteUser();

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userDetailsOpen, setUserDetailsOpen] = useState(false);

    // Update user role
    const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
        try {
            updateUserRole.mutate(userId, newRole);
        } catch (err) {
            console.error("Failed to update user role:", err);
        }
    };

    // Toggle user ban status
    const handleToggleUserBan = async (userId: string, currentStatus: UserStatus) => {
        try {
            const newStatus = currentStatus === UserStatus.ACTIVE ? UserStatus.BANNED : UserStatus.ACTIVE;
            updateUserStatus.mutate(userId, newStatus);
        } catch (err) {
            console.error("Failed to update user status:", err);
        }
    };

    // Delete user
    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
        }

        try {
            deleteUser.mutate(userId);
        } catch (err) {
            console.error("Failed to delete user:", err);
        }
    };

    // Open user details modal
    const openUserDetails = (user: User) => {
        setSelectedUser(user);
        setUserDetailsOpen(true);
    };

    const getRoleBadgeVariant = (role: UserRole) => {
        return role === UserRole.ADMIN ? "destructive" : "secondary";
    };

    const getStatusBadgeVariant = (status: UserStatus) => {
        return status === UserStatus.ACTIVE ? "default" : "destructive";
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl mb-2">User Management</CardTitle>
                        <CardDescription>View and manage all registered users and their permissions</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Error Messages */}
                {(updateUserRole.error || updateUserStatus.error || deleteUser.error) && (
                    <div className="mb-4 p-3 border border-destructive rounded-md">
                        <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                                {updateUserRole.error?.message ||
                                    updateUserStatus.error?.message ||
                                    deleteUser.error?.message ||
                                    "An error occurred"}
                            </span>
                        </div>
                    </div>
                )}

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user._id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.name}</span>
                                            <span className="text-sm text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatRelativeTime(user.lastLoginAt)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(user.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 cursor-pointer"
                                                    disabled={
                                                        updateUserRole.isPending ||
                                                        updateUserStatus.isPending ||
                                                        deleteUser.isPending
                                                    }>
                                                    {updateUserRole.isPending ||
                                                    updateUserStatus.isPending ||
                                                    deleteUser.isPending ? (
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openUserDetails(user)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>

                                                {/* Role change options */}
                                                {user.role !== UserRole.ADMIN && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateUserRole(user._id, UserRole.ADMIN)}>
                                                        <Shield className="mr-2 h-4 w-4" />
                                                        Make Admin
                                                    </DropdownMenuItem>
                                                )}
                                                {user.role !== UserRole.USER && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateUserRole(user._id, UserRole.USER)}>
                                                        <Shield className="mr-2 h-4 w-4" />
                                                        Remove Admin
                                                    </DropdownMenuItem>
                                                )}

                                                {/* Ban/Unban option */}
                                                <DropdownMenuItem
                                                    onClick={() => handleToggleUserBan(user._id, user.status)}>
                                                    <Ban className="mr-2 h-4 w-4" />
                                                    {user.status === UserStatus.ACTIVE ? "Ban User" : "Unban User"}
                                                </DropdownMenuItem>

                                                {/* Delete option */}
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            {/* User Details Modal */}
            <UserDetailsModal user={selectedUser} open={userDetailsOpen} onOpenChange={setUserDetailsOpen} />
        </Card>
    );
}
