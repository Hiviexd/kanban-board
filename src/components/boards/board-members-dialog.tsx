"use client";

import { useState } from "react";
import { Search, Plus, UserX, Crown, Edit, Eye } from "lucide-react";
import { BoardWithMetadata } from "@/lib/types/board";
import { useBoardMembers, useAddBoardMember, useUpdateMemberRole, useRemoveBoardMember } from "@/hooks/useBoardMembers";
import { useUserSearch } from "@/hooks/useUserSearch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface BoardMembersDialogProps {
    board: BoardWithMetadata;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function BoardMembersDialog({ board, open, onOpenChange }: BoardMembersDialogProps) {
    const [showAddMember, setShowAddMember] = useState(false);
    const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("editor");

    // Fetch board members
    const { data: members = [], isLoading: isMembersLoading, error: membersError } = useBoardMembers(board._id);

    // User search for adding members
    const { users: searchResults, isLoading: isSearchLoading, searchQuery, setSearchQuery } = useUserSearch();

    // Member mutations
    const addMember = useAddBoardMember(board._id);
    const updateMemberRole = useUpdateMemberRole(board._id);
    const removeMember = useRemoveBoardMember(board._id);

    const handleAddMember = async (userId: string) => {
        try {
            await addMember.mutateAsync({
                userId,
                role: selectedRole,
            });
            setSearchQuery("");
            setShowAddMember(false);
        } catch (error) {
            console.error("Failed to add member:", error);
        }
    };

    const handleUpdateRole = async (userId: string, role: "editor" | "viewer") => {
        try {
            await updateMemberRole.mutateAsync({ userId, updates: { role } });
        } catch (error) {
            console.error("Failed to update role:", error);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        try {
            await removeMember.mutateAsync(userId);
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    const getRoleIcon = (role: string, isOwner: boolean) => {
        if (isOwner) return <Crown className="h-4 w-4 text-yellow-600" />;
        if (role === "editor") return <Edit className="h-4 w-4 text-blue-600" />;
        return <Eye className="h-4 w-4 text-gray-600" />;
    };

    const getRoleLabel = (role: string, isOwner: boolean) => {
        if (isOwner) return "Owner";
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    // Filter out users who are already members
    const availableUsers = searchResults.filter((user) => !members.some((member) => member._id === user._id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Board Members</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add Member Section */}
                    {board.canEdit && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAddMember(!showAddMember)}
                                    className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Member
                                </Button>

                                {showAddMember && (
                                    <Select
                                        value={selectedRole}
                                        onValueChange={(value: "editor" | "viewer") => setSelectedRole(value)}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="editor">Editor</SelectItem>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {showAddMember && (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search users by name or email..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    {searchQuery.length >= 2 && (
                                        <div className="border rounded-lg max-h-48 overflow-y-auto">
                                            {isSearchLoading ? (
                                                <div className="flex justify-center py-4">
                                                    <LoadingSpinner size="sm" />
                                                </div>
                                            ) : availableUsers.length > 0 ? (
                                                <div className="space-y-1 p-2">
                                                    {availableUsers.map((user) => (
                                                        <div
                                                            key={user._id}
                                                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium">
                                                                    {user.picture ? (
                                                                        <img
                                                                            src={user.picture}
                                                                            alt={user.name}
                                                                            className="w-full h-full rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span>{user.name.charAt(0).toUpperCase()}</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm">{user.name}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {user.email}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAddMember(user._id)}
                                                                disabled={addMember.isPending}>
                                                                Add
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-sm text-gray-500">
                                                    No available users found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Members List */}
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                            Members ({members.length})
                        </h3>

                        {isMembersLoading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner />
                            </div>
                        ) : membersError ? (
                            <div className="text-center py-8">
                                <p className="text-red-600 dark:text-red-400 text-sm">Failed to load members</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {members.map((member) => (
                                    <div
                                        key={member._id}
                                        className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium">
                                                {member.picture ? (
                                                    <img
                                                        src={member.picture}
                                                        alt={member.name}
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{member.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-sm text-gray-500">{member.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                                                {getRoleIcon(member.role, member.isOwner)}
                                                <span>{getRoleLabel(member.role, member.isOwner)}</span>
                                            </div>

                                            {board.canEdit && !member.isOwner && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            •••
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateRole(member._id, "editor")}
                                                            disabled={member.role === "editor"}>
                                                            Make Editor
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleUpdateRole(member._id, "viewer")}
                                                            disabled={member.role === "viewer"}>
                                                            Make Viewer
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleRemoveMember(member._id)}
                                                            className="text-red-600 dark:text-red-400">
                                                            <UserX className="h-4 w-4 mr-2" />
                                                            Remove Member
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
