"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useColumns, useReorderColumns } from "@/hooks/useColumnData";
import { useMoveTask } from "@/hooks/useTaskData";
import { BoardWithMetadata } from "@/lib/types/board";
import { TaskWithMetadata } from "@/lib/types/task";
import Column from "./column";
import CreateColumnCard from "./create-column-card";
import TaskCard from "./task-card";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ErrorMessage from "@/components/ui/error-message";

interface KanbanBoardProps {
    boardId: string;
    board: BoardWithMetadata;
}

export default function KanbanBoard({ boardId, board }: KanbanBoardProps) {
    const [activeItem, setActiveItem] = useState<any>(null);

    // Fetch columns for this board
    const {
        data: columns,
        isLoading: isColumnsLoading,
        error: columnsError,
        isError: isColumnsError,
    } = useColumns(boardId);

    // Move task mutation
    const { mutate: moveTask } = useMoveTask(boardId);

    // Column reordering
    const { reorderColumns } = useReorderColumns(boardId);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveItem(event.active.data.current || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const activeData = active.data.current;

        // Only handle task over column or task over task scenarios for now
        // Column reordering will be handled separately
        if (activeData?.type === "task") {
            // Handle task movement logic here if needed for visual feedback
            // The actual API call will happen in handleDragEnd
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveItem(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // Handle task movement
        if (activeData?.type === "task" && activeData?.task) {
            const activeTask = activeData.task as TaskWithMetadata;

            // Determine target column and position
            let targetColumnId: string;
            let targetPosition: number;

            if (overData?.type === "column" && overData?.column) {
                // Dropped on a column
                targetColumnId = overData.column._id;
                targetPosition = 0; // Add to beginning of column
            } else if (overData?.type === "task" && overData?.task) {
                // Dropped on another task
                const overTask = overData.task as TaskWithMetadata;
                targetColumnId = overTask.columnId;

                // For simplicity, we'll just use the over task's position
                // In a more sophisticated implementation, you'd calculate based on drop position
                targetPosition = overTask.position;
            } else {
                return; // Invalid drop target
            }

            // Only move if we're changing position or column
            if (targetColumnId !== activeTask.columnId || targetPosition !== activeTask.position) {
                moveTask({
                    taskId: activeTask._id,
                    moveData: {
                        columnId: targetColumnId,
                        position: targetPosition,
                    },
                });
            }
        }

        // Handle column reordering
        if (activeData?.type === "column" && overData?.type === "column" && activeData?.column && overData?.column) {
            if (!columns) return;

            const activeColumn = activeData.column;
            const overColumn = overData.column;

            // Find the current positions
            const activeIndex = columns.findIndex((col) => col._id === activeColumn._id);
            const overIndex = columns.findIndex((col) => col._id === overColumn._id);

            if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
                // Call the reorder function with the new position
                try {
                    reorderColumns(columns, activeColumn._id, overIndex);
                } catch (error) {
                    console.error("Failed to reorder columns:", error);
                }
            }
        }
    };

    if (isColumnsLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (isColumnsError) {
        return (
            <div className="flex items-center justify-center h-full">
                <ErrorMessage message={columnsError?.message || "Failed to load board columns"} />
            </div>
        );
    }

    const columnIds = columns?.map((col) => col._id) || [];

    return (
        <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="flex h-full overflow-x-auto overflow-y-hidden p-6 space-x-6">
                <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                    {columns?.map((column) => (
                        <Column
                            key={column._id}
                            column={column}
                            boardId={boardId}
                            board={board}
                            canEdit={board.canEdit}
                        />
                    ))}
                </SortableContext>

                {/* Add new column card */}
                {board.canEdit && <CreateColumnCard boardId={boardId} />}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
                {activeItem?.type === "task" && activeItem?.task ? (
                    <div className="transform rotate-2 scale-105">
                        <div className="bg-card rounded-lg shadow-2xl border-2 border-primary opacity-95">
                            <TaskCard task={activeItem.task} canEdit={board.canEdit} />
                        </div>
                    </div>
                ) : activeItem?.type === "column" && activeItem?.column ? (
                    <div className="transform rotate-1 opacity-95 scale-105">
                        <div className="w-80 bg-card rounded-lg border-2 border-primary shadow-xl">
                            <div className="p-4 border-b border-border">
                                <h3 className="font-medium text-foreground">{activeItem.column.title}</h3>
                            </div>
                            <div className="p-4">
                                <div className="text-sm text-muted-foreground">
                                    {activeItem.column.taskCount || 0} tasks
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
