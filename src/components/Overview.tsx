import type { StockAnalysis, IndexAnalysis, StockConfig, IndexConfig } from '../types'
import { getLatestChangePct, formatPct } from '../lib/data'

interface OverviewProps {
  stocks: StockConfig[]
  indices: IndexConfig[]
  analyses: Record<string, StockAnalysis>
  indexAnalyses: Record<string, IndexAnalysis>
  onSelectStock: (code: string) => void
  onChangeTab: (tab: string) => void
}

export default function Overview({ stocks, analyses, onSelectStock, onChangeTab }: OverviewProps) {
  const stockList = stocks.map((s) => analyses[s.code]).filter(Boolean)
  const upCount = stockList.filter((a) => getLatestChangePct(a.priceData) >= 0).length
  const downCount = stockList.length - upCount
  const avgScore = stockList.length ? stockList.reduce((sum, a) => sum + a.trendScore.total, 0) / stockList.length : 0

  const sorted = [...stockList].sort((a, b) => {
    const pa = a.pnl?.profitPct ?? getLatestChangePct(a.priceData)
    const pb = b.pnl?.profitPct ?? getLatestChangePct(b.priceData)
    return pb - pa
  })

  return (
    <div className="newspaper-shadow bg-paper p-6">
      {/* Hero Bar */}
      <div className="double-border py-3 px-4 bg-paper-dark mb-4 flex justify-between items-center">
        <div className="font-mono text-[0.75rem]">
          <span className="mr-4">上涨：<strong className="trend-up">{upCount}只</strong></span>
          <span className="mr-4">下跌：<strong className="trend-down">{downCount}只</strong></span>
          <span className="mr-4">板块均分：<strong className={avgScore >= 55 ? 'trend-up' : avgScore < 45 ? 'trend-down' : 'text-stock-orange'}>{avgScore.toFixed(1)}</strong></span>
          <span>S2_v2准确率：<strong>56.2%</strong></span>
        </div>
        <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em]">MARKET SNAPSHOT</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Holdings Table */}
        <div className="lg:col-span-3 lg:border-r lg:border-border-light lg:pr-4">
          <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em] mb-2">
            ★ 8只持仓明细 + 操作建议
          </div>
          <table className="w-full text-[0.72rem] stock-table">
            <thead>
              <tr>
                <th className="text-left py-1.5 pr-1">股票</th>
                <th className="text-right py-1.5 px-0.5">现价</th>
                <th className="text-right py-1.5 px-0.5">涨跌%</th>
                <th className="text-right py-1.5 px-0.5">评分</th>
                <th className="text-center py-1.5 pl-1">操作建议</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {sorted.map((analysis) => {
                const change = getLatestChangePct(analysis.priceData)
                const isUp = change >= 0
                const bgClass = isUp ? 'bg-trend-up' : 'bg-trend-down'
                return (
                  <tr
                    key={analysis.config.code}
                    className={`${bgClass} cursor-pointer hover:opacity-80`}
                    onClick={() => {
                      onSelectStock(analysis.config.code)
                      onChangeTab('detail')
                    }}
                  >
                    <td className="py-1.5 pr-1 font-serif-cn">{analysis.config.name}</td>
                    <td className="text-right py-1.5 px-0.5">{analysis.latest.close.toFixed(2)}</td>
                    <td className={`text-right py-1.5 px-0.5 font-bold ${isUp ? 'trend-up' : 'trend-down'}`}>
                      {formatPct(change)}
                    </td>
                    <td className="text-right py-1.5 px-0.5 font-bold">{analysis.trendScore.total}</td>
                    <td className="text-center py-1.5 pl-1">
                      <span className={`px-1.5 py-0.5 text-[0.6rem] font-bold ${
                        analysis.actionAdvice.advice === '逢低补仓'
                          ? 'bg-stock-green text-white'
                          : analysis.actionAdvice.advice === '持有待涨'
                          ? 'bg-ink text-paper'
                          : analysis.actionAdvice.advice === '分批止盈'
                          ? 'bg-stock-red text-white'
                          : 'bg-border-light text-ink'
                      }`}>
                        {analysis.actionAdvice.advice}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Trend Distribution */}
        <div className="lg:col-span-2">
          <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em] mb-2">
            趋势评分分布
          </div>
          <div className="space-y-2">
            {stockList.map((a) => {
              const score = a.trendScore.total
              const color = score >= 70 ? 'bg-stock-red' : score >= 55 ? 'bg-stock-orange' : score >= 45 ? 'bg-gold' : score >= 30 ? 'bg-ink-light' : 'bg-stock-green'
              return (
                <div key={a.config.code} className="flex items-center gap-2">
                  <span className="font-serif-cn text-xs w-16 truncate">{a.config.name}</span>
                  <div className="flex-1 score-bar">
                    <div className={`score-bar-fill ${color}`} style={{ width: `${score}%` }} />
                  </div>
                  <span className="font-mono text-xs w-8 text-right">{score}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-6 border-t border-border-light pt-4">
            <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em] mb-2">
              板块策略
            </div>
            <p className="text-sm leading-relaxed text-ink-light">
              当前板块均分 <strong>{avgScore.toFixed(1)}</strong>，
              {avgScore >= 55 ? '整体趋势偏多，建议关注强势股逢低补仓机会。' : avgScore < 45 ? '板块整体偏弱，建议控制仓位，优先止盈弱势标的。' : '板块处于震荡整理阶段，建议持有观望，等待方向明朗。'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
