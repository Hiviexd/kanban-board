import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Board, CreateBoardRequest, UpdateBoardRequest, BoardWithMetadata } from "@/lib/types/board";

// API functions
const fetchBoard = async (boardId: string): Promise<BoardWithMetadata> => {
    const response = await fetch(`/api/boards/${boardId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch board");
    }
    const data = await response.json();
    return data.board;
};

const fetchBoards = async (): Promise<Board[]> => {
    const response = await fetch("/api/boards");
    if (!response.ok) {
        throw new Error("Failed to fetch boards");
    }
    const data = await response.json();
    return data.boards;
};

const createBoard = async (boardData: CreateBoardRequest): Promise<Board> => {
    const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(boardData),
    });
    if (!response.ok) {
        throw new Error("Failed to create board");
    }
    const data = await response.json();
    return data.board;
};

const updateBoard = async ({ boardId, updates }: { boardId: string; updates: UpdateBoardRequest }): Promise<Board> => {
    const response = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
    });
    if (!response.ok) {
        throw new Error("Failed to update board");
    }
    const data = await response.json();
    return data.board;
};

const deleteBoard = async (boardId: string): Promise<void> => {
    const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete board");
    }
};

// Hooks
export const useBoards = () => {
    return useQuery({
        queryKey: ["boards"],
        queryFn: fetchBoards,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useBoard = (boardId: string) => {
    return useQuery({
        queryKey: ["boards", boardId],
        queryFn: () => fetchBoard(boardId),
        enabled: !!boardId,
        staleTime: 0, // Always consider stale for real-time updates
        gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    });
};

export const useCreateBoard = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: createBoard,
        onSuccess: (newBoard) => {
            // Update the boards list
            queryClient.setQueryData(["boards"], (old: Board[] = []) => [newBoard, ...old]);

            // Navigate to the new board
            router.push(`/boards/${newBoard._id}`);
        },
        onError: (error) => {
            console.error("Failed to create board:", error);
        },
    });
};

export const useUpdateBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateBoard,
        onSuccess: (updatedBoard, { boardId }) => {
            // Update the specific board
            queryClient.setQueryData(["boards", boardId], updatedBoard);

            // Update the board in the boards list
            queryClient.setQueryData(["boards"], (old: Board[] = []) =>
                old.map((board) => (board._id === boardId ? updatedBoard : board))
            );
        },
        onError: (error) => {
            console.error("Failed to update board:", error);
        },
    });
};

export const useDeleteBoard = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: deleteBoard,
        onSuccess: (_, boardId) => {
            // Remove from boards list
            queryClient.setQueryData(["boards"], (old: Board[] = []) => old.filter((board) => board._id !== boardId));

            // Remove the specific board query
            queryClient.removeQueries({ queryKey: ["boards", boardId] });

            // Navigate to boards list (safe to do from any context)
            router.push("/boards");
        },
        onError: (error) => {
            console.error("Failed to delete board:", error);
        },
    });
};
