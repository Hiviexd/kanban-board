import { NextRequest } from "next/server";

// Store connections for each board
const boardConnections = new Map<string, Set<Response>>();

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const boardId = searchParams.get("boardId");

    if (!boardId) {
        return new Response("Board ID required", { status: 400 });
    }

    // Create SSE response
    const stream = new ReadableStream({
        start(controller) {
            const response = {
                write: (data: string) => {
                    controller.enqueue(`data: ${data}\n\n`);
                },
                close: () => {
                    controller.close();
                },
            };

            // Add to board connections
            if (!boardConnections.has(boardId)) {
                boardConnections.set(boardId, new Set());
            }
            boardConnections.get(boardId)!.add(response as any);

            // Send initial connection message
            response.write(
                JSON.stringify({
                    type: "connected",
                    boardId,
                    timestamp: new Date().toISOString(),
                })
            );

            // Cleanup on close
            const cleanup = () => {
                const connections = boardConnections.get(boardId);
                if (connections) {
                    connections.delete(response as any);
                    if (connections.size === 0) {
                        boardConnections.delete(boardId);
                    }
                }
            };

            // Handle cleanup
            request.signal.addEventListener("abort", cleanup);
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        },
    });
}

// Function to broadcast to SSE clients
export function broadcastToSSE(boardId: string, data: any) {
    const connections = boardConnections.get(boardId);
    if (!connections || connections.size === 0) {
        return;
    }

    const message = JSON.stringify(data);

    // Send to all connections for this board
    for (const connection of connections) {
        try {
            (connection as any).write(message);
        } catch (error) {
            console.error("Failed to send SSE message:", error);
            connections.delete(connection);
        }
    }
}
