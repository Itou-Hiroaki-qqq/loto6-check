import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sql, schema } from '@/lib/neon'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { numbers } = body

        // バリデーション
        if (!Array.isArray(numbers) || numbers.length !== 6) {
            return NextResponse.json({ error: '6個の数字を入力してください' }, { status: 400 })
        }

        // 1～43の範囲チェック
        for (const num of numbers) {
            if (typeof num !== 'number' || num < 1 || num > 43) {
                return NextResponse.json({ error: '数字は1～43の範囲で入力してください' }, { status: 400 })
            }
        }

        // 重複チェック
        const uniqueNumbers = new Set(numbers)
        if (uniqueNumbers.size !== 6) {
            return NextResponse.json({ error: '同じ数字は入力できません' }, { status: 400 })
        }

        // データベースに保存
        const sortedNumbers = [...numbers].sort((a, b) => a - b)
        
        // PostgreSQLの配列リテラル形式に変換
        const numbersString = `{${sortedNumbers.join(',')}}`
        
        await sql`
            INSERT INTO loto6_numbers (user_id, numbers)
            VALUES (${user.id}, ${numbersString}::integer[])
        `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error registering loto6 numbers:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
