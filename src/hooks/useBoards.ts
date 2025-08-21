import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BoardDisplay } from "@/lib/types/board";

// API functions
const fetchBoards = async (): Promise<BoardDisplay[]> => {
    // TODO: Uncomment when API is ready
    // const response = await fetch("/api/boards");
    // if (!response.ok) {
    //     throw new Error("Failed to fetch boards");
    // }
    // const data = await response.json();
    // return data.boards;

    // Temporary dummy data
    return [
        {
            _id: "1",
            title: "Project Alpha",
            description: "Main development project for Q1",
            memberCount: 5,
            lastActivity: "2 hours ago",
            isPublic: false,
        },
        {
            _id: "2",
            title: "Marketing Campaign",
            description: "Spring marketing campaign planning",
            memberCount: 3,
            lastActivity: "1 day ago",
            isPublic: true,
        },
        {
            _id: "3",
            title: "Bug Tracking",
            description: "Track and fix reported bugs",
            memberCount: 7,
            lastActivity: "3 hours ago",
            isPublic: false,
        },
        {
            _id: "4",
            title: "Design System",
            description: "Create and maintain design components",
            memberCount: 4,
            lastActivity: "5 hours ago",
            isPublic: true,
        },
        {
            _id: "5",
            title: "Content Strategy",
            description: "Plan and execute content marketing",
            memberCount: 2,
            lastActivity: "1 week ago",
            isPublic: false,
        },
    ];
};

const createBoard = async (boardData: Partial<BoardDisplay>): Promise<BoardDisplay> => {
    // TODO: Uncomment when API is ready
    // const response = await fetch("/api/boards", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(boardData),
    // });

    // if (!response.ok) {
    //     throw new Error("Failed to create board");
    // }

    // const data = await response.json();
    // return data.board;

    // Temporary dummy implementation
    const newBoard: BoardDisplay = {
        _id: Date.now().toString(),
        title: boardData.title || "New Board",
        description: boardData.description || "Board description",
        memberCount: boardData.memberCount || 1,
        lastActivity: "Just now",
        isPublic: boardData.isPublic || false,
    };

    return newBoard;
};

const updateBoard = async ({
    boardId,
    updates,
}: {
    boardId: string;
    updates: Partial<BoardDisplay>;
}): Promise<BoardDisplay> => {
    // TODO: Uncomment when API is ready
    // const response = await fetch(`/api/boards/${boardId}`, {
    //     method: "PATCH",
    //     headers: {
    //         "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(updates),
    // });

    // if (!response.ok) {
    //     throw new Error("Failed to update board");
    // }

    // const data = await response.json();
    // return data.board;

    // Temporary dummy implementation
    const updatedBoard: BoardDisplay = {
        _id: boardId,
        title: updates.title || "Updated Board",
        description: updates.description || "Updated description",
        memberCount: updates.memberCount || 1,
        lastActivity: "Just now",
        isPublic: updates.isPublic || false,
    };

    return updatedBoard;
};

const deleteBoard = async (boardId: string): Promise<void> => {
    // TODO: Uncomment when API is ready
    // const response = await fetch(`/api/boards/${boardId}`, {
    //     method: "DELETE",
    // });

    // if (!response.ok) {
    //     throw new Error("Failed to delete board");
    // }

    // Temporary dummy implementation - just simulate success
    console.log("Deleting board:", boardId);
};

// Query keys
export const boardKeys = {
    all: ["boards"] as const,
    lists: () => [...boardKeys.all, "list"] as const,
    list: (filters: string) => [...boardKeys.lists(), { filters }] as const,
    details: () => [...boardKeys.all, "detail"] as const,
    detail: (id: string) => [...boardKeys.details(), id] as const,
};

// Hooks
export const useBoards = () => {
    return useQuery({
        queryKey: boardKeys.lists(),
        queryFn: fetchBoards,
    });
};

export const useBoard = (boardId: string) => {
    return useQuery({
        queryKey: boardKeys.detail(boardId),
        queryFn: async () => {
            const response = await fetch(`/api/boards/${boardId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch board");
            }
            const data = await response.json();
            return data.board;
        },
        enabled: !!boardId,
    });
};

export const useCreateBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBoard,
        onSuccess: (newBoard) => {
            // Add the new board to the list
            queryClient.setQueryData(boardKeys.lists(), (oldData: BoardDisplay[] | undefined) => {
                if (!oldData) return [newBoard];
                return [newBoard, ...oldData];
            });

            // Invalidate and refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
        },
    });
};

export const useUpdateBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateBoard,
        onSuccess: (updatedBoard) => {
            // Update the board in the list
            queryClient.setQueryData(boardKeys.lists(), (oldData: BoardDisplay[] | undefined) => {
                if (!oldData) return [updatedBoard];
                return oldData.map((board) => (board._id === updatedBoard._id ? updatedBoard : board));
            });

            // Update the individual board
            queryClient.setQueryData(boardKeys.detail(updatedBoard._id), updatedBoard);

            // Invalidate and refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
        },
    });
};

export const useDeleteBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBoard,
        onSuccess: (_, boardId) => {
            // Remove the board from the list
            queryClient.setQueryData(boardKeys.lists(), (oldData: BoardDisplay[] | undefined) => {
                if (!oldData) return [];
                return oldData.filter((board) => board._id !== boardId);
            });

            // Remove the individual board
            queryClient.removeQueries({ queryKey: boardKeys.detail(boardId) });

            // Invalidate and refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
        },
    });
};
