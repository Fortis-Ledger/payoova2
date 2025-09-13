import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpDown,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react'
import TradingChart from './TradingChart'
import OrderBook from './OrderBook'
import TradingForm from './TradingForm'
import PortfolioChart from './PortfolioChart'

const TradingDashboard = () => {
  const [selectedPair, setSelectedPair] = useState('ETH/USDT')
  const [marketData, setMarketData] = useState({
    price: 2456.78,
    change24h: 5.2,
    volume24h: 145000000,
    high24h: 2498.45,
    low24h: 2345.67
  })

  const tradingPairs = [
    { symbol: 'ETH/USDT', price: 2456.78, change: 5.2, volume: '145M' },
    { symbol: 'BTC/USDT', price: 43250.12, change: -2.1, volume: '890M' },
    { symbol: 'MATIC/USDT', price: 1.12, change: 8.4, volume: '67M' },
    { symbol: 'BNB/USDT', price: 345.67, change: 3.7, volume: '234M' }
  ]

  const [orders, setOrders] = useState([
    {
      id: 1,
      pair: 'ETH/USDT',
      type: 'limit',
      side: 'buy',
      amount: 0.5,
      price: 2400,
      status: 'pending',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      pair: 'BTC/USDT',
      type: 'market',
      side: 'sell',
      amount: 0.01,
      price: 43000,
      status: 'filled',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const formatPercent = (percent) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Trading Dashboard</h1>
            <p className="text-gray-400">Advanced cryptocurrency trading platform</p>
          </div>
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
            Live Market Data
          </Badge>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {tradingPairs.map((pair) => (
            <Card 
              key={pair.symbol}
              className={`bg-white/5 border-white/10 backdrop-blur-sm cursor-pointer transition-all hover:bg-white/10 ${
                selectedPair === pair.symbol ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedPair(pair.symbol)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-white font-semibold">{pair.symbol}</span>
                  <Badge variant={pair.change >= 0 ? 'success' : 'destructive'} className="text-xs">
                    {formatPercent(pair.change)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-white">{formatPrice(pair.price)}</div>
                  <div className="text-sm text-gray-400">Vol: {pair.volume}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Trading Chart */}
          <div className="lg:col-span-3">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">{selectedPair} Chart</CardTitle>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-green-400">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      High: {formatPrice(marketData.high24h)}
                    </div>
                    <div className="text-red-400">
                      <TrendingDown className="w-4 h-4 inline mr-1" />
                      Low: {formatPrice(marketData.low24h)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <TradingChart pair={selectedPair} />
              </CardContent>
            </Card>
          </div>

          {/* Trading Form & Order Book */}
          <div className="space-y-6">
            <TradingForm 
              pair={selectedPair}
              currentPrice={marketData.price}
              onOrderSubmit={(order) => {
                setOrders(prev => [...prev, { ...order, id: Date.now() }])
              }}
            />
            <OrderBook pair={selectedPair} />
          </div>
        </div>

        {/* Portfolio & Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Performance */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Portfolio Performance</CardTitle>
              <CardDescription className="text-gray-400">
                24h portfolio changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioChart />
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Active Orders</CardTitle>
              <CardDescription className="text-gray-400">
                Your open and recent orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="open" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger value="open" className="text-white">Open Orders</TabsTrigger>
                  <TabsTrigger value="history" className="text-white">Order History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="open" className="space-y-3">
                  {orders.filter(order => order.status === 'pending').map((order) => (
                    <div key={order.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={order.side === 'buy' ? 'success' : 'destructive'} className="text-xs">
                              {order.side.toUpperCase()}
                            </Badge>
                            <span className="text-white font-medium">{order.pair}</span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {order.type} • {order.amount} @ {formatPrice(order.price)}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="history" className="space-y-3">
                  {orders.filter(order => order.status !== 'pending').map((order) => (
                    <div key={order.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={order.side === 'buy' ? 'success' : 'destructive'} className="text-xs">
                              {order.side.toUpperCase()}
                            </Badge>
                            <span className="text-white font-medium">{order.pair}</span>
                            <Badge variant="outline" className="text-xs">
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {order.amount} @ {formatPrice(order.price)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(order.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TradingDashboard
