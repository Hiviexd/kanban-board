"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTask } from "@/hooks/useTaskData";

interface CreateTaskFormProps {
    columnId: string;
    boardId: string;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function CreateTaskForm({ columnId, boardId, onCancel, onSuccess }: CreateTaskFormProps) {
    const [title, setTitle] = useState("");
    const createTaskMutation = useCreateTask(columnId, boardId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) return;

        try {
            await createTaskMutation.mutateAsync({
                title: title.trim(),
            });

            setTitle("");
            onSuccess();
        } catch (error) {
            console.error("Failed to create task:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-card p-3 rounded-lg border border-border">
            <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this task..."
                className="w-full p-2 text-sm border-none resize-none focus:outline-none bg-transparent"
                rows={3}
                autoFocus
            />

            <div className="flex items-center gap-2 mt-2">
                <Button
                    type="submit"
                    size="sm"
                    disabled={!title.trim() || createTaskMutation.isPending}
                    className="flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    Add task
                </Button>

                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}
