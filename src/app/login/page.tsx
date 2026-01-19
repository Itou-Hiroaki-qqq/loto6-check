'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (loginError) {
                setError(loginError.message)
                setLoading(false)
                return
            }

            router.push('/')
        } catch (err) {
            setError('ログインに失敗しました')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <h1 className="card-title text-2xl mb-4">ログインページ</h1>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                className="input input-bordered w-full"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                type="password"
                                placeholder="パスワードを入力"
                                className="input input-bordered w-full"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="cursor-pointer label justify-start gap-2">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="label-text">ログイン情報を記録する</span>
                            </label>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex flex-col items-end gap-4 mt-6">
                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={loading}
                            >
                                {loading ? 'ログイン中...' : 'ログイン'}
                            </button>

                            <span className="text-sm text-gray-600">
                                初めての方の
                                <Link href="/signup" className="link link-primary ml-1">
                                    新規登録はこちら
                                </Link>
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
