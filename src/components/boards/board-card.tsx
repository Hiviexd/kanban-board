"use client";

import { Users } from "lucide-react";
import { BoardWithMetadata } from "@/lib/types/board";

interface BoardCardProps {
    board: BoardWithMetadata;
    onClick?: (boardId: string) => void;
}

export default function BoardCard({ board, onClick }: BoardCardProps) {
    const handleClick = () => {
        onClick?.(board._id);
    };

    return (
        <div
            className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={handleClick}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{board.title}</h3>
                {board.isPublic && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Public</span>
                )}
            </div>

            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{board.description}</p>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{board.memberCount} members</span>
                </div>
                <span>
                    {board.lastActivity
                        ? board.lastActivity instanceof Date
                            ? board.lastActivity.toLocaleDateString()
                            : board.lastActivity
                        : "No activity"}
                </span>
            </div>
        </div>
    );
}
