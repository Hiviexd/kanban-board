import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Column, ColumnWithMetadata, CreateColumnRequest, UpdateColumnRequest } from "@/lib/types/column";

// API functions
const fetchColumns = async (boardId: string): Promise<ColumnWithMetadata[]> => {
    const response = await fetch(`/api/boards/${boardId}/columns`);
    if (!response.ok) {
        throw new Error("Failed to fetch columns");
    }
    const data = await response.json();
    return data.columns;
};

const createColumn = async ({
    boardId,
    columnData,
}: {
    boardId: string;
    columnData: CreateColumnRequest;
}): Promise<ColumnWithMetadata> => {
    const response = await fetch(`/api/boards/${boardId}/columns`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(columnData),
    });
    if (!response.ok) {
        throw new Error("Failed to create column");
    }
    const data = await response.json();
    return data.column;
};

const updateColumn = async ({
    columnId,
    updates,
}: {
    columnId: string;
    updates: UpdateColumnRequest;
}): Promise<ColumnWithMetadata> => {
    const response = await fetch(`/api/columns/${columnId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
    });
    if (!response.ok) {
        throw new Error("Failed to update column");
    }
    const data = await response.json();
    return data.column;
};

const deleteColumn = async (columnId: string): Promise<void> => {
    const response = await fetch(`/api/columns/${columnId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete column");
    }
};

// Hooks
export const useColumns = (boardId: string) => {
    return useQuery({
        queryKey: ["boards", boardId, "columns"],
        queryFn: () => fetchColumns(boardId),
        enabled: !!boardId,
        staleTime: 0, // Always consider stale for real-time updates
        gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    });
};

export const useCreateColumn = (boardId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (columnData: CreateColumnRequest) => createColumn({ boardId, columnData }),
        onSuccess: (newColumn) => {
            // Add the new column to the columns list
            queryClient.setQueryData(["boards", boardId, "columns"], (old: ColumnWithMetadata[] = []) => {
                const sortedColumns = [...old, newColumn].sort((a, b) => a.position - b.position);
                return sortedColumns;
            });
        },
        onError: (error) => {
            console.error("Failed to create column:", error);
        },
    });
};

export const useUpdateColumn = (boardId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateColumn,
        onSuccess: (updatedColumn) => {
            // Update the column in the columns list
            queryClient.setQueryData(["boards", boardId, "columns"], (old: ColumnWithMetadata[] = []) => {
                const updated = old.map((column) => (column._id === updatedColumn._id ? updatedColumn : column));
                return updated.sort((a, b) => a.position - b.position);
            });
        },
        onError: (error) => {
            console.error("Failed to update column:", error);
        },
    });
};

export const useDeleteColumn = (boardId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteColumn,
        onSuccess: (_, columnId) => {
            // Remove the column from the columns list
            queryClient.setQueryData(["boards", boardId, "columns"], (old: ColumnWithMetadata[] = []) =>
                old.filter((column) => column._id !== columnId)
            );

            // Also remove all tasks from this column
            queryClient.removeQueries({
                queryKey: ["columns", columnId, "tasks"],
            });
        },
        onError: (error) => {
            console.error("Failed to delete column:", error);
        },
    });
};

// Utility hook for column reordering
export const useReorderColumns = (boardId: string) => {
    const queryClient = useQueryClient();
    const updateMutation = useUpdateColumn(boardId);

    const reorderColumns = async (columns: ColumnWithMetadata[], draggedId: string, newPosition: number) => {
        // Optimistically update the UI
        const draggedColumn = columns.find((col) => col._id === draggedId);
        if (!draggedColumn) return;

        const reorderedColumns = columns.filter((col) => col._id !== draggedId).slice();

        reorderedColumns.splice(newPosition, 0, { ...draggedColumn, position: newPosition });

        // Update positions
        const updatedColumns = reorderedColumns.map((col, index) => ({
            ...col,
            position: index,
        }));

        // Update the cache optimistically
        queryClient.setQueryData(["boards", boardId, "columns"], updatedColumns);

        try {
            // Update the dragged column's position on the server
            await updateMutation.mutateAsync({
                columnId: draggedId,
                updates: { position: newPosition },
            });
        } catch (error) {
            // Revert on error
            queryClient.invalidateQueries({
                queryKey: ["boards", boardId, "columns"],
            });
            throw error;
        }
    };

    return {
        reorderColumns,
        isReordering: updateMutation.isPending,
    };
};
