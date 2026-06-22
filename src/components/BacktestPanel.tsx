import { MODEL_RESULTS } from '../constants/modelResults'

export default function BacktestPanel() {
  return (
    <div className="newspaper-shadow bg-paper p-6">
      <div className="section-label text-[0.6rem] font-bold text-stock-red tracking-[0.2em] mb-4">
        模型演进与回测对比
      </div>

      <div className="mb-6">
        <table className="w-full text-[0.72rem] stock-table">
          <thead>
            <tr>
              <th className="text-left">排名</th>
              <th className="text-left">模型</th>
              <th className="text-right">完全准确率</th>
              <th className="text-right">震荡偏差</th>
              <th className="text-left pl-4">推荐度</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {MODEL_RESULTS.map((m, i) => (
              <tr key={m.name} className={m.status === 'current' ? 'bg-paper-dark' : ''}>
                <td className="py-1.5">#{i + 1}</td>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-2 border-ink p-4 bg-paper-dark">
          <div className="section-label text-[0.6rem] font-bold tracking-[0.15em] mb-2">S2_v2 核心改进</div>
          <ul className="text-sm space-y-1 text-ink-light list-disc list-inside">
            <li>权重来源：XGBoost 自动学习替代人工设定</li>
            <li>因子数量：从 3 个扩展到 10 个</li>
            <li>阈值策略：固定 0.50 → 波动率驱动动态阈值</li>
            <li>分类方式：强制二分类（涨/跌），去除震荡</li>
          </ul>
        </div>
        <div className="border-2 border-ink p-4 bg-paper-dark">
          <div className="section-label text-[0.6rem] font-bold tracking-[0.15em] mb-2">XGBoost 训练洞察</div>
          <ul className="text-sm space-y-1 text-ink-light list-disc list-inside">
            <li>特征重要性均匀分布，Top 与末位差距仅约 4%</li>
            <li>CLV 量价重要性超预期（约 11.4%）</li>
            <li>波动率因子价值高，证实动态阈值假设</li>
            <li>非线性效应显著：XGBoost 较规则引擎提升 12.6%</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
