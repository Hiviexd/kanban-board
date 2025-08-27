import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useWebSocket from "./useWebSocket";

interface UseRealTimeOptions {
    boardId: string | null;
    onBoardUpdate?: (data: any) => void;
}

export function useRealTime({ boardId, onBoardUpdate }: UseRealTimeOptions) {
    const queryClient = useQueryClient();
    const { isConnected: wsConnected, on: wsOn, off: wsOff } = useWebSocket();
    const [sseConnected, setSseConnected] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);

    // Try WebSocket first, fallback to SSE
    useEffect(() => {
        if (!boardId) return;

        // Set up WebSocket listeners
        const handleBoardUpdate = (data: any) => {
            // Force immediate refetch for real-time updates

            // Refetch board data immediately
            queryClient.refetchQueries({
                queryKey: ["boards", boardId],
            });

            // Refetch columns data immediately
            queryClient.refetchQueries({
                queryKey: ["boards", boardId, "columns"],
            });

            // Refetch all task queries immediately
            queryClient.refetchQueries({
                predicate: (query) => {
                    return query.queryKey[0] === "columns" && query.queryKey[2] === "tasks";
                },
            });

            // Also refetch boards list if needed
            if (data.changes?.deleted) {
                queryClient.refetchQueries({
                    queryKey: ["boards"],
                });
            }

            onBoardUpdate?.(data);
        };

        // Try WebSocket first
        if (wsConnected) {
            wsOn("board_updated", handleBoardUpdate);
        } else {
            // Fallback to SSE after a short delay
            const sseTimeout = setTimeout(() => {
                if (!wsConnected && !eventSourceRef.current) {
                    // Set up SSE connection
                    const eventSource = new EventSource(`/api/sse?boardId=${boardId}`);
                    eventSourceRef.current = eventSource;

                    eventSource.onopen = () => {
                        setSseConnected(true);
                    };

                    eventSource.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);

                            if (data.type === "board_updated") {
                                handleBoardUpdate(data);
                            }
                        } catch (error) {
                            console.error("Failed to parse SSE message:", error);
                        }
                    };

                    eventSource.onerror = (error) => {
                        console.error("SSE error:", error);
                        setSseConnected(false);
                    };
                }
            }, 2000); // Wait 2 seconds for WebSocket

            return () => {
                clearTimeout(sseTimeout);
            };
        }

        // Cleanup function
        return () => {
            if (wsConnected) {
                wsOff("board_updated", handleBoardUpdate);
            }
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
                setSseConnected(false);
            }
        };
    }, [boardId, wsConnected, queryClient, onBoardUpdate, wsOn, wsOff]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
                setSseConnected(false);
            }
        };
    }, []);

    return {
        isConnected: wsConnected || sseConnected,
        connectionType: wsConnected ? "websocket" : sseConnected ? "sse" : "none",
    };
}
