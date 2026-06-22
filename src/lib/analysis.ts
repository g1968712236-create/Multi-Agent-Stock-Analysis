import type { StockAnalysis, Prediction, TrendScore, ActionAdvice, PriceData, IndicatorData, StockConfig } from '../types'

export function getTrendLabel(score: number): string {
  if (score >= 70) return '强势多头'
  if (score >= 55) return '偏多'
  if (score >= 45) return '震荡'
  if (score >= 30) return '偏空'
  return '弱势空头'
}

export function getActionAdvice(
  stock: StockConfig,
  score: number,
  changePct: number,
  indicators: IndicatorData,
  _prediction: Prediction,
): ActionAdvice {
  const hasPosition = (stock.costPrice ?? 0) > 0
  const macdPositive = (indicators?.macdHist ?? 0) > 0
  const shortUp = changePct > 0
  const shortDown = changePct < 0
  const oversold = (indicators?.rsi ?? 50) < 30

  if (hasPosition) {
    if (score >= 55 && shortUp && macdPositive) {
      return { code: stock.code, advice: '持有待涨', reason: '趋势向好，短期向上' }
    }
    if (score < 45 && shortDown) {
      return { code: stock.code, advice: '分批止盈', reason: '趋势走弱，短期向下' }
    }
    if (shortDown && score >= 55) {
      return { code: stock.code, advice: '持有等待', reason: '长期向好，短期回调' }
    }
    if (score < 45 && oversold) {
      return { code: stock.code, advice: '持有等待', reason: '超卖，等待反弹' }
    }
    return { code: stock.code, advice: '持有观望', reason: '趋势不明，观望' }
  }

  if (score >= 55 && oversold && macdPositive) {
    return { code: stock.code, advice: '逢低补仓', reason: '趋势向好且超卖' }
  }
  if (score < 45 && shortDown && !oversold) {
    return { code: stock.code, advice: '观望等待', reason: '趋势走弱' }
  }
  return { code: stock.code, advice: '持有观望', reason: '无明确信号' }
}

export function computePnl(stock: StockConfig, latestPrice: number) {
  if (!stock.costPrice || stock.costPrice <= 0 || !stock.shares || stock.shares <= 0) {
    return undefined
  }
  const costPrice = stock.costPrice
  const currentPrice = latestPrice
  const changePct = ((currentPrice - costPrice) / costPrice) * 100
  return {
    costPrice,
    currentPrice,
    changePct,
    profitPct: changePct,
  }
}

export function generateMockAnalysis(stock: StockConfig, data: PriceData[]): StockAnalysis {
  const latest = data[data.length - 1]
  const prev = data[data.length - 2]
  const changePct = ((latest.close - prev.close) / prev.close) * 100

  const baseScore = 40 + Math.random() * 35
  const trendScore: TrendScore = {
    code: stock.code,
    total: Math.round(baseScore),
    wave: Math.round(Math.random() * 100),
    trendline: Math.round(Math.random() * 100),
    adx: Math.round(Math.random() * 100),
    macd: Math.round(Math.random() * 100),
    maSlope: Math.round(Math.random() * 100),
    priceMa: Math.round(Math.random() * 100),
    label: getTrendLabel(baseScore),
  }

  const volatility = 25 + Math.random() * 20
  const threshold = volatility > 35 ? 0.46 : 0.40
  const ruleScore = 0.35 + Math.random() * 0.35
  const conclusion = ruleScore >= threshold ? '看涨' : '看跌'
  const confidence = Math.abs(ruleScore - threshold) > 0.05 ? '高' : '中等'

  const prediction: Prediction = {
    code: stock.code,
    ruleScore: Number(ruleScore.toFixed(4)),
    threshold,
    conclusion,
    confidence,
    upProb: conclusion === '看涨' ? ruleScore : 1 - ruleScore,
    downProb: conclusion === '看跌' ? ruleScore : 1 - ruleScore,
    neutralProb: 0,
    factors: [
      { name: '趋势', weight: 0.12, value: Math.random() },
      { name: 'RSI', weight: 0.104, value: Math.random() },
      { name: 'CLV量价', weight: 0.103, value: Math.random() },
      { name: '波动率', weight: 0.109, value: Math.random() },
      { name: '布林带', weight: 0.097, value: Math.random() },
      { name: 'ADX', weight: 0.098, value: Math.random() },
      { name: 'MACD', weight: 0.093, value: Math.random() },
      { name: '成交量', weight: 0.09, value: Math.random() },
      { name: 'KDJ', weight: 0.089, value: Math.random() },
      { name: 'MA60', weight: 0.095, value: Math.random() },
    ],
  }

  const indicators: IndicatorData = {
    ma5: latest.close * 0.99,
    ma20: latest.close * 0.98,
    ma60: latest.close * 0.97,
    rsi: 35 + Math.random() * 30,
    macdHist: (Math.random() - 0.5) * 2,
  }

  return {
    config: stock,
    priceData: data,
    latest,
    indicators,
    wave: { points: [], pattern: '未识别', confidence: 0 },
    triangle: { upperLine: { slope: 0, intercept: 0 }, lowerLine: { slope: 0, intercept: 0 }, isConverging: false, convergenceRate: 0, apexIndex: 0, type: 'none' },
    mainForce: { direction: 'neutral', force: 0, trend: 'stable', cf: 0, cf5: 0, mfs: 0 },
    prediction,
    trendScore,
    actionAdvice: getActionAdvice(stock, trendScore.total, changePct, indicators, prediction),
    pnl: computePnl(stock, latest.close),
  }
}
