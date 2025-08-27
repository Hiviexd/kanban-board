import { useEffect, useState } from "react";
import useWebSocket from "./useWebSocket";

interface BoardUser {
    id: string;
    name: string;
    picture?: string;
    joinedAt: Date;
}

export function useBoardPresence(boardId: string | null) {
    const { socket, isConnected, on, off, emit } = useWebSocket();
    const [users, setUsers] = useState<BoardUser[]>([]);
    const [isJoined, setIsJoined] = useState(false);

    const joinBoard = () => {
        if (boardId && isConnected && !isJoined) {
            console.log(`Emitting join_board for boardId: ${boardId}`);
            emit("join_board", { boardId });
            setIsJoined(true);
        }
    };

    const leaveBoard = () => {
        if (boardId && isConnected && isJoined) {
            emit("leave_board", { boardId });
            setIsJoined(false);
            setUsers([]);
        }
    };

    useEffect(() => {
        if (!boardId || !isConnected) {
            return;
        }

        // Join the board when connected
        joinBoard();

        // Handle presence updates
        const handlePresenceUpdate = (data: { boardId: string; users: BoardUser[] }) => {
            if (data.boardId === boardId) {
                setUsers(data.users);
            }
        };

        const handleUserJoined = (data: { boardId: string; user: Omit<BoardUser, "joinedAt"> }) => {
            if (data.boardId === boardId) {
                setUsers((prev) => [
                    ...prev.filter((u) => u.id !== data.user.id),
                    { ...data.user, joinedAt: new Date() },
                ]);
            }
        };

        const handleUserLeft = (data: { boardId: string; userId: string }) => {
            if (data.boardId === boardId) {
                setUsers((prev) => prev.filter((u) => u.id !== data.userId));
            }
        };

        // Subscribe to events
        on("board_presence_updated", handlePresenceUpdate);
        on("user_joined", handleUserJoined);
        on("user_left", handleUserLeft);

        // Cleanup function
        return () => {
            off("board_presence_updated", handlePresenceUpdate);
            off("user_joined", handleUserJoined);
            off("user_left", handleUserLeft);
            leaveBoard();
        };
    }, [boardId, isConnected]);

    // Leave board when component unmounts or boardId changes
    useEffect(() => {
        return () => {
            if (isJoined) {
                leaveBoard();
            }
        };
    }, []);

    return {
        users,
        isJoined,
        joinBoard,
        leaveBoard,
    };
}

export default useBoardPresence;
