/**
 * レスポンスがJSON形式かどうかを確認するユーティリティ
 */
export function isJsonResponse(response: Response): boolean {
    const contentType = response.headers.get('content-type')
    return Boolean(contentType?.includes('application/json'))
}
