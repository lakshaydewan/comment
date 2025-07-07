"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import CommentItem from "@/components/CommentItem"
import jwt from "jsonwebtoken"
import { Loader } from "lucide-react"
import { motion } from "motion/react"
import NotificationComponent from "@/components/Notification"
import Logout from "@/components/Logout"

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

const Home = () => {
  const [comments, setComments] = useState<Comment[]>([])
  const [page, setPage] = useState(1)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [end, setEnd] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const decoded = jwt.decode(token as string)
    const userId = decoded ? (decoded as { userId: string }).userId : null
    setUserId(userId)
  }, [])

  useEffect(() => {
    if (page === 1) {
      axios.get(`http://localhost:4000/api/comments?page=${page}`).then((res) => {
        console.log(res.data.comments)
        setComments(res.data.comments)
      })
    }
    else {
      axios.get(`http://localhost:4000/api/comments?page=${page}`).then((res) => {
        console.log("After page set:- ", res.data.comments)
        if (res.data.comments.length === 0) {
          setEnd(true)
          return
        }
        setComments((prev) => [...prev, ...res.data.comments])
      })
    }
  }, [page])

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Notification Component */}
      <NotificationComponent />
      {/* Logout Component */}
      <Logout />
      <div className="mx-auto w-[90%] md:w-[70%] h-screen flex justify-center items-center">
        <div className="bg-white w-full h-fit rounded-2xl shadow-xl border border-slate-400 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 sm:px-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">Comments</h1>
            <p className="text-blue-100 text-center mt-2 text-sm sm:text-base">
              Share your thoughts and join the conversation
            </p>
          </div>

          {/* Comment Input Section */}
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  type="text"
                  placeholder="Share your thoughts..."
                  className="w-full h-12 px-4 py-3 border-2 border-slate-300 placeholder:text-slate-500 text-slate-900 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                />
              </div>
              <button
                onClick={async () => {
                  // Add comment logic here
                  if (!comment.trim()) return
                  setLoading(true)
                  try {
                    const res = await axios.post(
                      "http://localhost:4000/api/comments",
                      {
                        content: comment,
                        parentId: null,
                      },
                      {
                        headers: {
                          "Content-Type": "application/json",
                          authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                      },
                    )
                    setComments([res.data.comment, ...comments])
                    setComment("")
                  } catch (err) {
                    console.error("Failed to add comment:", err)
                    alert("Failed to add comment. Please try again.")
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading || !comment.trim()}
                className={`
                  px-6 py-3 h-12 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 min-w-[100px] sm:min-w-[120px]
                  ${loading || !comment.trim()
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-0.5"
                  }
                `}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Adding...</span>
                  </div>
                ) : (
                  "Add Comment"
                )}
              </button>
            </div>
          </div>

          {/* Comments Section */}
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No comments yet</h3>
              <p className="text-slate-500">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="flex flex-col h-[50vh] md:h-[60vh]">
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {comments.map((comment) => (
                  <CommentItem onReplySubmit={() => {
                    setComments(comments.map(c => c.id === comment.id ? comment : c))
                  }} currentUserId={userId} key={comment.id} comment={comment} depth={0} />
                ))}
                {
                  end ? (
                    <div
                      className="w-full h-10 pt-3 rounded-xl text-center font-sans font-semibold text-neutral-900 flex justify-center items-center">
                      No more comments to load
                    </div>
                  ) : (
                    <motion.div
                      onViewportEnter={() => {
                        console.log("Reached bottom, loading more comments")
                        setPage((prev) => prev + 1)
                      }}
                      className="w-full h-10 pt-3 rounded-xl flex justify-center items-center">
                      <Loader size={16} className="text-blue-600 animate-spin" />
                    </motion.div>
                  )
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  )
}

export default Home
