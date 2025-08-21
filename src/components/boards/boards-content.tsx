"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import BoardsHeader from "./boards-header";
import BoardsStats from "./boards-stats";
import BoardsGrid from "./boards-grid";
import { BoardDisplay } from "@/lib/types/board";

interface BoardsContentProps {
    boards: BoardDisplay[];
}

export default function BoardsContent({ boards }: BoardsContentProps) {
    const [error, setError] = useState<string | null>(null);

    const handleCreateBoard = () => {
        // TODO: Implement create board functionality
        console.log("Create board clicked");
    };

    const handleBoardClick = (boardId: string) => {
        // TODO: Implement board navigation
        console.log("Board clicked:", boardId);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Error Message */}
            {error && (
                <Card className="mb-6 border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <BoardsHeader onCreateBoard={handleCreateBoard} />
            <BoardsStats boards={boards} />
            <BoardsGrid boards={boards} onBoardClick={handleBoardClick} onCreateBoard={handleCreateBoard} />
        </div>
    );
}
