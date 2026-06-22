import type { StockConfig } from '../types'

export const DEFAULT_STOCKS: StockConfig[] = [
  { code: '600596', name: '新安股份', sector: '有机硅/农药', tags: ['有机硅'] },
  { code: '603993', name: '洛阳钼业', sector: '铜/钴', tags: ['铜', '钴'] },
  { code: '601899', name: '紫金矿业', sector: '金/铜', tags: ['金', '铜'] },
  { code: '000878', name: '云南铜业', sector: '铜', tags: ['铜'] },
  { code: '601168', name: '西部矿业', sector: '铜/锌', tags: ['铜', '锌'] },
  { code: '600219', name: '南山铝业', sector: '铝', tags: ['铝'] },
  { code: '002532', name: '天山铝业', sector: '铝', tags: ['铝'] },
  { code: '601600', name: '中国铝业', sector: '铝/综合', tags: ['铝', '综合'] },
]

export const STOCK_STORAGE_KEY = 'stockagent_stocks_v1'
export const HISTORY_STORAGE_KEY = 'stockagent_history_v1'
