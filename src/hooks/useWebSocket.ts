import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@auth0/nextjs-auth0";

type WebSocketType = Socket;

interface UseWebSocketOptions {
    enabled?: boolean;
    autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const { enabled = true, autoConnect = true } = options;
    const { user, isLoading } = useUser();
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<WebSocketType | null>(null);

    const connect = async () => {
        if (!enabled || !user || isLoading || socketRef.current?.connected) {
            return;
        }

        try {
            console.log("Connecting to WebSocket...");

            // First, ensure the Socket.IO server is initialized
            try {
                await fetch("/api/socket");
            } catch (e) {
                console.log("Socket.IO server initialization:", e);
            }

            // Initialize socket connection
            const socket: WebSocketType = io({
                path: "/api/socket",
                auth: {
                    token: user.sub, // Use Auth0 user ID as token for now
                },
                autoConnect: false,
            });

            socketRef.current = socket;

            // Connection event handlers
            socket.on("connect", () => {
                console.log("WebSocket connected");
                setIsConnected(true);
                setError(null);
            });

            socket.on("connected", ({ userId }) => {
                console.log("WebSocket authenticated for user:", userId);
            });

            socket.on("disconnect", (reason) => {
                console.log("WebSocket disconnected:", reason);
                setIsConnected(false);
            });

            socket.on("error", ({ message }) => {
                console.error("WebSocket error:", message);
                setError(message);
            });

            socket.on("connect_error", (error) => {
                console.error("WebSocket connection error:", error);
                setError(error.message || "Connection failed");
                setIsConnected(false);
            });

            // Connect the socket
            socket.connect();
        } catch (err) {
            console.error("Failed to initialize WebSocket:", err);
            setError(err instanceof Error ? err.message : "Failed to connect");
        }
    };

    const disconnect = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    };

    const emit = (event: string, data: any) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        } else {
            console.warn("Socket not connected, cannot emit event:", event);
        }
    };

    const on = (event: string, handler: (data: any) => void) => {
        if (socketRef.current) {
            socketRef.current.on(event, handler);
        }
    };

    const off = (event: string, handler?: (data: any) => void) => {
        if (socketRef.current) {
            if (handler) {
                socketRef.current.off(event, handler);
            } else {
                socketRef.current.off(event);
            }
        }
    };

    // Auto-connect when user is available
    useEffect(() => {
        if (autoConnect && enabled && user && !isLoading) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [enabled, autoConnect, user, isLoading]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        error,
        connect,
        disconnect,
        emit,
        on,
        off,
    };
}

export default useWebSocket;
