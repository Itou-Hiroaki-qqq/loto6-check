import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export interface ScrapedWinningNumbers {
    drawDate: string // YYYY-MM-DD
    mainNumbers: number[]
    bonusNumber: number
    drawNumber?: number
}

/**
 * ロト6の公式サイトから当選番号をスクレイピング
 * @param url スクレイピングするURL
 * @returns 当選番号の配列
 */
export async function scrapeWinningNumbers(url: string): Promise<ScrapedWinningNumbers[]> {
    try {
        console.log(`[Scraper] Fetching URL: ${url}`)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        })

        if (!response.ok) {
            console.error(`[Scraper] HTTP Error: ${response.status} for ${url}`)
            throw new Error(`Failed to fetch: ${response.status}`)
        }

        const html = await response.text()
        console.log(`[Scraper] HTML length: ${html.length} characters`)
        
        const $ = cheerio.load(html)
        const results: ScrapedWinningNumbers[] = []

        // テーブルを取得
        const tables = $('table')
        console.log(`[Scraper] Found ${tables.length} table(s)`)

        // 各テーブルを処理
        tables.each((tableIndex, table) => {
            const $table = $(table)
            
            // デバッグ: テーブルの最初の数行を確認
            const firstRows = $table.find('tr').slice(0, 5)
            if (tableIndex < 2) {
                console.log(`[Scraper] Table ${tableIndex} structure:`)
                firstRows.each((idx, row) => {
                    const $row = $(row)
                    const thText = $row.find('th').text().trim()
                    const tdTexts: string[] = []
                    const tdHTMLs: string[] = []
                    $row.find('td').each((_, td) => {
                        const $td = $(td)
                        tdTexts.push($td.text().trim().substring(0, 50))
                        // HTML構造を確認
                        const html = $td.html() || ''
                        tdHTMLs.push(html.substring(0, 100))
                    })
                    console.log(`  Row ${idx}: th="${thText}", tds=[${tdTexts.join(', ')}]`)
                    if (tdHTMLs.length > 0 && tableIndex === 0 && (idx === 1 || idx === 2 || idx === 3)) {
                        console.log(`    HTML: ${tdHTMLs.join(' | ')}`)
                    }
                })
            }
            
            try {
                // 抽選日を取得（「抽せん日」を含む行を探す）
                let drawDate = ''
                const drawDateRow = $table.find('tr').filter((_, row) => {
                    const thText = $(row).find('th').text().trim()
                    return thText.includes('抽せん日')
                })
                
                if (drawDateRow.length > 0) {
                    // .js-lottery-date-pc を優先的に探す
                    let dateText = drawDateRow.find('.js-lottery-date-pc').text().trim()
                    if (!dateText) {
                        // なければ p 要素を探す
                        dateText = drawDateRow.find('p').text().trim()
                    }
                    if (!dateText) {
                        // それでもなければ td のテキストを探す
                        dateText = drawDateRow.find('td').text().trim()
                    }
                    if (dateText) {
                        // 2026年1月5日 -> 2026-01-05
                        const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
                        if (match) {
                            const [, year, month, day] = match
                            drawDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                        }
                    }
                    if (tableIndex < 2) {
                        console.log(`[Scraper] Table ${tableIndex} dateRow found: "${dateText}" -> "${drawDate}"`)
                    }
                } else if (tableIndex < 2) {
                    console.log(`[Scraper] Table ${tableIndex} dateRow not found`)
                }

                // 回号を取得（「第1234回」のようなパターンを探す）
                let drawNumber: number | undefined
                const tableText = $table.text()
                const drawMatch = tableText.match(/第(\d+)回/)
                if (drawMatch) {
                    drawNumber = parseInt(drawMatch[1], 10)
                }

                // 本数字を取得（「本数字」を含む行を探す）
                const mainNumbersRow = $table.find('tr').filter((_, row) => {
                    const thText = $(row).find('th').text().trim()
                    return thText.includes('本数字')
                })
                
                const mainNumbers: number[] = []
                if (mainNumbersRow.length > 0) {
                    // td内の .js-lottery-number-pc クラスを持つ要素、または b.section__text--bold 要素から数字を抽出
                    mainNumbersRow.find('td').each((_, td) => {
                        const $td = $(td)
                        // .js-lottery-number-pc を優先的に探す
                        const numberElem = $td.find('.js-lottery-number-pc').first()
                        if (numberElem.length === 0) {
                            // なければ b.section__text--bold を探す
                            const boldElem = $td.find('b.section__text--bold').first()
                            if (boldElem.length > 0) {
                                const text = boldElem.text().trim()
                                const numMatch = text.match(/\d+/)
                                if (numMatch) {
                                    const num = parseInt(numMatch[0], 10)
                                    if (!isNaN(num) && num >= 1 && num <= 43) {
                                        mainNumbers.push(num)
                                    }
                                }
                            }
                        } else {
                            const text = numberElem.text().trim()
                            const numMatch = text.match(/\d+/)
                            if (numMatch) {
                                const num = parseInt(numMatch[0], 10)
                                if (!isNaN(num) && num >= 1 && num <= 43) {
                                    mainNumbers.push(num)
                                }
                            }
                        }
                    })
                    if (tableIndex < 2) {
                        console.log(`[Scraper] Table ${tableIndex} mainNumbers found: ${mainNumbers.length} numbers [${mainNumbers.join(', ')}]`)
                    }
                } else if (tableIndex < 2) {
                    console.log(`[Scraper] Table ${tableIndex} mainNumbersRow not found`)
                }

                // ボーナス数字を取得（「ボーナス数字」を含む行を探す）
                const bonusNumbersRow = $table.find('tr').filter((_, row) => {
                    const thText = $(row).find('th').text().trim()
                    return thText.includes('ボーナス数字')
                })
                
                let bonusNumber = NaN
                if (bonusNumbersRow.length > 0) {
                    // td内の .js-lottery-bonus-pc クラスを持つ要素、または b.section__text--bold 要素から数字を抽出
                    bonusNumbersRow.find('td').each((_, td) => {
                        const $td = $(td)
                        // .js-lottery-bonus-pc を優先的に探す
                        const bonusElem = $td.find('.js-lottery-bonus-pc').first()
                        if (bonusElem.length === 0) {
                            // なければ b.section__text--bold を探す
                            const boldElem = $td.find('b.section__text--bold').first()
                            if (boldElem.length > 0) {
                                const text = boldElem.text().trim()
                                // (03) のような形式から数字を抽出
                                const numMatch = text.match(/\(?(\d+)\)?/)
                                if (numMatch) {
                                    const num = parseInt(numMatch[1], 10)
                                    if (!isNaN(num) && num >= 1 && num <= 43) {
                                        bonusNumber = num
                                        return false // eachを中断
                                    }
                                }
                            }
                        } else {
                            const text = bonusElem.text().trim()
                            // (03) のような形式から数字を抽出
                            const numMatch = text.match(/\(?(\d+)\)?/)
                            if (numMatch) {
                                const num = parseInt(numMatch[1], 10)
                                if (!isNaN(num) && num >= 1 && num <= 43) {
                                    bonusNumber = num
                                    return false // eachを中断
                                }
                            }
                        }
                    })
                    if (tableIndex < 2) {
                        console.log(`[Scraper] Table ${tableIndex} bonusNumber found: ${bonusNumber}`)
                    }
                } else if (tableIndex < 2) {
                    console.log(`[Scraper] Table ${tableIndex} bonusNumbersRow not found`)
                }

                // 必要な情報が揃っている場合のみ結果に追加
                if (mainNumbers.length === 6 && !isNaN(bonusNumber) && bonusNumber >= 1 && bonusNumber <= 43) {
                    // 日付が取得できなかった場合、現在の日付を使用（暫定）
                    if (!drawDate) {
                        drawDate = new Date().toISOString().split('T')[0]
                        console.warn(`[Scraper] Table ${tableIndex}: date not found, using current date`)
                    }
                    
                    results.push({
                        drawDate,
                        mainNumbers: mainNumbers.sort((a, b) => a - b),
                        bonusNumber,
                        drawNumber,
                    })
                    console.log(`[Scraper] ✓ Table ${tableIndex}: ${drawDate} (回号: ${drawNumber || 'N/A'}), 本数字: [${mainNumbers.join(',')}], ボーナス: ${bonusNumber}`)
                } else {
                    // デバッグ情報を出力（データが見つかったが不完全な場合）
                    if (mainNumbers.length > 0 || !isNaN(bonusNumber)) {
                        console.log(`[Scraper] ✗ Table ${tableIndex}: incomplete - mainNumbers:${mainNumbers.length} (${mainNumbers.join(',')}), bonus:${bonusNumber}, date:${drawDate}`)
                    }
                }
            } catch (error) {
                console.error(`[Scraper] Error processing table ${tableIndex}:`, error)
            }
        })

        console.log(`[Scraper] Total results found: ${results.length} for ${url}`)
        return results
    } catch (error) {
        console.error(`[Scraper] Error scraping ${url}:`, error)
        throw error
    }
}

/**
 * 複数のURLから当選番号を取得
 */
export async function scrapeMultipleUrls(urls: string[]): Promise<ScrapedWinningNumbers[]> {
    const allResults: ScrapedWinningNumbers[] = []
    const dateMap = new Map<string, ScrapedWinningNumbers>()

    for (const url of urls) {
        try {
            const results = await scrapeWinningNumbers(url)
            for (const result of results) {
                // 日付をキーとして重複を排除
                if (!dateMap.has(result.drawDate)) {
                    dateMap.set(result.drawDate, result)
                }
            }
        } catch (error) {
            console.error(`Error scraping ${url}:`, error)
        }
    }

    return Array.from(dateMap.values()).sort((a, b) =>
        b.drawDate.localeCompare(a.drawDate)
    )
}

/**
 * Puppeteerを使用してロト6の公式サイトから当選番号をスクレイピング
 * 動的に生成されるコンテンツに対応
 * @param url スクレイピングするURL
 * @returns 当選番号の配列
 */
export async function scrapeWinningNumbersWithPuppeteer(url: string): Promise<ScrapedWinningNumbers[]> {
    let browser: any = null
    
    try {
        console.log(`[Puppeteer Scraper] Fetching URL: ${url}`)
        
        // 環境判定
        const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined
        const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined || process.env.RAILWAY_ENVIRONMENT_NAME !== undefined
        
        console.log(`[Puppeteer Scraper] Environment: ${isVercel ? 'Vercel' : isRailway ? 'Railway' : 'Local'}`)
        
        // ブラウザの起動設定
        let executablePath: string | undefined = undefined
        
        // VercelまたはRailway環境の場合
        if (isVercel || isRailway) {
            try {
                // 環境変数で外部バイナリのURLが指定されている場合はそれを使用
                const remoteExecPath = process.env.CHROMIUM_REMOTE_EXEC_PATH
                
                if (remoteExecPath) {
                    console.log(`[Puppeteer Scraper] Using remote Chromium from: ${remoteExecPath}`)
                    executablePath = await chromium.executablePath(remoteExecPath)
                } else {
                    // デフォルトの方法でパスを取得
                    executablePath = await chromium.executablePath()
                }
                
                console.log(`[Puppeteer Scraper] Chromium executable path: ${executablePath}`)
                
                // パスが存在するか確認
                if (!executablePath) {
                    throw new Error('Chromium executable path is empty')
                }
            } catch (error) {
                console.error(`[Puppeteer Scraper] Error getting executable path:`, error)
                // フォールバック: 環境変数から直接パスを取得
                executablePath = process.env.CHROMIUM_EXECUTABLE_PATH
                if (!executablePath) {
                    console.error(`[Puppeteer Scraper] CHROMIUM_EXECUTABLE_PATH not set`)
                    throw new Error(`Chromium executable path could not be determined. Error: ${error instanceof Error ? error.message : String(error)}. Please set CHROMIUM_REMOTE_EXEC_PATH or CHROMIUM_EXECUTABLE_PATH environment variable.`)
                }
            }
        }
        
        const launchOptions: any = {
            args: (isVercel || isRailway) ? [
                ...chromium.args,
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--no-sandbox',
                '--single-process',
            ] : [],
            defaultViewport: { width: 1920, height: 1080 },
            executablePath: executablePath,
            headless: true,
            ignoreHTTPSErrors: true,
        }
        
        console.log(`[Puppeteer Scraper] Launching browser with options:`, {
            ...launchOptions,
            executablePath: executablePath ? 'set' : 'undefined',
            argsCount: launchOptions.args.length,
        })
        
        browser = await puppeteer.launch(launchOptions)
        const page = await browser.newPage()
        
        // User-Agentを設定
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        // ページにアクセス（コンテンツが完全に読み込まれるまで待機）
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        })
        
        // 少し待機してJavaScriptの実行を確実にする
        await page.waitForTimeout(2000)
        
        // HTMLコンテンツを取得
        const html = await page.content()
        console.log(`[Puppeteer Scraper] HTML length: ${html.length} characters`)
        
        // CheerioでHTMLをパース（既存のロジックを再利用）
        const $ = cheerio.load(html)
        const results: ScrapedWinningNumbers[] = []
        
        // テーブルを取得
        const tables = $('table')
        console.log(`[Puppeteer Scraper] Found ${tables.length} table(s)`)
        
        // 既存のscrapeWinningNumbers関数と同じロジックでパース
        tables.each((tableIndex, table) => {
            const $table = $(table)
            
            try {
                // 抽選日を取得
                let drawDate = ''
                const drawDateRow = $table.find('tr').filter((_, row) => {
                    const thText = $(row).find('th').text().trim()
                    return thText.includes('抽せん日')
                })
                
                if (drawDateRow.length > 0) {
                    let dateText = drawDateRow.find('.js-lottery-date-pc').text().trim()
                    if (!dateText) {
                        dateText = drawDateRow.find('p').text().trim()
                    }
                    if (!dateText) {
                        dateText = drawDateRow.find('td').text().trim()
                    }
                    if (dateText) {
                        const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
                        if (match) {
                            const [, year, month, day] = match
                            drawDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                        }
                    }
                }
                
                // 回号を取得
                let drawNumber: number | undefined
                const tableText = $table.text()
                const drawMatch = tableText.match(/第(\d+)回/)
                if (drawMatch) {
                    drawNumber = parseInt(drawMatch[1], 10)
                }
                
                // 本数字を取得
                const mainNumbersRow = $table.find('tr').filter((_, row) => {
                    const thText = $(row).find('th').text().trim()
                    return thText.includes('本数字')
                })
                
                const mainNumbers: number[] = []
                if (mainNumbersRow.length > 0) {
                    mainNumbersRow.find('td').each((_, td) => {
                        const $td = $(td)
                        const numberElem = $td.find('.js-lottery-number-pc').first()
                        if (numberElem.length === 0) {
                            const boldElem = $td.find('b.section__text--bold').first()
                            if (boldElem.length > 0) {
                                const text = boldElem.text().trim()
                                const numMatch = text.match(/\d+/)
                                if (numMatch) {
                                    const num = parseInt(numMatch[0], 10)
                                    if (!isNaN(num) && num >= 1 && num <= 43) {
                                        mainNumbers.push(num)
                                    }
                                }
                            }
                        } else {
                            const text = numberElem.text().trim()
                            const numMatch = text.match(/\d+/)
                            if (numMatch) {
                                const num = parseInt(numMatch[0], 10)
                                if (!isNaN(num) && num >= 1 && num <= 43) {
                                    mainNumbers.push(num)
                                }
                            }
                        }
                    })
                }
                
                // ボーナス数字を取得
                const bonusNumbersRow = $table.find('tr').filter((_, row) => {
                    const thText = $(row).find('th').text().trim()
                    return thText.includes('ボーナス数字')
                })
                
                let bonusNumber = NaN
                if (bonusNumbersRow.length > 0) {
                    bonusNumbersRow.find('td').each((_, td) => {
                        const $td = $(td)
                        const bonusElem = $td.find('.js-lottery-bonus-pc').first()
                        if (bonusElem.length === 0) {
                            const boldElem = $td.find('b.section__text--bold').first()
                            if (boldElem.length > 0) {
                                const text = boldElem.text().trim()
                                const numMatch = text.match(/\(?(\d+)\)?/)
                                if (numMatch) {
                                    const num = parseInt(numMatch[1], 10)
                                    if (!isNaN(num) && num >= 1 && num <= 43) {
                                        bonusNumber = num
                                        return false
                                    }
                                }
                            }
                        } else {
                            const text = bonusElem.text().trim()
                            const numMatch = text.match(/\(?(\d+)\)?/)
                            if (numMatch) {
                                const num = parseInt(numMatch[1], 10)
                                if (!isNaN(num) && num >= 1 && num <= 43) {
                                    bonusNumber = num
                                    return false
                                }
                            }
                        }
                    })
                }
                
                // 必要な情報が揃っている場合のみ結果に追加
                if (mainNumbers.length === 6 && !isNaN(bonusNumber) && bonusNumber >= 1 && bonusNumber <= 43) {
                    if (!drawDate) {
                        drawDate = new Date().toISOString().split('T')[0]
                        console.warn(`[Puppeteer Scraper] Table ${tableIndex}: date not found, using current date`)
                    }
                    
                    results.push({
                        drawDate,
                        mainNumbers: mainNumbers.sort((a, b) => a - b),
                        bonusNumber,
                        drawNumber,
                    })
                    console.log(`[Puppeteer Scraper] ✓ Table ${tableIndex}: ${drawDate} (回号: ${drawNumber || 'N/A'}), 本数字: [${mainNumbers.join(',')}], ボーナス: ${bonusNumber}`)
                }
            } catch (error) {
                console.error(`[Puppeteer Scraper] Error processing table ${tableIndex}:`, error)
            }
        })
        
        console.log(`[Puppeteer Scraper] Total results found: ${results.length} for ${url}`)
        return results
        
    } catch (error) {
        console.error(`[Puppeteer Scraper] Error scraping ${url}:`, error)
        throw error
    } finally {
        // ブラウザを確実に閉じる
        if (browser) {
            await browser.close()
        }
    }
}
