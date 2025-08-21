"use client";

import BoardCard from "./board-card";
import CreateBoardCard from "./create-board-card";
import { useBoards } from "@/hooks/useBoards";

interface BoardsGridProps {
    onBoardClick?: (boardId: string) => void;
    onCreateBoard?: () => void;
}

export default function BoardsGrid({ onBoardClick, onCreateBoard }: BoardsGridProps) {
    const { data: boards = [] } = useBoards();

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
                <BoardCard key={board._id} board={board} onClick={onBoardClick} />
            ))}

            <CreateBoardCard onClick={onCreateBoard} />
        </div>
    );
}
