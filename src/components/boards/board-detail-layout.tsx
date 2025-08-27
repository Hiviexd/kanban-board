"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBoard } from "@/hooks/useBoardData";
import { useBoardPresence } from "@/hooks/useBoardPresence";
import { useRealTime } from "@/hooks/useRealTime";
import BoardHeader from "./board-header";
import KanbanBoard from "./kanban-board";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorMessage from "@/components/ui/error-message";

interface BoardDetailLayoutProps {
    boardId: string;
}

export default function BoardDetailLayout({ boardId }: BoardDetailLayoutProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch board data
    const { data: board, isLoading: isBoardLoading, error: boardError, isError: isBoardError } = useBoard(boardId);

    // Join board for presence tracking
    const { users: presentUsers } = useBoardPresence(boardId);

    // Set up real-time updates (WebSocket + SSE fallback)
    useRealTime({
        boardId,
        onBoardUpdate: (data) => {
            console.log("Board updated:", data);
        },
    });

    useEffect(() => {
        if (isBoardError && boardError) {
            // Handle different error types
            if (boardError.message.includes("404") || boardError.message.includes("not found")) {
                router.push("/404");
                return;
            }

            if (boardError.message.includes("403") || boardError.message.includes("Forbidden")) {
                setError("You don't have permission to view this board");
            } else {
                setError("Failed to load board. Please try again.");
            }
        }

        setIsLoading(isBoardLoading);
    }, [isBoardLoading, isBoardError, boardError, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <ErrorMessage
                    message={error}
                    onRetry={() => {
                        setError(null);
                        router.refresh();
                    }}
                />
            </div>
        );
    }

    if (!board) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <ErrorMessage
                    message="Board not found"
                    onRetry={() => router.push("/boards")}
                    retryLabel="Go back to boards"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Board Header */}
            <BoardHeader board={board} presentUsers={presentUsers} />

            {/* Main Board Content */}
            <div className="flex-1 overflow-hidden">
                <KanbanBoard boardId={boardId} board={board} />
            </div>
        </div>
    );
}
