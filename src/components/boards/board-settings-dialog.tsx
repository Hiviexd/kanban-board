"use client";

import { BoardWithMetadata } from "@/lib/types/board";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BoardSettingsDialogProps {
    board: BoardWithMetadata;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function BoardSettingsDialog({ board, open, onOpenChange }: BoardSettingsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Board Settings</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-muted-foreground">Board settings management coming soon...</p>
                    {/* TODO: Implement board settings management */}
                </div>
            </DialogContent>
        </Dialog>
    );
}
