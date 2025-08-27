import { NextApiRequest, NextApiResponse } from "next";
import { Server as HTTPServer } from "http";
import { Socket as NetSocket } from "net";
import { initializeWebSocketServer } from "../../lib/websocket/server";

interface SocketServer extends HTTPServer {
    io?: any;
}

interface SocketWithIO extends NetSocket {
    server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
    socket: SocketWithIO;
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
    if (res.socket.server.io) {
        console.log("Socket.IO server already running");
        res.end();
        return;
    }

    console.log("Initializing Socket.IO server");

    const io = initializeWebSocketServer(res.socket.server);
    res.socket.server.io = io;

    res.end();
}

export const config = {
    api: {
        bodyParser: false,
    },
};
