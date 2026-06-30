import {z} from "zod";

export const CreateUserSchema = z.object({
    email: z.string().min(3).max(100).email(),
    password: z.string().min(6).max(100),
    name: z.string().min(3).max(50),
});

export const SignInSchema = z.object({
    email: z.string().min(3).max(100).email(),
    password: z.string().min(6).max(100),
});

export const CreateCanvasRoomSchema = z.object({
    name: z.string().min(3).max(50),
});