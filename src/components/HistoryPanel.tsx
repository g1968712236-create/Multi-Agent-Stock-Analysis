import { HISTORY_DATA } from '../constants/history'
import { MODEL_RESULTS } from '../constants/modelResults'
import type { PredictionRecord } from '../types'

export default function HistoryPanel() {
  const records = HISTORY_DATA
  const evaluated = records.filter((r) => r.evaluated)
  const correct = evaluated.filter((r) => r.isCorrect).length
  const total = evaluated.length
  const accuracy = total ? ((correct / total) * 100).toFixed(1) : '0.0'

  const byDate = groupByDate(records)

  return (
    <div className="newspaper-shadow bg-paper p-6">
      <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em] mb-4">
        历史验证与模型对比
      </div>

      {/* Backtest Models */}
      <div className="mb-6">
        <div className="section-label text-[0.6rem] font-bold tracking-[0.15em] mb-2">模型对比</div>
        <table className="w-full text-[0.72rem] stock-table">
          <thead>
            <tr>
              <th className="text-left">模型</th>
              <th className="text-right">完全准确率</th>
              <th className="text-right">震荡偏差</th>
              <th className="text-left pl-4">状态</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {MODEL_RESULTS.map((m) => (
              <tr key={m.name} className={m.status === 'current' ? 'bg-paper-dark' : ''}>
                <td className="py-1.5 font-serif-cn">{m.name}</td>
                <td className="text-right py-1.5">{(m.accuracy * 100).toFixed(1)}%</td>
                <td className="text-right py-1.5">{(m.neutralBias * 100).toFixed(1)}%</td>
                <td className="pl-4 py-1.5 text-xs">
                  <span
                    className={`px-1.5 py-0.5 ${
                      m.status === 'current'
                        ? 'bg-stock-red text-white'
                        : m.status === 'deprecated'
                        ? 'bg-border-light text-ink-light'
                        : 'bg-paper-dark text-ink'
                    }`}
                  >
                    {m.recommendation}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="double-border py-3 px-4 bg-paper-dark mb-4 flex justify-between items-center">
        <div className="font-mono text-[0.75rem]">
          <span className="mr-4">累计预测：<strong>{total}条</strong></span>
          <span className="mr-4">正确：<strong>{correct}条</strong></span>
          <span>准确率：<strong>{accuracy}%</strong></span>
        </div>
      </div>

      {/* Daily Records */}
      <div className="space-y-4">
        {Object.entries(byDate).map(([date, dayRecords]) => {
          const dayCorrect = dayRecords.filter((r) => r.isCorrect).length
          const dayTotal = dayRecords.length
          const dayAccuracy = dayTotal ? ((dayCorrect / dayTotal) * 100).toFixed(1) : '0.0'
          return (
            <div key={date} className="border border-border-light p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-xs font-bold">{date}</span>
                <span className="font-mono text-xs">{dayCorrect}/{dayTotal} = {dayAccuracy}%</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dayRecords.map((r) => (
                  <div
                    key={r.id}
                    className={`text-[0.65rem] font-mono p-1.5 ${
                      r.isCorrect === undefined
                        ? 'bg-border-light'
                        : r.isCorrect
                        ? 'bg-trend-up'
                        : 'bg-trend-down'
                    }`}
                  >
                    <div className="font-serif-cn">{r.stockName}</div>
                    <div>
                      预：<span className={r.predictConclusion === '看涨' ? 'trend-up' : 'trend-down'}>{r.predictConclusion}</span>
                    </div>
                    {r.actualDirection && (
                      <div>
                        实：
                        <span className={r.actualDirection === '涨' ? 'trend-up' : 'trend-down'}>
                          {r.actualDirection} {r.actualChangePct?.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function groupByDate(records: PredictionRecord[]): Record<string, PredictionRecord[]> {
  return records.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = []
    acc[r.date].push(r)
    return acc
  }, {} as Record<string, PredictionRecord[]>)
}
