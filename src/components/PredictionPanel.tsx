import type { StockAnalysis } from '../types'

interface PredictionPanelProps {
  analyses: Record<string, StockAnalysis>
}

export default function PredictionPanel({ analyses }: PredictionPanelProps) {
  const list = Object.values(analyses)
  const upCount = list.filter((a) => a.prediction.conclusion === '看涨').length
  const downCount = list.length - upCount

  return (
    <div className="newspaper-shadow bg-paper p-6">
      <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em] mb-4">
        S2_v2 次日走势预测（强制二分类）
      </div>

      {/* Distribution */}
      <div className="double-border py-3 px-4 bg-paper-dark mb-4 flex justify-between items-center">
        <div className="font-mono text-[0.75rem]">
          <span className="mr-4">看涨：<strong className="trend-up">{upCount}只</strong></span>
          <span className="mr-4">看跌：<strong className="trend-down">{downCount}只</strong></span>
          <span>阈值：<strong>波动率驱动（高{'>'}35% → 0.46 / 低 → 0.40）</strong></span>
        </div>
      </div>

      {/* Prediction Table */}
      <table className="w-full text-[0.72rem] stock-table mb-6">
        <thead>
          <tr>
            <th className="text-left py-1.5">股票</th>
            <th className="text-right py-1.5">RuleScore</th>
            <th className="text-right py-1.5">阈值</th>
            <th className="text-center py-1.5">结论</th>
            <th className="text-center py-1.5">置信度</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {list.map((a) => {
            const p = a.prediction
            const isUp = p.conclusion === '看涨'
            return (
              <tr key={a.config.code} className={isUp ? 'bg-trend-up' : 'bg-trend-down'}>
                <td className="py-1.5 font-serif-cn">{a.config.name}</td>
                <td className="text-right py-1.5">{p.ruleScore.toFixed(4)}</td>
                <td className="text-right py-1.5">{p.threshold.toFixed(2)}</td>
                <td className={`text-center py-1.5 font-bold ${isUp ? 'trend-up' : 'trend-down'}`}>
                  {p.conclusion}
                </td>
                <td className="text-center py-1.5">{p.confidence}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Factor Detail */}
      <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em] mb-2">
        十因子明细（权重 × 值）
      </div>
      {list.map((a) => (
        <div key={a.config.code} className="mb-4 border-b border-border-light pb-3">
          <div className="font-serif-cn text-sm font-bold mb-2">{a.config.name} ({a.config.code})</div>
          <div className="grid grid-cols-5 gap-2">
            {a.prediction.factors.map((f) => (
              <div key={f.name} className="bg-paper-dark p-2 border border-border-light">
                <div className="text-[0.6rem] text-ink-light">{f.name}</div>
                <div className="text-xs font-mono">
                  {(f.weight * 100).toFixed(1)}% × {f.value.toFixed(2)}
                </div>
                <div className="score-bar mt-1">
                  <div
                    className="score-bar-fill bg-ink"
                    style={{ width: `${f.value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
