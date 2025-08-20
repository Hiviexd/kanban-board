"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, UserRole, UserStatus } from "@/lib/types/user";
import { CalendarDays, Clock, Shield, User as UserIcon, IdCard } from "lucide-react";
import Image from "next/image";
import { formatDate, formatRelativeTime } from "@/lib/date-utils";

interface UserDetailsModalProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function UserDetailsModal({ user, open, onOpenChange }: UserDetailsModalProps) {
    if (!user) return null;

    const getRoleBadgeVariant = (role: UserRole) => {
        return role === UserRole.ADMIN ? "destructive" : "secondary";
    };

    const getStatusBadgeVariant = (status: UserStatus) => {
        return status === UserStatus.ACTIVE ? "default" : "destructive";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        User Details
                    </DialogTitle>
                    <DialogDescription>Detailed information about {user.name}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* User Avatar & Basic Info */}
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        {user.picture ? (
                            <Image
                                src={user.picture}
                                alt={user.name}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1">
                            <h3 className="font-semibold">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    {/* Status & Role */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Shield className="h-4 w-4" />
                                Role
                            </div>
                            <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <UserIcon className="h-4 w-4" />
                                Status
                            </div>
                            <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                        </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <IdCard className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="font-medium">User ID</p>
                                <p className="text-muted-foreground font-mono text-xs">{user._id}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <IdCard className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="font-medium">Auth0 ID</p>
                                <p className="text-muted-foreground font-mono text-xs">{user.auth0Id}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="font-medium">Member Since</p>
                                <p className="text-muted-foreground">{formatDate(user.createdAt)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="font-medium">Last Login</p>
                                <p className="text-muted-foreground">
                                    {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}
                                </p>
                            </div>
                        </div>

                        {user.lastLoginAt && (
                            <div className="flex items-center gap-3 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="font-medium">Last Updated</p>
                                    <p className="text-muted-foreground">{formatDate(user.updatedAt)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
