"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateColumnForm from "./create-column-form";

interface CreateColumnCardProps {
    boardId: string;
}

export default function CreateColumnCard({ boardId }: CreateColumnCardProps) {
    const [showForm, setShowForm] = useState(false);

    if (showForm) {
        return <CreateColumnForm boardId={boardId} onCancel={() => setShowForm(false)} />;
    }

    return (
        <div className="flex-shrink-0 w-80">
            <Button
                variant="outline"
                onClick={() => setShowForm(true)}
                className="w-full h-12 flex items-center gap-2 justify-center border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950">
                <Plus className="h-4 w-4" />
                Add another list
            </Button>
        </div>
    );
}
