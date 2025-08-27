"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCreateColumn } from "@/hooks/useColumnData";

interface CreateColumnFormProps {
    boardId: string;
    onCancel: () => void;
}

export default function CreateColumnForm({ boardId, onCancel }: CreateColumnFormProps) {
    const [title, setTitle] = useState("");
    const { mutate: createColumn, isPending } = useCreateColumn(boardId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        createColumn(
            {
                title: title.trim(),
            },
            {
                onSuccess: () => {
                    setTitle("");
                    onCancel();
                },
            }
        );
    };

    return (
        <Card className="p-3 bg-slate-100 dark:bg-slate-800">
            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter list title..."
                    className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                    autoFocus
                    maxLength={100}
                />

                <div className="flex items-center gap-2">
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!title.trim() || isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isPending ? "Adding..." : "Add list"}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="text-muted-foreground hover:text-foreground">
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    );
}
