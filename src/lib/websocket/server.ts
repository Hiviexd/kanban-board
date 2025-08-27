import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { auth0 } from "../auth0";
import connectDB from "../mongodb";
import User from "../models/User";
import Board from "../models/Board";

export type WebSocketServer = SocketIOServer;

// Global singleton pattern that works with Next.js
declare global {
    var __socketio: WebSocketServer | undefined;
}

let io: WebSocketServer;

export function getWebSocketServer(): WebSocketServer | null {
    return global.__socketio || null;
}

export function initializeWebSocketServer(httpServer: HTTPServer): WebSocketServer {
    // Check if already initialized globally
    if (global.__socketio) {
        console.log("Using existing Socket.IO server");
        return global.__socketio;
    }

    console.log("Creating new Socket.IO server");
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.AUTH0_BASE_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
        path: "/api/socket",
    });

    // Store globally for Next.js
    global.__socketio = io;

    // Store for tracking board presence
    const boardPresence = new Map<string, Set<string>>();

    io.on("connection", async (socket) => {
        console.log("Client connected:", socket.id);

        try {
            // Simplified authentication - just get the token
            const token = socket.handshake.auth.token;
            if (!token) {
                console.log("No token provided, disconnecting");
                socket.emit("error", { message: "Authentication required" });
                socket.disconnect();
                return;
            }

            console.log("Token received:", token);

            // Get user from database using Auth0 ID directly (simplified)
            await connectDB();
            const user = await User.findOne({ auth0Id: token });
            if (!user) {
                console.log("User not found for auth0Id:", token);
                socket.emit("error", { message: "User not found" });
                socket.disconnect();
                return;
            }

            console.log("User authenticated:", user.name, user._id.toString());

            // Store user data in socket
            (socket as any).data = {
                userId: user._id.toString(),
                boardIds: new Set(),
            };

            // Emit successful connection
            socket.emit("connected", { userId: user._id.toString() });

            // Handle joining a board
            socket.on("join_board", async ({ boardId }) => {
                try {
                    // Check if user can view this board
                    const board = await Board.findById(boardId);
                    if (!board) {
                        socket.emit("error", { message: "Board not found" });
                        return;
                    }

                    // Check if user can access board (owner, member, or public)
                    const userId = (socket as any).data.userId;
                    const canView =
                        board.isPublic ||
                        board.owner.toString() === userId ||
                        board.members.some((member: any) => member.userId.toString() === userId);

                    if (!canView) {
                        socket.emit("error", { message: "Access denied to board" });
                        return;
                    }

                    // Join the board room
                    console.log(`User ${userId} joining board room: board:${boardId}`);
                    socket.join(`board:${boardId}`);
                    (socket as any).data.boardIds.add(boardId);

                    // Add user to board presence
                    if (!boardPresence.has(boardId)) {
                        boardPresence.set(boardId, new Set());
                    }
                    boardPresence.get(boardId)!.add(user._id.toString());

                    // Emit user joined event to all users in the board
                    socket.to(`board:${boardId}`).emit("user_joined", {
                        boardId,
                        user: {
                            id: user._id.toString(),
                            name: user.name,
                            picture: user.picture,
                        },
                    });

                    // Send current presence to the joining user
                    const currentUsers = Array.from(boardPresence.get(boardId) || []);
                    const presenceUsers = await Promise.all(
                        currentUsers.map(async (userId) => {
                            const u = await User.findById(userId).select("_id name picture");
                            return u
                                ? {
                                      id: u._id.toString(),
                                      name: u.name,
                                      picture: u.picture,
                                      joinedAt: new Date(), // This should be tracked more accurately
                                  }
                                : null;
                        })
                    );

                    socket.emit("board_presence_updated", {
                        boardId,
                        users: presenceUsers.filter(Boolean) as any[],
                    });

                    console.log(`User ${user.name} joined board ${boardId}`);
                } catch (error) {
                    console.error("Error joining board:", error);
                    socket.emit("error", { message: "Failed to join board" });
                }
            });

            // Handle leaving a board
            socket.on("leave_board", ({ boardId }) => {
                socket.leave(`board:${boardId}`);
                (socket as any).data.boardIds.delete(boardId);

                // Remove user from board presence
                const presence = boardPresence.get(boardId);
                if (presence) {
                    presence.delete(user._id.toString());
                    if (presence.size === 0) {
                        boardPresence.delete(boardId);
                    }
                }

                // Emit user left event
                socket.to(`board:${boardId}`).emit("user_left", {
                    boardId,
                    userId: user._id.toString(),
                });

                console.log(`User ${user.name} left board ${boardId}`);
            });

            // Handle disconnect
            socket.on("disconnect", () => {
                console.log("Client disconnected:", socket.id);

                // Remove user from all board presence
                for (const boardId of (socket as any).data.boardIds) {
                    const presence = boardPresence.get(boardId);
                    if (presence) {
                        presence.delete(user._id.toString());
                        if (presence.size === 0) {
                            boardPresence.delete(boardId);
                        }
                    }

                    // Emit user left event
                    socket.to(`board:${boardId}`).emit("user_left", {
                        boardId,
                        userId: user._id.toString(),
                    });
                }
            });
        } catch (error) {
            console.error("Socket connection error:", error);
            socket.emit("error", { message: "Connection failed" });
            socket.disconnect();
        }
    });

    return io;
}

// Simplified token verification - removed complex logic

// Broadcasting functions for API routes to use
export function broadcastBoardUpdate(boardId: string, event: string, data: any) {
    const socketServer = global.__socketio;

    if (socketServer) {
        socketServer.to(`board:${boardId}`).emit(event, data);
    } else {
        // Try to use SSE as fallback
        try {
            // Dynamic import to avoid circular dependencies
            import("../../app/api/sse/route")
                .then(({ broadcastToSSE }) => {
                    broadcastToSSE(boardId, { type: event, ...data });
                })
                .catch((e) => {
                    console.error("SSE fallback failed:", e);
                });
        } catch (error) {
            console.error("Failed to broadcast via SSE:", error);
        }
    }
}

export function broadcastToBoard(boardId: string, event: string, data: any) {
    const socketServer = global.__socketio;
    if (!socketServer) return;

    socketServer.to(`board:${boardId}`).emit(event, data);
}
