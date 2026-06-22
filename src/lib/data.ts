import type { PriceData, StockConfig, IndexConfig } from '../types'
import { DEFAULT_STOCKS, STOCK_STORAGE_KEY } from '../constants/stocks'
import { DEFAULT_INDICES, INDEX_STORAGE_KEY } from '../constants/indices'

const DATA_BASE_URL = import.meta.env.BASE_URL || '/Multi-Agent-Stock-Analysis/'

export function loadStocks(): StockConfig[] {
  try {
    const raw = localStorage.getItem(STOCK_STORAGE_KEY)
    if (!raw) return DEFAULT_STOCKS
    const parsed = JSON.parse(raw) as StockConfig[]
    return parsed.length ? parsed : DEFAULT_STOCKS
  } catch {
    return DEFAULT_STOCKS
  }
}

export function saveStocks(stocks: StockConfig[]): void {
  localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stocks))
}

export function loadIndices(): IndexConfig[] {
  try {
    const raw = localStorage.getItem(INDEX_STORAGE_KEY)
    if (!raw) return DEFAULT_INDICES
    const parsed = JSON.parse(raw) as IndexConfig[]
    return parsed.length ? parsed : DEFAULT_INDICES
  } catch {
    return DEFAULT_INDICES
  }
}

export async function fetchStockData(code: string): Promise<PriceData[]> {
  const fileName = code.includes('.') ? code.replace('.', '_') : code
  const urls = [
    `${DATA_BASE_URL}data/${fileName}.json`,
    `/data/${fileName}.json`,
  ]

  let lastError: Error | undefined
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = (await res.json()) as PriceData[]
      return data
    } catch (e) {
      lastError = e as Error
    }
  }

  throw lastError ?? new Error(`Failed to load data for ${code}`)
}

export function generateMockData(code: string, days = 120): PriceData[] {
  const data: PriceData[] = []
  const basePrice = 10 + (code.charCodeAt(0) % 20)
  let price = basePrice
  const today = new Date('2026-06-19')

  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const change = (Math.random() - 0.48) * 0.04 * price
    const open = price
    price = price + change
    const high = Math.max(open, price) * (1 + Math.random() * 0.015)
    const low = Math.min(open, price) * (1 - Math.random() * 0.015)
    const volume = Math.floor(1000000 + Math.random() * 5000000)

    data.push({
      time: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(price.toFixed(2)),
      volume,
    })
  }

  return data
}

export function getLatestChangePct(data: PriceData[]): number {
  if (data.length < 2) return 0
  const latest = data[data.length - 1]
  const prev = data[data.length - 2]
  return ((latest.close - prev.close) / prev.close) * 100
}

export function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatNumber(value: number, digits = 2): string {
  return value.toFixed(digits)
}
