import { useState } from "react"
import axios from "axios"

interface User {
  id: string
  email: string
  name: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  editableUntil: string
  isDeleted: boolean
  user: User
  replies: Comment[]
}

interface Props {
  comment: Comment
  depth: number
  currentUserId: string | null
  onReplySubmit?: () => void
}

export default function CommentItem({
  comment,
  depth,
  currentUserId,
  onReplySubmit,
}: Props) {
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState<Comment[]>([])
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [loadingReply, setLoadingReply] = useState(false)
  const [deleted, setDeleted] = useState(comment.isDeleted)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(comment.content)
  const [loadingEdit, setLoadingEdit] = useState(false)

  const isOwner = currentUserId === comment.user.id;

  const loadReplies = () => {
    if (!showReplies) {
      setReplies(comment.replies)
    }
    setShowReplies(prev => !prev)
  }

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return
    setLoadingReply(true)
    try {
      const res =await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/comments`, {
        content: replyText,
        parentId: comment.id,
      }, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      })
      console.log("Reply posted:", res.data.comment)
      // update the replies state to include the new reply
      setReplies(prev => [...prev, {
        ...res.data.comment,
      }])
      setReplyText("")
      setShowReplyBox(false)
    } catch (error) {
      console.error("Failed to post reply:", error)
    } finally {
      setLoadingReply(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!editedText.trim()) return
    setLoadingEdit(true)
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/comments?id=${comment.id}`, {
        content: editedText,
      }, {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      })
      // Update the comment content in the local state
      comment.content = editedText
      setEditedText(editedText)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update comment:", error)
    } finally {
      setLoadingEdit(false)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/?id=${comment.id}`, {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      setDeleted(true)
    } catch (error) {
      console.error("Failed to delete comment:", error)
    }
  }

  if (deleted && !isOwner) return null // Hide deleted comments for non-owners

  if (deleted && Date.now() > new Date(comment.editableUntil).getTime()) return null

  return (
    <div
      className={`ml-${depth === 0 ? 0 : 6} mt-4 rounded-lg ${deleted ? "opacity-50" : ""} px-4 py-3 ${depth === 0 ? "bg-white" : "bg-gray-100"
        } border-l-2 border-gray-300 shadow-sm`}
    >
      <div className="mb-1 text-sm text-gray-800 font-semibold">
        {comment.user.email}
        <span className="ml-2 text-xs text-gray-500">
          {new Date(comment.updatedAt).toLocaleString()}
        </span>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            className="w-full border text-neutral-900 border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleEditSubmit}
              disabled={loadingEdit}
              className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingEdit ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditedText(comment.content)
              }}
              className="text-sm text-gray-600 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-900 mb-2">{comment.content}</div>
      )}

      <div className="flex gap-4 text-sm text-blue-600 font-medium">
        {comment.replies?.length > 0 && (
          <button onClick={loadReplies} className="hover:underline">
            {showReplies
              ? "Hide replies"
              : `Show replies (${comment.replies.filter((r) => !r.isDeleted).length})`}
          </button>
        )}

        {!deleted && <button
          onClick={() => setShowReplyBox(prev => !prev)}
          className="hover:underline"
        >
          {showReplyBox ? "Cancel" : "Reply"}
        </button>}

        {isOwner && !isEditing && !deleted && (
          <>
            {Date.now() < new Date(comment.editableUntil).getTime() && (
              <button onClick={() => setIsEditing(true)} className="hover:underline text-yellow-600">
                Edit
              </button>
            )}
            <button onClick={handleDelete} className="hover:underline text-red-600">
              Delete
            </button>
          </>
        )}
      </div>

      {
        isOwner && deleted && (
          <div className="mt-1 text-sm text-gray-500 italic">
            This comment has been deleted.
            <button>
              <span onClick={async () => {
                await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/comments/recover?id=${comment.id}`, {
                  headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${localStorage.getItem("token")}`,
                  }
                })
                setDeleted(false)
              }} className="ml-2 text-blue-600 hover:underline">
                Restore
              </span>
            </button>
          </div>
        )
      }

      {showReplyBox && (
        <div className="mt-3">
          <textarea
            className="w-full border text-neutral-900 border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Write your reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />

          <button
            onClick={handleReplySubmit}
            disabled={loadingReply}
            className="mt-2 bg-blue-600 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingReply ? "Replying..." : "Post Reply"}
          </button>
        </div>
      )}

      {showReplies &&
        replies.map(reply => (
          <CommentItem
            key={reply.id}
            comment={reply}
            depth={depth + 1}
            currentUserId={currentUserId}
            onReplySubmit={onReplySubmit}
          />
        ))}
    </div>
  )
}
