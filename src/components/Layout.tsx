import { useState } from 'react'
import type { StockConfig, IndexConfig, StockAnalysis, IndexAnalysis } from '../types'
import { TrendingUp, BarChart3, History, Layers, Settings, Star } from 'lucide-react'

interface LayoutProps {
  stocks: StockConfig[]
  indices: IndexConfig[]
  analyses: Record<string, StockAnalysis>
  indexAnalyses: Record<string, IndexAnalysis>
  activeTab: string
  setActiveTab: (tab: string) => void
  activeStock: string
  setActiveStock: (code: string) => void
  children: React.ReactNode
}

const TABS = [
  { id: 'overview', labelCn: '持仓总览', labelEn: 'Overview', icon: Star },
  { id: 'prediction', labelCn: '次日预测', labelEn: 'Prediction', icon: TrendingUp },
  { id: 'history', labelCn: '历史验证', labelEn: 'History', icon: History },
  { id: 'detail', labelCn: '个股深度', labelEn: 'Stocks', icon: BarChart3 },
  { id: 'backtest', labelCn: '模型对比', labelEn: 'Models', icon: Layers },
]

export default function Layout({
  stocks,
  indices,
  analyses: _analyses,
  indexAnalyses,
  activeTab,
  setActiveTab,
  activeStock,
  setActiveStock,
  children,
}: LayoutProps) {
  const [showStockMenu, setShowStockMenu] = useState(false)
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  const marketIndex = indexAnalyses[indices[0]?.code ?? '']
  const sectorIndex = indexAnalyses[indices[1]?.code ?? '']

  return (
    <div className="min-h-screen bg-[#E8E0CC] py-6 px-4">
      <div className="max-w-[1280px] mx-auto">
        {/* Masthead */}
        <div className="newspaper-shadow bg-paper mb-4">
          <div className="masthead-border mx-6 my-4 py-4 text-center">
            <div className="flex justify-between items-center text-[0.6rem] font-mono tracking-widest uppercase text-ink-light mb-2 px-4">
              <span>Vol. CCXLVI — No. 18,527</span>
              <span className="font-display text-lg tracking-[0.3em] text-stock-red">★</span>
              <span>EST. 2026</span>
            </div>
            <h1 className="font-display text-5xl font-black tracking-tight text-ink leading-none mb-2">THE DAILY STOCK</h1>
            <div className="font-mono text-[0.6rem] tracking-[0.25em] text-ink-light uppercase">
              Multi-Agent-Stock-Analysis &nbsp;|&nbsp; Portfolio Intelligence System
            </div>
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-border-light text-[0.55rem] font-mono tracking-wider text-ink-light px-4">
              <span>BEIJING, {today.toUpperCase()}</span>
              <span>INDUSTRIAL METALS EDITION</span>
              <span>{stocks.length} STOCKS + {indices.length} INDICES TRACKED</span>
            </div>
          </div>

          {/* Index Cards */}
          <div className="grid grid-cols-2 gap-4 mb-4 px-6">
            {marketIndex && (
              <IndexCard
                title="SHANGHAI COMPOSITE"
                code={marketIndex.config.code}
                latest={marketIndex.latest}
                changePct={((marketIndex.latest.close - (marketIndex.priceData[marketIndex.priceData.length - 2]?.close ?? marketIndex.latest.close)) / (marketIndex.priceData[marketIndex.priceData.length - 2]?.close ?? marketIndex.latest.close)) * 100}
              />
            )}
            {sectorIndex && (
              <IndexCard
                title="INDUSTRIAL METALS INDEX"
                code={sectorIndex.config.code}
                latest={sectorIndex.latest}
                changePct={((sectorIndex.latest.close - (sectorIndex.priceData[sectorIndex.priceData.length - 2]?.close ?? sectorIndex.latest.close)) / (sectorIndex.priceData[sectorIndex.priceData.length - 2]?.close ?? sectorIndex.latest.close)) * 100}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-1 border-b border-border-light">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`nav-tab px-4 py-2.5 font-mono text-[0.7rem] tracking-wider uppercase flex items-center ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="w-3 h-3 mr-1.5" />
                  <span className="font-serif-cn text-sm mr-1">{tab.labelCn}</span>
                  <span className="hidden sm:inline">{tab.labelEn}</span>
                </button>
              ))}
              <div className="flex-1"></div>
              <div className="relative">
                <button
                  className="nav-tab px-4 py-2.5 font-mono text-[0.7rem] tracking-wider uppercase flex items-center"
                  onClick={() => setShowStockMenu(!showStockMenu)}
                >
                  <Settings className="w-3 h-3 mr-1.5" />
                  <span className="font-serif-cn text-sm">管理</span>
                </button>
                {showStockMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-paper border-2 border-ink shadow-lg z-50 min-w-[180px]">
                    {stocks.map((s) => (
                      <button
                        key={s.code}
                        className={`block w-full text-left px-4 py-2 text-sm font-serif-cn hover:bg-paper-dark ${activeStock === s.code && activeTab === 'detail' ? 'bg-paper-dark font-bold' : ''}`}
                        onClick={() => {
                          setActiveStock(s.code)
                          setActiveTab('detail')
                          setShowStockMenu(false)
                        }}
                      >
                        {s.name} ({s.code})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="min-h-[600px]">{children}</div>

        {/* Footer */}
        <div className="mt-8 text-center font-mono text-[0.6rem] text-ink-light tracking-wider">
          Multi-Agent-Stock-Analysis · Data powered by Kimi 2.6 iFinD · Engineered with Python · Deployed via GitHub Actions
        </div>
      </div>
    </div>
  )
}

function IndexCard({ title, code, latest, changePct }: { title: string; code: string; latest: { close: number; open: number; high: number; low: number }; changePct: number }) {
  const isUp = changePct >= 0
  return (
    <div className="idx-card border-2 border-ink p-3 bg-paper-dark">
      <div className="flex justify-between items-center mb-1">
        <div className="section-label text-[0.55rem] font-bold tracking-[0.15em] text-ink-light">{title}</div>
        <span className="font-mono text-[0.6rem] bg-ink text-paper px-1.5 py-0.5">{code}</span>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <div className="font-display text-3xl font-bold text-ink">{latest.close.toLocaleString()}</div>
          <div className="font-mono text-[0.7rem] mt-0.5">
            <span className={`${isUp ? 'trend-up' : 'trend-down'} font-bold`}>
              {isUp ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-right font-mono text-[0.6rem] text-ink-light">
          <div>开: {latest.open.toLocaleString()}</div>
          <div>高: {latest.high.toLocaleString()}</div>
          <div>低: {latest.low.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}
