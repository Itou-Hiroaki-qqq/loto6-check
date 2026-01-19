import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sql } from '@/lib/neon'

export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // ユーザーが登録した番号を取得
        const result = await sql`
        SELECT id, numbers, created_at
        FROM loto6_numbers
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
    `

        return NextResponse.json({ numbers: result })
    } catch (error) {
        console.error('Error fetching loto6 numbers:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
