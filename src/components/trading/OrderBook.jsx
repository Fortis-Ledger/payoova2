import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const OrderBook = ({ pair }) => {
  // Mock order book data
  const generateOrderBookData = () => {
    const basePrice = 2456.78
    const bids = []
    const asks = []
    
    for (let i = 0; i < 10; i++) {
      bids.push({
        price: basePrice - (i + 1) * 5,
        amount: Math.random() * 10,
        total: 0
      })
      
      asks.push({
        price: basePrice + (i + 1) * 5,
        amount: Math.random() * 10,
        total: 0
      })
    }
    
    return { bids: bids.reverse(), asks }
  }

  const { bids, asks } = generateOrderBookData()

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-lg">Order Book</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-xs">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 p-3 border-b border-white/10 text-gray-400 font-medium">
            <div>Price</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Total</div>
          </div>

          {/* Asks (Sell orders) */}
          <div className="space-y-1 p-3 border-b border-white/10">
            {asks.slice(0, 5).reverse().map((ask, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 text-red-400 hover:bg-red-500/10 p-1 rounded">
                <div>${ask.price.toFixed(2)}</div>
                <div className="text-right">{ask.amount.toFixed(4)}</div>
                <div className="text-right">{(ask.price * ask.amount).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Current Price */}
          <div className="p-3 text-center border-b border-white/10">
            <div className="text-white font-bold">${bids[0]?.price.toFixed(2) || '2456.78'}</div>
            <div className="text-green-400 text-xs">Last Price</div>
          </div>

          {/* Bids (Buy orders) */}
          <div className="space-y-1 p-3">
            {bids.slice(0, 5).map((bid, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 text-green-400 hover:bg-green-500/10 p-1 rounded">
                <div>${bid.price.toFixed(2)}</div>
                <div className="text-right">{bid.amount.toFixed(4)}</div>
                <div className="text-right">{(bid.price * bid.amount).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderBook
