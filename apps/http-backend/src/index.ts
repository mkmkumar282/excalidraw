import express from "express";
const app= express();
import jwt from "jsonwebtoken";
import {Request, Response} from "express";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import { CreateUserSchema, SignInSchema, CreateCanvasRoomSchema } from "@repo/common/types";
import {getPrisma} from "@repo/db/client";
import bcrypt, { hash } from "bcrypt";
app.use(express.json());


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.post("/signup", async (req : Request, res : Response)=> {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success){
        return res.status(400).json({message: "Invalid data"});
    }

    const hash = await bcrypt.hash(parsedData.data.password, 10);
    try {
        const user = await getPrisma().user.create({
            data: {
                email: parsedData.data.email,
                password: hash,
                name: parsedData.data.name
            }
        });
        res.json({message: "User created"});
    } catch(e) {
        console.error(e);
        return res.status(500).json({message: "Internal server error"});
    }
})

app.post("/signin", async (req : Request, res : Response) => {
    const parsedData = SignInSchema.safeParse(req.body);
    if(!parsedData.success){
        return res.status(400).json({message: "Invalid data"});
    }
    const user = await getPrisma().user.findUnique({where: {email: parsedData.data.email}});

    if(!user){
        return res.status(401).json({message: "Invalid credentials"});
    }

    const isPasswordValid = await bcrypt.compare(parsedData.data.password, user.password);
    if(!isPasswordValid){
        return res.status(401).json({message: "Invalid credentials"});
    }

    const token = jwt.sign({user_id: user.id}, JWT_SECRET, {expiresIn: "1h"});
    res.json({token});
})

app.post("/canvas-room", middleware, async (req: Request, res: Response) => {
    const slug = req.body.slug;
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
        return res.status(400).json({ message: "Invalid data" });
    }

    const user_id = req.user_id;
    if (!user_id) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const existing = await getPrisma().canvasRoom.findFirst({
            where: {
                slug
            }
        });
        if (existing) {
            return res.status(400).json({ message: "Canvas room already exists" });
        }

        const canvasRoom = await getPrisma().canvasRoom.create({
            data: {
                slug,
                adminId: String(user_id)
            }
        });
        res.json({ roomId: canvasRoom.id.toString() });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/elements/:canvasRoomId", middleware, async (req : Request, res : Response) => {
    const canvasRoomId = req.params.canvasRoomId;
    const elements = await getPrisma().canvasElement.findMany({
        where: {
            canvasRoomId: Number(canvasRoomId)
        },
        orderBy: {
            id: "desc"
        },
        take: 50
    });
    res.json({ elements });
});

app.get("/canvas-room-admin/:canvasRoomId", middleware, async (req: Request, res: Response) => {
    const canvasRoomId = Number(req.params.canvasRoomId);
    const user_id = req.user_id;

    try {
        const canvasRoom = await getPrisma().canvasRoom.findUnique({
            where: { id: canvasRoomId }
        });

        if (!canvasRoom) {
            return res.status(404).json({ message: "Canvas room not found" });
        }

        res.json({ isAdmin: canvasRoom.adminId === String(user_id) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/canvas-room/:slug", middleware, async (req : Request, res : Response) => {
    const slug = req.params.slug as string;
    const canvasRoom = await getPrisma().canvasRoom.findFirst({
        where: {
            slug
        }
    });
    if (!canvasRoom) {
        return res.status(404).json({ message: "Canvas room not found" });
    }
    res.json({ roomId: canvasRoom.id.toString() });
});


app.listen(3001);
