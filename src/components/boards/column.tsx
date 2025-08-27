"use client";

import { useState } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Plus } from "lucide-react";
import { ColumnWithMetadata } from "@/lib/types/column";
import { BoardWithMetadata } from "@/lib/types/board";
import { TaskWithMetadata } from "@/lib/types/task";
import { useTasks } from "@/hooks/useTaskData";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TaskCard from "./task-card";
import CreateTaskForm from "./create-task-form";
import TaskDialog from "./task-dialog";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface ColumnProps {
    column: ColumnWithMetadata;
    boardId: string;
    board: BoardWithMetadata;
    canEdit: boolean;
}

export default function Column({ column, boardId, board, canEdit }: ColumnProps) {
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskWithMetadata | null>(null);
    const [showTaskDialog, setShowTaskDialog] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: column._id,
        data: {
            type: "column",
            column,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Fetch tasks for this column
    const { data: tasks, isLoading: isTasksLoading, error: tasksError } = useTasks(column._id);

    // Create droppable for this column's tasks
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `column-${column._id}`,
        data: {
            type: "column",
            column,
        },
    });

    // Get task IDs for SortableContext
    const taskIds = tasks?.map((task) => task._id) || [];

    const handleTaskClick = (task: TaskWithMetadata) => {
        setSelectedTask(task);
        setShowTaskDialog(true);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex flex-col w-80 bg-gray-50 dark:bg-gray-800 rounded-lg ${isDragging ? "opacity-50" : ""}`}>
            {/* Column Header */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing">
                <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{column.title}</h3>
                    <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        {tasks?.length || 0}
                    </span>
                </div>

                {canEdit && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Rename Column</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 dark:text-red-400">
                                Delete Column
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Tasks */}
            <div
                ref={setDroppableRef}
                className={`flex-1 p-4 space-y-3 overflow-y-auto max-h-96 min-h-[200px] transition-all duration-200 ${
                    isOver
                        ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600"
                        : ""
                }`}>
                {isTasksLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : tasksError ? (
                    <div className="text-center py-8">
                        <p className="text-red-600 dark:text-red-400 text-sm">Failed to load tasks</p>
                    </div>
                ) : tasks && tasks.length > 0 ? (
                    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    canEdit={canEdit}
                                    onClick={() => handleTaskClick(task)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                ) : (
                    <div
                        className={`text-center py-8 rounded-lg transition-all duration-200 ${
                            isOver
                                ? "bg-blue-100 dark:bg-blue-800/30 border-2 border-dashed border-blue-400 dark:border-blue-500"
                                : ""
                        }`}>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {isOver ? "Drop task here" : "No tasks yet"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {canEdit && !isOver ? "Add a task below or drag one here" : ""}
                        </p>
                    </div>
                )}

                {/* Create Task Form */}
                {showCreateTask && (
                    <CreateTaskForm
                        columnId={column._id}
                        boardId={boardId}
                        onCancel={() => setShowCreateTask(false)}
                        onSuccess={() => setShowCreateTask(false)}
                    />
                )}
            </div>

            {/* Add Task Button */}
            {canEdit && !showCreateTask && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCreateTask(true)}
                        className="w-full flex items-center gap-2 justify-start">
                        <Plus className="h-4 w-4" />
                        Add a task
                    </Button>
                </div>
            )}

            {/* Task Dialog */}
            <TaskDialog task={selectedTask} board={board} open={showTaskDialog} onOpenChange={setShowTaskDialog} />
        </div>
    );
}
