import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface SearchUser {
    _id: string;
    name: string;
    email: string;
    picture?: string;
}

interface UseUserSearchResult {
    users: SearchUser[];
    isLoading: boolean;
    error: Error | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const searchUsers = async (query: string): Promise<SearchUser[]> => {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}&limit=10`);
    if (!response.ok) {
        throw new Error("Failed to search users");
    }

    const data = await response.json();
    return data.users;
};

export const useUserSearch = (): UseUserSearchResult => {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const {
        data: users = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["users", "search", debouncedQuery],
        queryFn: () => searchUsers(debouncedQuery),
        enabled: debouncedQuery.trim().length >= 2,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return {
        users,
        isLoading,
        error,
        searchQuery,
        setSearchQuery,
    };
};

export default useUserSearch;
