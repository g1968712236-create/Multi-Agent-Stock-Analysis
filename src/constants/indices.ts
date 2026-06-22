import type { IndexConfig } from '../types'

export const DEFAULT_INDICES: IndexConfig[] = [
  { code: '000001.SH', name: '上证指数', type: 'market' },
  { code: '881168', name: '工业金属', type: 'sector' },
]

export const INDEX_STORAGE_KEY = 'stockagent_indices_v1'
