"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BoardsHeaderProps {
    onCreateBoard?: () => void;
}

export default function BoardsHeader({ onCreateBoard }: BoardsHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">My Boards</h1>
                <p className="text-muted-foreground">Manage and organize your kanban boards</p>
            </div>
            <Button onClick={onCreateBoard}>
                <Plus className="h-4 w-4 mr-2" />
                Create Board
            </Button>
        </div>
    );
}
