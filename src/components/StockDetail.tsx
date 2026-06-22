import type { StockAnalysis, StockConfig } from '../types'
import { getLatestChangePct, formatPct } from '../lib/data'

interface StockDetailProps {
  stock: StockConfig
  analysis: StockAnalysis | undefined
}

export default function StockDetail({ stock, analysis }: StockDetailProps) {
  if (!analysis) {
    return (
      <div className="newspaper-shadow bg-paper p-6">
        <div className="text-center text-ink-light">加载 {stock.name} 数据中...</div>
      </div>
    )
  }

  const change = getLatestChangePct(analysis.priceData)
  const isUp = change >= 0
  const latest = analysis.latest

  return (
    <div className="newspaper-shadow bg-paper p-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-ink pb-4 mb-4">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-3xl font-bold text-ink">{stock.name}</h2>
            <span className="font-mono text-sm text-ink-light">{stock.code}</span>
            <span className="text-[0.65rem] bg-ink text-paper px-1.5 py-0.5 font-mono">{stock.sector}</span>
          </div>
          <div className="flex gap-4 mt-2 font-mono text-[0.75rem]">
            <span>现价 <strong>{latest.close.toFixed(2)}</strong></span>
            <span>
              涨跌 <strong className={isUp ? 'trend-up' : 'trend-down'}>{formatPct(change)}</strong>
            </span>
            <span>
              预测 <strong className={analysis.prediction.conclusion === '看涨' ? 'trend-up' : 'trend-down'}>{analysis.prediction.conclusion}</strong>
            </span>
            {analysis.pnl && (
              <span>
                持仓盈亏 <strong className={analysis.pnl.profitPct >= 0 ? 'trend-up' : 'trend-down'}>{formatPct(analysis.pnl.profitPct)}</strong>
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-4xl font-bold text-ink">{analysis.trendScore.total}</div>
          <div className="font-mono text-xs text-ink-light">{analysis.trendScore.label}</div>
        </div>
      </div>

      {/* Action Panel */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border-2 border-ink p-3 bg-paper-dark">
          <div className="section-label text-[0.55rem] font-bold tracking-[0.15em] text-ink-light mb-1">TREND SCORE</div>
          <div className="font-display text-2xl font-bold">{analysis.trendScore.total}</div>
          <div className="text-xs font-serif-cn">{analysis.trendScore.label}</div>
        </div>
        <div className="border-2 border-ink p-3 bg-paper-dark">
          <div className="section-label text-[0.55rem] font-bold tracking-[0.15em] text-ink-light mb-1">ACTION ADVICE</div>
          <div className="font-serif-cn text-lg font-bold">{analysis.actionAdvice.advice}</div>
          <div className="text-xs text-ink-light">{analysis.actionAdvice.reason}</div>
        </div>
        <div className="border-2 border-ink p-3 bg-paper-dark">
          <div className="section-label text-[0.55rem] font-bold tracking-[0.15em] text-ink-light mb-1">S2_v2 PREDICTION</div>
          <div
            className={`font-display text-2xl font-bold ${
              analysis.prediction.conclusion === '看涨' ? 'trend-up' : 'trend-down'
            }`}
          >
            {analysis.prediction.conclusion}
          </div>
          <div className="text-xs font-mono">
            Score {analysis.prediction.ruleScore.toFixed(3)} / Conf {analysis.prediction.confidence}
          </div>
        </div>
      </div>

      {/* Trend Score Breakdown */}
      <div className="mb-6">
        <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em] mb-2">
          六维度评分明细
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: '波浪结构', value: analysis.trendScore.wave, weight: 25 },
            { label: '趋势线斜率', value: analysis.trendScore.trendline, weight: 20 },
            { label: 'ADX强度', value: analysis.trendScore.adx, weight: 15 },
            { label: 'MACD零轴', value: analysis.trendScore.macd, weight: 15 },
            { label: 'MA60斜率', value: analysis.trendScore.maSlope, weight: 15 },
            { label: '价格vs均线', value: analysis.trendScore.priceMa, weight: 10 },
          ].map((item) => (
            <div key={item.label} className="bg-paper-dark border border-border-light p-2 text-center">
              <div className="text-[0.6rem] text-ink-light">{item.label}</div>
              <div className="font-mono text-lg font-bold">{item.value}</div>
              <div className="text-[0.55rem] text-ink-light">权重 {item.weight}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Indicators */}
      <div className="mb-6">
        <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em] mb-2">
          关键技术指标
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <Indicator label="MA5" value={analysis.indicators.ma5} />
          <Indicator label="MA20" value={analysis.indicators.ma20} />
          <Indicator label="MA60" value={analysis.indicators.ma60} />
          <Indicator label="RSI(14)" value={analysis.indicators.rsi} />
          <Indicator label="MACD Hist" value={analysis.indicators.macdHist} />
          <Indicator label="布林带上轨" value={analysis.indicators.bbUpper} />
          <Indicator label="布林带下轨" value={analysis.indicators.bbLower} />
          <Indicator label="KDJ J" value={analysis.indicators.j} />
        </div>
      </div>

      {/* Price Chart Placeholder */}
      <div className="border-2 border-ink p-4 bg-paper-dark">
        <div className="section-label text-[0.6rem] font-bold tracking-[0.15em] text-ink-light mb-2">
          K线走势（近120日）
        </div>
        <div className="h-48 flex items-end gap-0.5">
          {analysis.priceData.slice(-60).map((d, i) => {
            const isUpBar = d.close >= d.open
            const height = `${(d.close / Math.max(...analysis.priceData.slice(-60).map((x) => x.high))) * 100}%`
            return (
              <div
                key={i}
                className={`flex-1 ${isUpBar ? 'bg-stock-red' : 'bg-stock-green'}`}
                style={{ height, minHeight: '4px' }}
                title={`${d.time} 开:${d.open} 收:${d.close}`}
              />
            )
          })}
        </div>
        <div className="text-center text-[0.6rem] text-ink-light mt-2">
          （完整 K 线图将在接入 echarts 后渲染）
        </div>
      </div>
    </div>
  )
}

function Indicator({ label, value }: { label: string; value?: number }) {
  return (
    <div className="bg-paper-dark border border-border-light p-2">
      <div className="text-[0.6rem] text-ink-light">{label}</div>
      <div className="font-mono text-sm">{value !== undefined ? value.toFixed(3) : '--'}</div>
    </div>
  )
}
