export interface PriceData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockConfig {
  code: string
  name: string
  sector: string
  tags: string[]
  costPrice?: number
  shares?: number
}

export interface IndexConfig {
  code: string
  name: string
  type: 'market' | 'sector'
}

export interface IndicatorData {
  ma5?: number
  ma10?: number
  ma20?: number
  ma60?: number
  ma120?: number
  ma250?: number
  macd?: number
  macdSignal?: number
  macdHist?: number
  rsi?: number
  bbUpper?: number
  bbMiddle?: number
  bbLower?: number
  k?: number
  d?: number
  j?: number
  adx?: number
  plusDi?: number
  minusDi?: number
  volumeMa5?: number
  volumeMa20?: number
  [key: string]: number | undefined
}

export interface Factor {
  name: string
  weight: number
  value: number
}

export interface Prediction {
  code: string
  ruleScore: number
  threshold: number
  conclusion: '看涨' | '看跌'
  confidence: '高' | '中等'
  upProb: number
  downProb: number
  neutralProb: number
  factors: Factor[]
}

export interface TrendScore {
  code: string
  total: number
  wave: number
  trendline: number
  adx: number
  macd: number
  maSlope: number
  priceMa: number
  label: string
}

export interface ActionAdvice {
  code: string
  advice: '逢低补仓' | '持有待涨' | '持有观望' | '持有等待' | '分批止盈' | '观望等待'
  reason: string
}

export interface PredictionRecord {
  id: string
  date: string
  stockCode: string
  stockName: string
  predictConclusion: '看涨' | '看跌'
  confidence: '高' | '中等'
  upProb: number
  downProb: number
  neutralProb: number
  closePrice: number
  actualDirection?: string
  actualChangePct?: number
  isCorrect?: boolean
  evaluated: boolean
}

export interface WavePoint {
  index: number
  date: string
  price: number
  type: 'peak' | 'valley'
}

export interface WaveAnalysis {
  points: WavePoint[]
  pattern: string
  confidence: number
}

export interface TriangleAnalysis {
  upperLine: { slope: number; intercept: number }
  lowerLine: { slope: number; intercept: number }
  isConverging: boolean
  convergenceRate: number
  apexIndex: number
  type: 'symmetric' | 'ascending' | 'descending' | 'none'
}

export interface MainForce {
  direction: 'inflow' | 'outflow' | 'neutral'
  force: number
  trend: 'increasing' | 'decreasing' | 'stable'
  cf: number
  cf5: number
  mfs: number
}

export interface StockAnalysis {
  config: StockConfig
  priceData: PriceData[]
  latest: PriceData
  indicators: IndicatorData
  wave: WaveAnalysis
  triangle: TriangleAnalysis
  mainForce: MainForce
  prediction: Prediction
  trendScore: TrendScore
  actionAdvice: ActionAdvice
  pnl?: {
    costPrice: number
    currentPrice: number
    changePct: number
    profitPct: number
  }
}

export interface IndexAnalysis {
  config: IndexConfig
  priceData: PriceData[]
  latest: PriceData
  indicators: IndicatorData
  trendScore: TrendScore
}

export interface DailyData {
  date: string
  stocks: Record<string, StockAnalysis>
  indices: Record<string, IndexAnalysis>
  predictions: Record<string, Prediction>
  trendScores: Record<string, TrendScore>
  actionAdvices: Record<string, ActionAdvice>
}

export interface BacktestModel {
  name: string
  accuracy: number
  neutralBias: number
  recommendation: string
  status: 'current' | 'upgraded' | 'reference' | 'deprecated'
}
