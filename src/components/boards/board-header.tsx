"use client";

import { useState } from "react";
import { Settings, Users, MoreHorizontal } from "lucide-react";
import { BoardWithMetadata } from "@/lib/types/board";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BoardMembersDialog from "./board-members-dialog";
import BoardSettingsDialog from "./board-settings-dialog";

interface BoardUser {
    id: string;
    name: string;
    picture?: string;
    joinedAt: Date;
}

interface BoardHeaderProps {
    board: BoardWithMetadata;
    presentUsers: BoardUser[];
}

export default function BoardHeader({ board, presentUsers }: BoardHeaderProps) {
    const [showMembersDialog, setShowMembersDialog] = useState(false);
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);

    return (
        <>
            <div className="flex items-center justify-between px-6 py-4 bg-background border-b border-border">
                {/* Left side - Board info */}
                <div className="flex items-center space-x-4">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">{board.title}</h1>
                        {board.description && <p className="text-sm text-muted-foreground mt-1">{board.description}</p>}
                    </div>

                    {/* Public/Private indicator */}
                    <div className="flex items-center space-x-2">
                        <span
                            className={`px-2 py-1 text-xs rounded-full ${
                                board.isPublic
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-gray-200 text-muted-foreground"
                            }`}>
                            {board.isPublic ? "Public" : "Private"}
                        </span>
                    </div>
                </div>

                {/* Right side - Actions and presence */}
                <div className="flex items-center space-x-4">
                    {/* Present users */}
                    {presentUsers.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <div className="flex -space-x-2">
                                {presentUsers.slice(0, 3).map((user) => (
                                    <div
                                        key={user.id}
                                        className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-sm font-medium"
                                        title={user.name}>
                                        {user.picture ? (
                                            <img
                                                src={user.picture}
                                                alt={user.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-muted-foreground font-medium">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {presentUsers.length > 3 && (
                                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                                        +{presentUsers.length - 3}
                                    </div>
                                )}
                            </div>

                            <span className="text-sm text-muted-foreground">
                                {presentUsers.length === 1 ? "1 user online" : `${presentUsers.length} users online`}
                            </span>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2">
                        {board.canEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowMembersDialog(true)}
                                className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Members
                            </Button>
                        )}

                        {board.canEdit && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                                        <Settings className="h-4 w-4 mr-2" />
                                        Board Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => {
                                            // TODO: Implement board deletion
                                            console.log("Delete board");
                                        }}>
                                        Delete Board
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <BoardMembersDialog board={board} open={showMembersDialog} onOpenChange={setShowMembersDialog} />

            <BoardSettingsDialog board={board} open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />
        </>
    );
}
