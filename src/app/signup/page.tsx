'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password !== confirmPassword) {
            setError('パスワードが一致しません')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください')
            setLoading(false)
            return
        }

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                    },
                },
            })

            if (signUpError) {
                setError(signUpError.message)
                setLoading(false)
                return
            }

            if (data.user) {
                // メール確認が必要な場合
                if (!data.session) {
                    setError('')
                    alert('登録が完了しました。確認メールを送信しました。メール内のリンクをクリックしてメールアドレスを確認してください。')
                    router.push('/login')
                } else {
                    // メール確認が不要な場合（開発環境など）
                    router.push('/')
                }
            }
        } catch (err) {
            setError('登録に失敗しました')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <h1 className="card-title text-2xl mb-4">新規登録ページ</h1>

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Name</span>
                            </label>
                            <input
                                type="text"
                                placeholder="名前を入力"
                                className="input input-bordered w-full"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

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
                            <label className="label">
                                <span className="label-text">Confirm Password</span>
                            </label>
                            <input
                                type="password"
                                placeholder="パスワードを再入力"
                                className="input input-bordered w-full"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-6">
                            <span className="text-sm text-gray-600">
                                すでに登録済みの方の
                                <Link href="/login" className="link link-primary ml-1">
                                    ログインはこちら
                                </Link>
                            </span>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? '登録中...' : '登録する'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
