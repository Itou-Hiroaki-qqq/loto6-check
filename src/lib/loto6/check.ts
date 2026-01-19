import { PrizeLevel, CheckResult, WinningNumbers } from './types'

/**
 * ロト6の当選判定
 * @param userNumbers ユーザーが登録した6個の数字
 * @param winningNumbers 当選番号
 * @returns 判定結果
 */
export function checkLoto6(
    userNumbers: number[],
    winningNumbers: WinningNumbers
): CheckResult {
    const mainNumbers = winningNumbers.mainNumbers
    const bonusNumber = winningNumbers.bonusNumber

    // 本数字との一致数をカウント
    const matchCount = userNumbers.filter((num) => mainNumbers.includes(num)).length

    // ボーナス数字との一致をチェック
    const bonusMatch = userNumbers.includes(bonusNumber)

    // 当選判定
    let prizeLevel: PrizeLevel = 'はずれ'

    if (matchCount === 6) {
        prizeLevel = '1等'
    } else if (matchCount === 5 && bonusMatch) {
        prizeLevel = '2等'
    } else if (matchCount === 5) {
        prizeLevel = '3等'
    } else if (matchCount === 4) {
        prizeLevel = '4等'
    } else if (matchCount === 3) {
        prizeLevel = '5等'
    }

    return {
        prizeLevel,
        matchCount,
        bonusMatch,
        userNumbers: [...userNumbers].sort((a, b) => a - b),
        winningNumbers,
    }
}

/**
 * 数字を2桁の文字列に変換（先頭に0を付ける）
 */
export function formatNumber(num: number): string {
    return num.toString().padStart(2, '0')
}
