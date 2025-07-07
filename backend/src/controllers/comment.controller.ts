import { Request, RequestHandler, Response } from "express";
import prisma from "../config/prisma";

// Create a comment or reply
export const createComment: RequestHandler = async (req: Request, res: Response) => {
  const { content, parentId } = req.body;
  const userId = req.user?.id;

  console.log(req.body);

  if (!content || !userId) {
    res.status(400).json({ message: "Missing content or user not authenticated" });
    return;
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        parentId: parentId || null,
        editableUntil: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      },
      // Include user details in the response without password
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
      }
    });

    // check if parentId exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })

      // check if user is creating a reply to their own comment
      if (parentComment && parentComment.userId !== req.user?.id) {
        await prisma.notification.create({
          data: {
            userId: parentComment.userId,  // Notify the author of the parent comment
            commentId: comment.id   // The reply that triggered the notification
          },
        })
      }
    }

    res.status(201).json({ comment });
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ message: "Failed to create comment" });
  }
};

// export const getComments = async (_req: Request, res: Response) => {
//   try {
//     const comments = await prisma.comment.findMany({
//       where: {
//         parentId: null,
//         isDeleted: false
//       },
//       orderBy: {
//         createdAt: "desc"
//       },
//       include: {
//         user: {
//             select: {
//                 id: true,
//                 email: true,
//                 name: true
//             }
//         },
//         replies: {
//           where: { isDeleted: false },
//           orderBy: { createdAt: "asc" },
//           include: {
//             user: true,
//             replies: {
//               where: { isDeleted: false },
//               include: { user: true } // nested replies to depth 3 (customizable)
//             }
//           }
//         }
//       }
//     });

//     res.json({ comments });
//   } catch (err) {
//     console.error("Error fetching comments:", err);
//     res.status(500).json({ message: "Failed to fetch comments" });
//   }
// };

// Fetch top-level comments with pagination + nested replies (built manually)
export const getPaginatedComments = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  try {
    // Fetch all comments (limited by top-level)
    const topLevelComments = await prisma.comment.findMany({
      where: { parentId: null },
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: true
      }
    });

    const allReplies = await prisma.comment.findMany({
      where: { parentId: { not: null } },
      orderBy: { createdAt: "asc" },
      include: {
        user: true
      }
    });

    const replyMap = new Map<string, any[]>();

    // group replies by parentId
    for (const reply of allReplies) {
      if (!replyMap.has(reply.parentId!)) {
        replyMap.set(reply.parentId!, []);
      }
      replyMap.get(reply.parentId!)!.push({ ...reply, replies: [] });
    }

    // attach replies recursively
    const attachReplies = (comment: any) => {
      const children = replyMap.get(comment.id) || [];
      comment.replies = children.map(child => {
        return { ...child, replies: attachReplies(child) };
      });
      return comment.replies;
    };

    const nestedComments = topLevelComments.map((comment: any) => {
      const structured = { ...comment, replies: [] };
      structured.replies = attachReplies(structured);
      return structured;
    });

    res.status(200).json({ page, pageSize, comments: nestedComments });

  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

export const editContent = async (req: Request, res: Response) => {
  const { content } = req.body;
  const userId = req.user?.id;

  if (!content || !userId) {
    res.status(400).json({ message: "Missing content or user not authenticated" });
    return;
  }

  // check if the comment is editable
  const comment = await prisma.comment.findUnique({
    where: {
      id: req.query.id as string,
      userId
    }
  });

  if (!comment) {
    res.status(404).json({ message: "Comment not found or user not authorized" });
    return;
  }

  if (new Date(comment.editableUntil).getTime() < Date.now()) {
    res.status(403).json({ message: "Comment is not editable anymore" });
    return;
  }

  try {
    const comment = await prisma.comment.update({
      where: {
        id: req.query.id as string,
      },
      data: {
        content,
        editableUntil: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
      }
    });

    res.status(200).json({ comment });
  } catch (err) {
    console.error("Error updating comment:", err);
    res.status(500).json({ message: "Failed to update comment" });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(400).json({ message: "User not authenticated" });
    return;
  }

  // check if we want to soft delete or hard delete
  // here we are soft deleting by setting isDeleted to true
  const comment = await prisma.comment.findUnique({
    where: {
      id: req.query.id as string,
      userId
    }
  });

  if (!comment) {
    res.status(404).json({ message: "Comment not found" });
    return;
  }

  if (new Date(comment.editableUntil).getTime() < Date.now()) {
    // if the comment is not editable anymore, we just hard delete it
    await prisma.comment.delete({
      where: {
        id: req.query.id as string,
        userId
      }
    });
    res.status(200).json({ message: "Comment deleted successfully" });

    return;
  }

  try {
    const comment = await prisma.comment.update({
      where: {
        id: req.query.id as string,
        userId
      },
      data: {
        isDeleted: true
      }
    });

    res.status(200).json({ message: "Comment deleted successfully", comment });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
}

export const recoverComment = async (req: Request, res: Response) => {

  const userId = req.user?.id;

  if (!userId) {
    res.status(400).json({ message: "User not authenticated" });
    return;
  }

  // check if the recovery is allowed
  const comment = await prisma.comment.findUnique({
    where: {
      id: req.query.id as string,
      userId
    }
  });

  if (!comment) {
    res.status(404).json({ message: "Comment not found" });
    return;
  }

  if (new Date(comment.editableUntil).getTime() < Date.now()) {
    res.status(403).json({ message: "Comment is not editable anymore" });
    return;
  }

  try {
    const comment = await prisma.comment.update({
      where: {
        id: req.query.id as string,
        userId
      },
      data: {
        isDeleted: false
      }
    });

    res.status(200).json({ message: "Comment recovered successfully", comment });
  } catch (err) {
    console.error("Error recovering comment:", err);
    res.status(500).json({ message: "Failed to recover comment" });
  }
}