"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCreateBoard } from "@/hooks/useBoardData";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface CreateBoardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateBoardDialog({ open, onOpenChange }: CreateBoardDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);

    const createBoard = useCreateBoard();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) return;

        try {
            await createBoard.mutateAsync({
                title: title.trim(),
                description: description.trim() || undefined,
                isPublic,
            });

            // Reset form and close dialog
            setTitle("");
            setDescription("");
            setIsPublic(false);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to create board:", error);
        }
    };

    const handleClose = () => {
        if (!createBoard.isPending) {
            setTitle("");
            setDescription("");
            setIsPublic(false);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Board</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Board Title */}
                    <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium text-foreground">
                            Board Title *
                        </label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Product Roadmap"
                            maxLength={100}
                            required
                            disabled={createBoard.isPending}
                        />
                    </div>

                    {/* Board Description */}
                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium text-foreground">
                            Description (optional)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this board about?"
                            rows={3}
                            maxLength={500}
                            disabled={createBoard.isPending}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        />
                    </div>

                    {/* Privacy Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-foreground">Board Visibility</label>
                                <p className="text-xs text-muted-foreground">
                                    {isPublic
                                        ? "Anyone can view this board, but only members can edit."
                                        : "Only board members can view and edit this board."}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`text-sm ${!isPublic ? "font-medium" : "text-muted-foreground"}`}>
                                    Private
                                </span>
                                <Switch
                                    checked={isPublic}
                                    onCheckedChange={setIsPublic}
                                    disabled={createBoard.isPending}
                                />
                                <span className={`text-sm ${isPublic ? "font-medium" : "text-muted-foreground"}`}>
                                    Public
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={createBoard.isPending}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!title.trim() || createBoard.isPending}
                            className="min-w-[100px]">
                            {createBoard.isPending ? (
                                <>
                                    <LoadingSpinner size="sm" />
                                    <span className="ml-2">Creating...</span>
                                </>
                            ) : (
                                "Create Board"
                            )}
                        </Button>
                    </div>
                </form>

                {/* Error Message */}
                {createBoard.isError && (
                    <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                        Failed to create board. Please try again.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
