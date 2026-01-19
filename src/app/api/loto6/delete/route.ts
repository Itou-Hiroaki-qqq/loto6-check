import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sql } from '@/lib/neon'

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        // ユーザーが所有する番号のみ削除
        await sql`
        DELETE FROM loto6_numbers
        WHERE id = ${id} AND user_id = ${user.id}
    `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting loto6 numbers:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
