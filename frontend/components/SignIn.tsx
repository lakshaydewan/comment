"use client"

import type React from "react"
import { useEffect, useState } from "react"
import axios, { AxiosError } from "axios"
import { useRouter } from "next/navigation"

export default function SignIn() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [showLogin, setShowLogin] = useState(false) // Toggle between login and register
    const router = useRouter()

    // check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem("token")
        if (token) {
            router.push('/main')
        }
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!email || !password) {
                setError("Email and password are required")
                return
            }

            if (showLogin) {
                // User is trying to log in
                try {
                    const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                        email,
                        password,
                    })
                    const { token } = res.data
                    console.log("User logged in:", res.data);
                    localStorage.setItem("token", token)
                    router.push('/main')
                } catch (error) {
                    const errMsg = error instanceof AxiosError ? error.response?.data?.message : "An unexpected error occurred"
                    console.error("Login error:", errMsg)
                    setError(errMsg || "An unexpected error occurred")
                } finally {
                    return
                }
            }

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                email,
                password,
            })
            const { token } = res.data
            console.log("User registered:", res.data);
            localStorage.setItem("token", token)
            router.push('/main') // redirect to main page after successful login
        } catch (err: unknown) {
            const errMsg = err instanceof AxiosError ? err.response?.data?.message : "An unexpected error occurred"
            console.error("Login error:", errMsg)
            setError(errMsg || "An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{showLogin ? "Sign in to your account" : "Create your account"}</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address / UserName
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="text"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Enter your email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
                    )}

                    <div>
                        <p className="w-full text-center text-neutral-800 mb-2">{showLogin ? "New to comment? " : "Already have an account? "}{showLogin ? <button onClick={() => {
                            setEmail("")
                            setPassword("")
                            setError(null)
                            setShowLogin(false)
                        }} className="underline">Sign Up</button> : <button onClick={() => {
                            setEmail("")
                            setPassword("")
                            setError(null)
                            setShowLogin(true)
                        }} className="underline">Sign in</button>}</p>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Signing in...
                                </div>
                            ) : (
                                showLogin ? "log In" : "Sign Up"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
