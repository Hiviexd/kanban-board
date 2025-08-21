import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, UserRole, UserStatus } from "@/lib/types/user";

// API functions
const fetchUsers = async (): Promise<User[]> => {
    const response = await fetch("/api/users");
    if (!response.ok) {
        throw new Error("Failed to fetch users");
    }
    const data = await response.json();
    return data.users;
};

const updateUser = async ({ userId, updates }: { userId: string; updates: Partial<User> }): Promise<User> => {
    const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        throw new Error("Failed to update user");
    }

    const data = await response.json();
    return data.user;
};

const deleteUser = async (userId: string): Promise<void> => {
    const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to delete user");
    }
};

// Query keys
export const userKeys = {
    all: ["users"] as const,
    lists: () => [...userKeys.all, "list"] as const,
    list: (filters: string) => [...userKeys.lists(), { filters }] as const,
    details: () => [...userKeys.all, "detail"] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
};

// Hooks
export const useUsers = () => {
    return useQuery({
        queryKey: userKeys.lists(),
        queryFn: fetchUsers,
    });
};

export const useUser = (userId: string) => {
    return useQuery({
        queryKey: userKeys.detail(userId),
        queryFn: async () => {
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch user");
            }
            const data = await response.json();
            return data.user;
        },
        enabled: !!userId,
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUser,
        onSuccess: (updatedUser) => {
            // Update the user in the list
            queryClient.setQueryData(userKeys.lists(), (oldData: User[] | undefined) => {
                if (!oldData) return [updatedUser];
                return oldData.map((user) => (user._id === updatedUser._id ? updatedUser : user));
            });

            // Update the individual user
            queryClient.setQueryData(userKeys.detail(updatedUser._id), updatedUser);

            // Invalidate and refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteUser,
        onSuccess: (_, userId) => {
            // Remove the user from the list
            queryClient.setQueryData(userKeys.lists(), (oldData: User[] | undefined) => {
                if (!oldData) return [];
                return oldData.filter((user) => user._id !== userId);
            });

            // Remove the individual user
            queryClient.removeQueries({ queryKey: userKeys.detail(userId) });

            // Invalidate and refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
};

// Convenience hooks for specific operations
export const useUpdateUserRole = () => {
    const updateUserMutation = useUpdateUser();

    return {
        ...updateUserMutation,
        mutate: (userId: string, role: UserRole) => {
            updateUserMutation.mutate({ userId, updates: { role } });
        },
    };
};

export const useUpdateUserStatus = () => {
    const updateUserMutation = useUpdateUser();

    return {
        ...updateUserMutation,
        mutate: (userId: string, status: UserStatus) => {
            updateUserMutation.mutate({ userId, updates: { status } });
        },
    };
};
