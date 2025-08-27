"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TaskWithMetadata } from "@/lib/types/task";

interface TaskCardProps {
    task: TaskWithMetadata;
    canEdit: boolean;
    onClick?: () => void;
}

export default function TaskCard({ task, canEdit, onClick }: TaskCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task._id,
        data: {
            type: "task",
            task,
        },
        disabled: !canEdit,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't handle click if dragging
        if (isDragging) return;

        // Always allow opening the dialog (regardless of edit permissions)
        if (onClick) {
            e.preventDefault();
            e.stopPropagation();
            onClick();
        }
    };

    const handleDragHandleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click when clicking drag handle
    };

    // Apply visual feedback for dragging state and optimistic updates
    const isOptimistic = (task as any)._optimistic;
    const cardClasses = `bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200 flex ${
        isDragging ? "opacity-50 shadow-lg" : ""
    } ${isOptimistic ? "opacity-75 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10" : ""}`;

    return (
        <div ref={setNodeRef} style={style} {...attributes} className={cardClasses}>
            {/* Main clickable content area */}
            <div onClick={handleCardClick} className={`flex-1 p-3 ${onClick ? "cursor-pointer" : "cursor-default"}`}>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{task.title}</h4>

                {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{task.description}</p>
                )}

                {task.assignee && (
                    <div className="flex items-center mt-2">
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                            {task.assignee.picture ? (
                                <img
                                    src={task.assignee.picture}
                                    alt={task.assignee.name}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-gray-700 dark:text-gray-300">
                                    {task.assignee.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Drag handle - only visible when canEdit is true */}
            {canEdit && (
                <div
                    {...listeners}
                    onClick={handleDragHandleClick}
                    className="flex items-center justify-center w-8 p-2 cursor-grab active:cursor-grabbing border-l border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Drag to move task">
                    <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
            )}
        </div>
    );
}
