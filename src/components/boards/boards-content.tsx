"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import BoardsHeader from "./boards-header";
import BoardsStats from "./boards-stats";
import BoardsGrid from "./boards-grid";
import CreateBoardDialog from "./create-board-dialog";
import { useBoards } from "@/hooks/useBoardData";

export default function BoardsContent() {
    const router = useRouter();
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const { data: boards = [], isLoading, error } = useBoards();

    const handleCreateBoard = () => {
        setShowCreateDialog(true);
    };

    const handleBoardClick = (boardId: string) => {
        router.push(`/boards/${boardId}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
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

            <BoardsHeader onCreateBoard={handleCreateBoard} />
            <BoardsStats />
            <BoardsGrid onBoardClick={handleBoardClick} onCreateBoard={handleCreateBoard} />

            {/* Create Board Dialog */}
            <CreateBoardDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
        </div>
    );
}
