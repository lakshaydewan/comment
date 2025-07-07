import { Request, RequestHandler, Response } from "express";
import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';


export const registerUser: RequestHandler = async (req: Request, res: Response) => {

    const { email, password, name } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                },
            });

            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
                expiresIn: "7d"
            });

            res.status(201).json({
                token: token, user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            });
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).json({ message: "Error creating user" });
        }

    } catch (error) {
        res.status(500).json({ message: "Error creating user", error });
    }
};

export const loginUser = async (req: Request, res: Response) => {

    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            res.status(400).json({ message: "Invalid email or password" });
            return
        }

        const isPasswordValid = await bcrypt.compare(password, user?.password);
        console.log("isPasswordValid", isPasswordValid);

        if (!isPasswordValid) {
            res.status(400).json({ message: "Invalid email or password" });
            return;
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
            expiresIn: "7d"
        });

        res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
        return;
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Error logging in" });
        return;
    }
};

