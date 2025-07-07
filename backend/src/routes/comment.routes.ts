import express from "express";
import { createComment, getPaginatedComments, editContent, deleteComment, recoverComment } from "../controllers/comment.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/", authenticate, createComment);
router.put('/', authenticate, editContent)
router.delete('/', authenticate, deleteComment)
router.get('/recover', authenticate, recoverComment)
router.get("/", getPaginatedComments);  

export default router;
