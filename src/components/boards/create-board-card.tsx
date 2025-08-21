"use client";

import { Plus } from "lucide-react";

interface CreateBoardCardProps {
    onClick?: () => void;
}

export default function CreateBoardCard({ onClick }: CreateBoardCardProps) {
    return (
        <div
            className="bg-card border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={onClick}>
            <div className="bg-primary/10 rounded-full p-3 mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Create New Board</h3>
            <p className="text-sm text-muted-foreground">Start a new project and invite your team</p>
        </div>
    );
}
