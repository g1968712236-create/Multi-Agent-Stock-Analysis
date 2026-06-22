import { useState, useEffect, useMemo } from 'react'
import type { StockConfig, IndexConfig, StockAnalysis, IndexAnalysis, TrendScore } from './types'
import Layout from './components/Layout'
import Overview from './components/Overview'
import PredictionPanel from './components/PredictionPanel'
import HistoryPanel from './components/HistoryPanel'
import StockDetail from './components/StockDetail'
import BacktestPanel from './components/BacktestPanel'
import StockManager from './components/StockManager'
import { loadStocks, saveStocks, loadIndices, fetchStockData, generateMockData } from './lib/data'
import { generateMockAnalysis, getTrendLabel } from './lib/analysis'

function App() {
  const [stocks, setStocks] = useState<StockConfig[]>(loadStocks)
  const [indices, _setIndices] = useState<IndexConfig[]>(loadIndices)
  const [activeTab, setActiveTab] = useState('overview')
  const [activeStock, setActiveStock] = useState(stocks[0]?.code ?? '')
  const [analyses, setAnalyses] = useState<Record<string, StockAnalysis>>({})
  const [indexAnalyses, setIndexAnalyses] = useState<Record<string, IndexAnalysis>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    saveStocks(stocks)
  }, [stocks])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const newAnalyses: Record<string, StockAnalysis> = {}
      const newIndexAnalyses: Record<string, IndexAnalysis> = {}

      for (const stock of stocks) {
        try {
          const data = await fetchStockData(stock.code)
          newAnalyses[stock.code] = generateMockAnalysis(stock, data)
        } catch {
          const mockData = generateMockData(stock.code)
          newAnalyses[stock.code] = generateMockAnalysis(stock, mockData)
        }
      }

      for (const idx of indices) {
        try {
          const data = await fetchStockData(idx.code)
          const latest = data[data.length - 1]
          const score = 40 + Math.random() * 35
          newIndexAnalyses[idx.code] = {
            config: idx,
            priceData: data,
            latest,
            indicators: {},
            trendScore: {
              code: idx.code,
              total: Math.round(score),
              wave: 0,
              trendline: 0,
              adx: 0,
              macd: 0,
              maSlope: 0,
              priceMa: 0,
              label: getTrendLabel(score),
            },
          }
        } catch {
          const mockData = generateMockData(idx.code)
          const latest = mockData[mockData.length - 1]
          const score = 40 + Math.random() * 35
          newIndexAnalyses[idx.code] = {
            config: idx,
            priceData: mockData,
            latest,
            indicators: {},
            trendScore: {
              code: idx.code,
              total: Math.round(score),
              wave: 0,
              trendline: 0,
              adx: 0,
              macd: 0,
              maSlope: 0,
              priceMa: 0,
              label: getTrendLabel(score),
            } as TrendScore,
          }
        }
      }

      setAnalyses(newAnalyses)
      setIndexAnalyses(newIndexAnalyses)
      setLoading(false)
    }

    loadAll()
  }, [stocks, indices])

  const handleStocksChange = (newStocks: StockConfig[]) => {
    setStocks(newStocks)
    if (!newStocks.some((s) => s.code === activeStock)) {
      setActiveStock(newStocks[0]?.code ?? '')
    }
  }

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="newspaper-shadow bg-paper p-12 text-center">
          <div className="font-display text-2xl text-ink mb-2">LOADING</div>
          <div className="font-mono text-sm text-ink-light">正在加载市场数据与 Agent 分析结果...</div>
        </div>
      )
    }

    switch (activeTab) {
      case 'overview':
        return (
          <Overview
            stocks={stocks}
            indices={indices}
            analyses={analyses}
            indexAnalyses={indexAnalyses}
            onSelectStock={setActiveStock}
            onChangeTab={setActiveTab}
          />
        )
      case 'prediction':
        return <PredictionPanel analyses={analyses} />
      case 'history':
        return <HistoryPanel />
      case 'detail':
        return (
          <StockDetail
            stock={stocks.find((s) => s.code === activeStock) ?? stocks[0]}
            analysis={analyses[activeStock]}
          />
        )
      case 'backtest':
        return <BacktestPanel />
      case 'manage':
        return <StockManager stocks={stocks} indices={indices} onChangeStocks={handleStocksChange} />
      default:
        return null
    }
  }, [activeTab, loading, stocks, indices, analyses, indexAnalyses, activeStock])

  return (
    <Layout
      stocks={stocks}
      indices={indices}
      analyses={analyses}
      indexAnalyses={indexAnalyses}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      activeStock={activeStock}
      setActiveStock={setActiveStock}
    >
      {content}
    </Layout>
  )
}

export default App
