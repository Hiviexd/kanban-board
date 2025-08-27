"use client";

import { useState, useEffect } from "react";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTaskData";
import { TaskWithMetadata } from "@/lib/types/task";
import { BoardWithMetadata } from "@/lib/types/board";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Tag, Trash2, Save, X, CheckCircle, Circle, AlertTriangle } from "lucide-react";

interface TaskDialogProps {
    task: TaskWithMetadata | null;
    board: BoardWithMetadata;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function TaskDialog({ task, board, open, onOpenChange }: TaskDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [assigneeId, setAssigneeId] = useState<string>("");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
    const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask(board._id);

    // Reset form when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
            setAssigneeId(task.assigneeId || "");
            setStartDate(task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "");
            setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
            setSelectedLabels(task.labels);
            setIsComplete(task.isComplete);
            setHasChanges(false);
        }
    }, [task]);

    const handleSave = () => {
        if (!task) return;

        const updates: any = {};
        if (title !== task.title) updates.title = title;
        if (description !== task.description) updates.description = description;
        if (assigneeId !== task.assigneeId) updates.assigneeId = assigneeId || undefined;
        if (startDate !== (task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "")) {
            updates.startDate = startDate ? new Date(startDate) : undefined;
        }
        if (dueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")) {
            updates.dueDate = dueDate ? new Date(dueDate) : undefined;
        }
        if (JSON.stringify(selectedLabels) !== JSON.stringify(task.labels)) {
            updates.labels = selectedLabels;
        }
        if (isComplete !== task.isComplete) updates.isComplete = isComplete;

        updateTask(
            {
                taskId: task._id,
                updates,
            },
            {
                onSuccess: () => {
                    setHasChanges(false);
                    onOpenChange(false);
                },
            }
        );
    };

    const handleDelete = () => {
        if (!task) return;

        if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
            deleteTask(task._id, {
                onSuccess: () => {
                    onOpenChange(false);
                },
            });
        }
    };

    const handleToggleComplete = () => {
        setIsComplete(!isComplete);
        setHasChanges(true);
    };

    const handleLabelToggle = (labelId: string) => {
        const newLabels = selectedLabels.includes(labelId)
            ? selectedLabels.filter((id) => id !== labelId)
            : [...selectedLabels, labelId];
        setSelectedLabels(newLabels);
        setHasChanges(true);
    };

    // Check if form has changes
    useEffect(() => {
        if (!task) return;

        const titleChanged = title !== task.title;
        const descriptionChanged = description !== (task.description || "");
        const assigneeChanged = assigneeId !== (task.assigneeId || "");
        const startDateChanged =
            startDate !== (task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "");
        const dueDateChanged = dueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
        const labelsChanged = JSON.stringify(selectedLabels) !== JSON.stringify(task.labels);
        const completeChanged = isComplete !== task.isComplete;

        setHasChanges(
            titleChanged ||
                descriptionChanged ||
                assigneeChanged ||
                startDateChanged ||
                dueDateChanged ||
                labelsChanged ||
                completeChanged
        );
    }, [task, title, description, assigneeId, startDate, dueDate, selectedLabels, isComplete]);

    if (!task) return null;

    const priorityColor = {
        high: "text-red-600 dark:text-red-400",
        medium: "text-yellow-600 dark:text-yellow-400",
        low: "text-green-600 dark:text-green-400",
        none: "text-muted-foreground",
    }[task.priority];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <button
                                onClick={handleToggleComplete}
                                className="text-2xl hover:scale-110 transition-transform"
                                disabled={!board.canEdit}>
                                {isComplete ? (
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                ) : (
                                    <Circle className="h-6 w-6 text-muted-foreground" />
                                )}
                            </button>
                            <span className={isComplete ? "line-through text-muted-foreground" : ""}>Task Details</span>
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            {task.isOverdue && !isComplete && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Overdue
                                </Badge>
                            )}
                            <Badge variant="outline" className={priorityColor}>
                                {task.priority} priority
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setHasChanges(true);
                            }}
                            className="w-full p-3 border border-input rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Task title..."
                            disabled={!board.canEdit}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                setHasChanges(true);
                            }}
                            rows={4}
                            className="w-full p-3 border border-input rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            placeholder="Add a description..."
                            disabled={!board.canEdit}
                        />
                    </div>

                    {/* Assignee */}
                    {board.canEdit && (
                        <div>
                            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Assignee
                            </label>
                            <select
                                value={assigneeId}
                                onChange={(e) => {
                                    setAssigneeId(e.target.value);
                                    setHasChanges(true);
                                }}
                                className="w-full p-3 border border-input rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="">Unassigned</option>
                                {/* TODO: Add board members as options */}
                                {task.assignee && <option value={task.assigneeId}>{task.assignee.name}</option>}
                            </select>
                        </div>
                    )}

                    {/* Current Assignee Display */}
                    {task.assignee && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                            <div className="w-8 h-8 rounded-full bg-background border flex items-center justify-center text-sm">
                                {task.assignee.picture ? (
                                    <img
                                        src={task.assignee.picture}
                                        alt={task.assignee.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-muted-foreground font-medium">
                                        {task.assignee.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <div className="font-medium text-foreground">{task.assignee.name}</div>
                                <div className="text-sm text-muted-foreground">{task.assignee.email}</div>
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setHasChanges(true);
                                }}
                                className="w-full p-3 border border-input rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={!board.canEdit}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => {
                                    setDueDate(e.target.value);
                                    setHasChanges(true);
                                }}
                                className="w-full p-3 border border-input rounded-md bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={!board.canEdit}
                            />
                        </div>
                    </div>

                    {/* Labels */}
                    <div>
                        <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Labels
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {board.labels.map((label) => (
                                <button
                                    key={label.id}
                                    onClick={() => board.canEdit && handleLabelToggle(label.id)}
                                    disabled={!board.canEdit}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        selectedLabels.includes(label.id)
                                            ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800"
                                            : ""
                                    }`}
                                    style={{
                                        backgroundColor: label.color,
                                        color: getContrastColor(label.color),
                                    }}>
                                    {label.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Task Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                            <span className="font-medium">Created:</span>{" "}
                            {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                            <span className="font-medium">Updated:</span>{" "}
                            {new Date(task.updatedAt).toLocaleDateString()}
                        </div>
                        {task.daysUntilDue !== undefined && (
                            <div className="col-span-2">
                                <span className="font-medium">Due in:</span> {task.daysUntilDue} days
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                {board.canEdit && (
                    <div className="flex justify-between pt-6 border-t border-border">
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                            <Trash2 className="h-4 w-4" />
                            Delete Task
                        </Button>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={!hasChanges || isUpdating || !title.trim()}
                                className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                {isUpdating ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Helper function to determine text color based on background color
function getContrastColor(hexColor: string): string {
    // Remove # if present
    const hex = hexColor.replace("#", "");

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? "#000000" : "#ffffff";
}
