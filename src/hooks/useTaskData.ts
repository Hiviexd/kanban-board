import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskWithMetadata, CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest } from "@/lib/types/task";

// API functions
const fetchTasks = async (columnId: string): Promise<TaskWithMetadata[]> => {
    const response = await fetch(`/api/columns/${columnId}/tasks`);
    if (!response.ok) {
        throw new Error("Failed to fetch tasks");
    }
    const data = await response.json();
    return data.tasks;
};

const fetchTask = async (taskId: string): Promise<TaskWithMetadata> => {
    const response = await fetch(`/api/tasks/${taskId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch task");
    }
    const data = await response.json();
    return data.task;
};

const createTask = async ({
    columnId,
    taskData,
}: {
    columnId: string;
    taskData: CreateTaskRequest;
}): Promise<TaskWithMetadata> => {
    const response = await fetch(`/api/columns/${columnId}/tasks`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
    });
    if (!response.ok) {
        throw new Error("Failed to create task");
    }
    const data = await response.json();
    return data.task;
};

const updateTask = async ({
    taskId,
    updates,
}: {
    taskId: string;
    updates: UpdateTaskRequest;
}): Promise<TaskWithMetadata> => {
    const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
    });
    if (!response.ok) {
        throw new Error("Failed to update task");
    }
    const data = await response.json();
    return data.task;
};

const moveTask = async ({ taskId, moveData }: { taskId: string; moveData: MoveTaskRequest }): Promise<any> => {
    const response = await fetch(`/api/tasks/${taskId}/move`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(moveData),
    });
    if (!response.ok) {
        throw new Error("Failed to move task");
    }
    const data = await response.json();
    return data.task;
};

const deleteTask = async (taskId: string): Promise<void> => {
    const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete task");
    }
};

// Hooks
export const useTasks = (columnId: string) => {
    return useQuery({
        queryKey: ["columns", columnId, "tasks"],
        queryFn: () => fetchTasks(columnId),
        enabled: !!columnId,
        staleTime: 0, // Always consider stale for real-time updates
        gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    });
};

export const useTask = (taskId: string) => {
    return useQuery({
        queryKey: ["tasks", taskId],
        queryFn: () => fetchTask(taskId),
        enabled: !!taskId,
        staleTime: 0, // Always consider stale for real-time updates
        gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    });
};

export const useCreateTask = (columnId: string, boardId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (taskData: CreateTaskRequest) => createTask({ columnId, taskData }),
        onSuccess: (newTask) => {
            // Add the new task to the tasks list
            queryClient.setQueryData(["columns", columnId, "tasks"], (old: TaskWithMetadata[] = []) => {
                const sortedTasks = [...old, newTask].sort((a, b) => a.position - b.position);
                return sortedTasks;
            });

            // Update column task count
            queryClient.setQueryData(["boards", boardId, "columns"], (old: any[] = []) =>
                old.map((column) => (column._id === columnId ? { ...column, taskCount: column.taskCount + 1 } : column))
            );
        },
        onError: (error) => {
            console.error("Failed to create task:", error);
        },
    });
};

export const useUpdateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateTask,
        onSuccess: (updatedTask) => {
            // Update the task in the specific task query
            queryClient.setQueryData(["tasks", updatedTask._id], updatedTask);

            // Update the task in the column's tasks list
            queryClient.setQueryData(["columns", updatedTask.columnId, "tasks"], (old: TaskWithMetadata[] = []) =>
                old.map((task) => (task._id === updatedTask._id ? updatedTask : task))
            );
        },
        onError: (error) => {
            console.error("Failed to update task:", error);
        },
    });
};

export const useMoveTask = (boardId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: moveTask,
        onMutate: async ({ taskId, moveData }) => {
            const { columnId: targetColumnId, position: targetPosition } = moveData;

            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["columns"] });

            // Get the task we're moving to determine source column
            let sourceColumnId: string | undefined;
            let taskToMove: TaskWithMetadata | undefined;

            // Find the task in all column caches to determine source
            const allQueries = queryClient.getQueriesData({ queryKey: ["columns"] });
            for (const [queryKey, queryData] of allQueries) {
                if (queryKey.length === 3 && queryKey[2] === "tasks" && Array.isArray(queryData)) {
                    const task = queryData.find((t: TaskWithMetadata) => t._id === taskId);
                    if (task) {
                        sourceColumnId = task.columnId;
                        taskToMove = task;
                        break;
                    }
                }
            }

            if (sourceColumnId && targetColumnId && taskToMove) {
                // Remove from source column immediately
                queryClient.setQueryData(["columns", sourceColumnId, "tasks"], (old: TaskWithMetadata[] = []) =>
                    old.filter((task) => task._id !== taskId)
                );

                if (sourceColumnId !== targetColumnId) {
                    // Add to target column immediately with updated data
                    queryClient.setQueryData(["columns", targetColumnId, "tasks"], (old: TaskWithMetadata[] = []) => {
                        const newTask = {
                            ...taskToMove,
                            columnId: targetColumnId,
                            position: targetPosition,
                            // Add visual indicator that this is optimistic
                            _optimistic: true,
                        };

                        // Insert at the correct position
                        const newTasks = [...old];
                        newTasks.splice(targetPosition, 0, newTask);
                        return newTasks;
                    });
                } else {
                    // Moving within same column - reorder
                    queryClient.setQueryData(["columns", sourceColumnId, "tasks"], (old: TaskWithMetadata[] = []) => {
                        const tasks = old.filter((task) => task._id !== taskId);
                        const updatedTask = { ...taskToMove, position: targetPosition };
                        tasks.splice(targetPosition, 0, updatedTask);
                        return tasks;
                    });
                }
            }

            return { sourceColumnId, targetColumnId, taskToMove };
        },
        onSuccess: (movedTask, { moveData }, context) => {
            const { columnId: targetColumnId } = moveData;

            // Replace optimistic data with real server data
            if (context?.sourceColumnId && context.sourceColumnId !== targetColumnId) {
                // For inter-column moves, get fresh data to ensure consistency
                queryClient.invalidateQueries({
                    queryKey: ["columns", context.sourceColumnId, "tasks"],
                });
                queryClient.invalidateQueries({
                    queryKey: ["columns", targetColumnId, "tasks"],
                });

                // Update column task counts (only for inter-column moves)
                queryClient.setQueryData(
                    ["boards", boardId, "columns"],
                    (old: any[] = []) =>
                        old?.map((column) => {
                            if (column._id === context.sourceColumnId) {
                                return { ...column, taskCount: Math.max(0, column.taskCount - 1) };
                            }
                            if (column._id === targetColumnId) {
                                return { ...column, taskCount: column.taskCount + 1 };
                            }
                            return column;
                        }) || []
                );
            } else {
                // For intra-column moves, just refresh the column
                queryClient.invalidateQueries({
                    queryKey: ["columns", targetColumnId, "tasks"],
                });
            }
        },
        onError: (error, variables, context) => {
            console.error("Failed to move task:", error);

            // Invalidate all affected queries to restore correct state
            if (context?.sourceColumnId) {
                queryClient.invalidateQueries({
                    queryKey: ["columns", context.sourceColumnId, "tasks"],
                });
            }
            queryClient.invalidateQueries({
                queryKey: ["columns", variables.moveData.columnId, "tasks"],
            });
        },
    });
};

export const useDeleteTask = (boardId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTask,
        onSuccess: (_, taskId) => {
            // Find which column this task belongs to and remove it
            const columns = queryClient.getQueryData(["boards", boardId, "columns"]) as any[];

            let taskColumnId: string | null = null;

            // Find the column containing this task
            columns?.forEach((column) => {
                const tasks = queryClient.getQueryData(["columns", column._id, "tasks"]) as TaskWithMetadata[];
                const taskExists = tasks?.some((task) => task._id === taskId);
                if (taskExists) {
                    taskColumnId = column._id;
                }
            });

            if (taskColumnId) {
                // Remove the task from the tasks list
                queryClient.setQueryData(["columns", taskColumnId, "tasks"], (old: TaskWithMetadata[] = []) =>
                    old.filter((task) => task._id !== taskId)
                );

                // Update column task count
                queryClient.setQueryData(["boards", boardId, "columns"], (old: any[] = []) =>
                    old.map((column) =>
                        column._id === taskColumnId ? { ...column, taskCount: column.taskCount - 1 } : column
                    )
                );
            }

            // Remove the specific task query
            queryClient.removeQueries({ queryKey: ["tasks", taskId] });
        },
        onError: (error) => {
            console.error("Failed to delete task:", error);
        },
    });
};

// Utility hook for task reordering within a column
export const useReorderTasks = (columnId: string, _boardId: string) => {
    const queryClient = useQueryClient();
    const updateMutation = useUpdateTask();

    const reorderTasks = async (tasks: TaskWithMetadata[], draggedId: string, newPosition: number) => {
        // Optimistically update the UI
        const draggedTask = tasks.find((task) => task._id === draggedId);
        if (!draggedTask) return;

        const reorderedTasks = tasks.filter((task) => task._id !== draggedId).slice();

        reorderedTasks.splice(newPosition, 0, { ...draggedTask, position: newPosition });

        // Update positions
        const updatedTasks = reorderedTasks.map((task, index) => ({
            ...task,
            position: index,
        }));

        // Update the cache optimistically
        queryClient.setQueryData(["columns", columnId, "tasks"], updatedTasks);

        try {
            // Update the dragged task's position on the server
            await updateMutation.mutateAsync({
                taskId: draggedId,
                updates: { position: newPosition },
            });
        } catch (error) {
            // Revert on error
            queryClient.invalidateQueries({
                queryKey: ["columns", columnId, "tasks"],
            });
            throw error;
        }
    };

    return {
        reorderTasks,
        isReordering: updateMutation.isPending,
    };
};
