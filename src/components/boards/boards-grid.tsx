"use client";

import BoardCard from "./board-card";
import CreateBoardCard from "./create-board-card";
import { BoardDisplay } from "@/lib/types/board";

interface BoardsGridProps {
    boards: BoardDisplay[];
    onBoardClick?: (boardId: string) => void;
    onCreateBoard?: () => void;
}

export default function BoardsGrid({ boards, onBoardClick, onCreateBoard }: BoardsGridProps) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
                <BoardCard key={board._id} board={board} onClick={onBoardClick} />
            ))}

            <CreateBoardCard onClick={onCreateBoard} />
        </div>
    );
}
