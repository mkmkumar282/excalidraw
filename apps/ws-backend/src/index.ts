import { WebSocketServer, type WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
const wss = new WebSocketServer({ port: 8080 });
import { PrismaClient, getPrisma } from "@repo/db/client";

const prisma = getPrisma();
interface User {
    ws: WebSocket;
    rooms: String[];
    user_id: string;
}
const users: User[] = [];

function verifyToken(token: string): string | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === "string") {
            return null;
        }
        if (!decoded || !(decoded as JwtPayload).user_id) {
            return null;
        }
        return (decoded as JwtPayload).user_id;
    } catch (err) {
        return null;
    }
}

function areShapesEqual(s1: any, s2: any): boolean {
    if (!s1 || !s2) return false;
    if (s1.type !== s2.type) return false;
    
    if (s1.type === "rect") {
        return s1.x === s2.x && s1.y === s2.y && s1.width === s2.width && s1.height === s2.height;
    }
    if (s1.type === "circle") {
        return s1.centreX === s2.centreX && s1.centreY === s2.centreY && s1.radius === s2.radius;
    }
    if (s1.type === "line") {
        return s1.x1 === s2.x1 && s1.y1 === s2.y1 && s1.x2 === s2.x2 && s1.y2 === s2.y2;
    }
    if (s1.type === "pencil") {
        if (!s1.points || !s2.points || s1.points.length !== s2.points.length) return false;
        const len = s1.points.length;
        if (len === 0) return true;
        const samples = [0, Math.floor(len / 2), len - 1];
        for (const idx of samples) {
            if (idx >= len) continue;
            const p1 = s1.points[idx];
            const p2 = s2.points[idx];
            if (!p1 || !p2 || p1.x !== p2.x || p1.y !== p2.y) return false;
        }
        return true;
    }
    return false;
}



wss.on('connection', (ws: WebSocket, request: any) => {
    const url = request.url;
    if (!url) {
        ws.close(1008, "Invalid URL");
        return;
    }
    const parsedUrl = new URL(url, "http://localhost");
    const token = parsedUrl.searchParams.get("token") || "";
    const user_id = verifyToken(token);
    if (!user_id) {
        ws.close(1008, "Invalid token");
        return;
    }

    users.push({
        ws,
        rooms: [],
        user_id
    })

    ws.on("close", () => {
        const index = users.findIndex(u => u.ws === ws);
        if (index !== -1) {
            users.splice(index, 1);
        }
    });

    ws.on("message", async function message(data: any) {
        let parsedData;
        try {
            parsedData = JSON.parse(data.toString());
        } catch (e) {
            return;
        }

        if (!parsedData || typeof parsedData !== "object") {
            return;
        }

        if (parsedData.type === "join_room") {
            const user = users.find(u => u.ws === ws);
            if (user) {
                user.rooms.push(parsedData.room_id);
            }
        }
        if (parsedData.type === "leave_room") {
            const user = users.find(u => u.ws === ws);
            if (user) {
                user.rooms = user.rooms.filter(r => r !== parsedData.room_id);
            }
        }

        if (parsedData.type === "canvas_update") {
            const user = users.find(u => u.ws === ws);

            if (user) {
                const canvasRoomId = Number(parsedData.room_id);
                const elementData = parsedData.elementData;

                try {
                    await prisma.canvasElement.create({
                        data: {
                            canvasRoomId,
                            elementData,
                            userId: user_id
                        }
                    });
                } catch (dbError) {
                    console.error("Failed to save canvas element to database:", dbError);
                }
                
                users.forEach(u => {
                    if (u.ws === ws) return;
                    if (u.rooms.includes(parsedData.room_id)) {
                        u.ws.send(JSON.stringify({
                            type: "canvas_update",
                            room_id: parsedData.room_id,
                            elementData,
                            user_id
                        }));
                    }
                });
            }
        }

        if (parsedData.type === "delete_shape") {
            const user = users.find(u => u.ws === ws);
            if (user) {
                const canvasRoomId = Number(parsedData.room_id);
                const shapeId = parsedData.shapeId;
                const shape = parsedData.shape;

                try {
                    const deleteResult = await prisma.canvasElement.deleteMany({
                        where: {
                            canvasRoomId,
                            elementData: {
                                contains: shapeId
                            }
                        }
                    });


                    if (deleteResult.count === 0 && shape) {
                        const elements = await prisma.canvasElement.findMany({
                            where: { canvasRoomId }
                        });
                        for (const el of elements) {
                            try {
                                const parsedMsg = JSON.parse(el.elementData);
                                if (areShapesEqual(parsedMsg, shape)) {
                                    await prisma.canvasElement.delete({
                                        where: { id: el.id }
                                    });
                                    break;
                                }
                            } catch (e) {

                            }
                        }
                    }
                } catch (dbError) {
                    console.error("Failed to delete canvas element from database:", dbError);
                }
                
                users.forEach(u => {
                    if (u.ws === ws) return;
                    if (u.rooms.includes(parsedData.room_id)) {
                        u.ws.send(JSON.stringify({
                            type: "delete_shape",
                            room_id: parsedData.room_id,
                            shapeId
                        }));
                    }
                });
            }
        }

        if (parsedData.type === "close_room") {
            const user = users.find(u => u.ws === ws);
            if (user) {
                const canvasRoomId = Number(parsedData.room_id);
                try {
                    const canvasRoom = await prisma.canvasRoom.findUnique({
                        where: { id: canvasRoomId }
                    });

                    if (canvasRoom && canvasRoom.adminId === user.user_id) {

                        await prisma.canvasElement.deleteMany({
                            where: { canvasRoomId }
                        });


                        await prisma.canvasRoom.delete({
                            where: { id: canvasRoomId }
                        });


                        users.forEach(u => {
                            if (u.rooms.includes(parsedData.room_id)) {
                                u.ws.send(JSON.stringify({
                                    type: "room_closed",
                                    room_id: parsedData.room_id
                                }));
                                u.rooms = u.rooms.filter(r => r !== parsedData.room_id);
                            }
                        });
                    }
                } catch (dbError) {
                    console.error("Failed to close/delete canvas room in database:", dbError);
                }
            }
        }
    });
}); 