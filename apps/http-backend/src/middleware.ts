import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
declare global {
    namespace Express {
        interface Request {
            user_id?: number;
        }
    }
}
export function middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers["authorization"]??"";
    if (!token) {
        return res.status(401).json({message: "Unauthorized"});
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({message: "Unauthorized"});
        }
        req.user_id = (decoded as { user_id: number }).user_id;
        next();
    } catch (e) {
        return res.status(401).json({message: "Unauthorized"});
    }
}