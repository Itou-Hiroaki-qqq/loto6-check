import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 認証が必要なページのチェック
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.pathname

    // パブリックページ（認証不要）
    const publicPaths = ['/login', '/signup']
    const isPublicPath = publicPaths.includes(url)

    // ログインしていない場合、パブリックページ以外はログインページへリダイレクト
    if (!user && !isPublicPath && url !== '/') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        return NextResponse.redirect(redirectUrl)
    }

    // ログインしている場合、ログイン/登録ページはトップページへリダイレクト
    if (user && isPublicPath) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/'
        return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
}
