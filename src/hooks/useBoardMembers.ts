import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BoardMember {
    _id: string;
    name: string;
    email: string;
    picture?: string;
    role: "owner" | "editor" | "viewer";
    isOwner: boolean;
}

interface AddMemberRequest {
    userId: string;
    role: "editor" | "viewer";
}

interface UpdateMemberRequest {
    role: "editor" | "viewer";
}

// API functions
const fetchBoardMembers = async (boardId: string): Promise<BoardMember[]> => {
    const response = await fetch(`/api/boards/${boardId}/members`);
    if (!response.ok) {
        throw new Error("Failed to fetch board members");
    }
    const data = await response.json();
    return data.members;
};

const addBoardMember = async ({
    boardId,
    memberData,
}: {
    boardId: string;
    memberData: AddMemberRequest;
}): Promise<BoardMember> => {
    const response = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(memberData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add member");
    }
    const data = await response.json();
    return data.member;
};

const updateMemberRole = async ({
    boardId,
    userId,
    updates,
}: {
    boardId: string;
    userId: string;
    updates: UpdateMemberRequest;
}): Promise<BoardMember> => {
    const response = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update member role");
    }
    const data = await response.json();
    return data.member;
};

const removeBoardMember = async ({ boardId, userId }: { boardId: string; userId: string }): Promise<void> => {
    const response = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove member");
    }
};

// Hooks
export const useBoardMembers = (boardId: string) => {
    return useQuery({
        queryKey: ["boards", boardId, "members"],
        queryFn: () => fetchBoardMembers(boardId),
        enabled: !!boardId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};

export const useAddBoardMember = (boardId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (memberData: AddMemberRequest) => addBoardMember({ boardId, memberData }),
        onSuccess: (newMember) => {
            // Add the new member to the members list
            queryClient.setQueryData(["boards", boardId, "members"], (old: BoardMember[] = []) => {
                return [...old, newMember];
            });

            // Invalidate board data to refresh member count
            queryClient.invalidateQueries({
                queryKey: ["boards", boardId],
            });
        },
        onError: (error) => {
            console.error("Failed to add member:", error);
        },
    });
};

export const useUpdateMemberRole = (boardId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, updates }: { userId: string; updates: UpdateMemberRequest }) =>
            updateMemberRole({ boardId, userId, updates }),
        onSuccess: (updatedMember) => {
            // Update the member in the members list
            queryClient.setQueryData(["boards", boardId, "members"], (old: BoardMember[] = []) => {
                return old.map((member) => (member._id === updatedMember._id ? updatedMember : member));
            });
        },
        onError: (error) => {
            console.error("Failed to update member role:", error);
        },
    });
};

export const useRemoveBoardMember = (boardId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => removeBoardMember({ boardId, userId }),
        onSuccess: (_, userId) => {
            // Remove the member from the members list
            queryClient.setQueryData(["boards", boardId, "members"], (old: BoardMember[] = []) =>
                old.filter((member) => member._id !== userId)
            );

            // Invalidate board data to refresh member count
            queryClient.invalidateQueries({
                queryKey: ["boards", boardId],
            });
        },
        onError: (error) => {
            console.error("Failed to remove member:", error);
        },
    });
};
