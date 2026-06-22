import { useState } from 'react'
import type { StockConfig, IndexConfig } from '../types'
import { X, Plus } from 'lucide-react'

interface StockManagerProps {
  stocks: StockConfig[]
  indices: IndexConfig[]
  onChangeStocks: (stocks: StockConfig[]) => void
}

export default function StockManager({ stocks, indices, onChangeStocks }: StockManagerProps) {
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newSector, setNewSector] = useState('')

  const handleAdd = () => {
    if (!newCode || !newName) return
    const code = newCode.trim()
    if (stocks.some((s) => s.code === code)) return
    onChangeStocks([
      ...stocks,
      { code, name: newName.trim(), sector: newSector.trim() || '其他', tags: [] },
    ])
    setNewCode('')
    setNewName('')
    setNewSector('')
  }

  const handleRemove = (code: string) => {
    onChangeStocks(stocks.filter((s) => s.code !== code))
  }

  return (
    <div className="newspaper-shadow bg-paper p-6">
      <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em] mb-4">
        股票管理
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock List */}
        <div>
          <div className="section-label text-[0.6rem] font-bold tracking-[0.15em] mb-2">当前持仓</div>
          <table className="w-full text-[0.72rem] stock-table">
            <thead>
              <tr>
                <th className="text-left">代码</th>
                <th className="text-left">名称</th>
                <th className="text-left">板块</th>
                <th className="text-center">操作</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {stocks.map((s) => (
                <tr key={s.code}>
                  <td className="py-1.5">{s.code}</td>
                  <td className="py-1.5 font-serif-cn">{s.name}</td>
                  <td className="py-1.5">{s.sector}</td>
                  <td className="py-1.5 text-center">
                    <button
                      className="text-stock-red hover:opacity-70"
                      onClick={() => handleRemove(s.code)}
                    >
                      <X className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Form */}
        <div className="border-2 border-ink p-4 bg-paper-dark">
          <div className="section-label text-[0.6rem] font-bold tracking-[0.15em] mb-2">添加股票</div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-ink-light mb-1">股票代码</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="如 600596"
                className="w-full bg-paper border border-border-light px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-light mb-1">股票名称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="如 新安股份"
                className="w-full bg-paper border border-border-light px-2 py-1.5 text-sm font-serif-cn focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="block text-xs text-ink-light mb-1">所属板块</label>
              <input
                type="text"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                placeholder="如 有机硅"
                className="w-full bg-paper border border-border-light px-2 py-1.5 text-sm focus:outline-none focus:border-ink"
              />
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-ink text-paper py-2 text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
        </div>
      </div>

      {/* Indices */}
      <div className="mt-6 border-t border-border-light pt-4">
        <div className="section-label text-[0.6rem] font-bold tracking-[0.15em] mb-2">跟踪指数</div>
        <div className="grid grid-cols-2 gap-3">
          {indices.map((idx) => (
            <div key={idx.code} className="bg-paper-dark border border-border-light p-2">
              <div className="text-xs font-serif-cn">{idx.name}</div>
              <div className="text-[0.6rem] font-mono text-ink-light">{idx.code} · {idx.type === 'market' ? '大盘' : '板块'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
