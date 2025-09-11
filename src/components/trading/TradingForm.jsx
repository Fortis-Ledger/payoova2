import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

const TradingForm = ({ pair, currentPrice, onOrderSubmit }) => {
  const [orderType, setOrderType] = useState('market')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState(currentPrice?.toString() || '')

  const handleSubmit = (side) => {
    const order = {
      pair,
      type: orderType,
      side,
      amount: parseFloat(amount),
      price: orderType === 'market' ? currentPrice : parseFloat(price),
      status: 'pending',
      timestamp: new Date().toISOString()
    }
    onOrderSubmit(order)
    setAmount('')
    if (orderType === 'limit') setPrice('')
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-lg">Place Order</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={orderType} onValueChange={setOrderType} className="mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="market" className="text-white">Market</TabsTrigger>
            <TabsTrigger value="limit" className="text-white">Limit</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <div>
            <Label className="text-white text-sm">Amount</Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          {orderType === 'limit' && (
            <div>
              <Label className="text-white text-sm">Price</Label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={currentPrice?.toString()}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={() => handleSubmit('buy')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={!amount}
            >
              Buy
            </Button>
            <Button 
              onClick={() => handleSubmit('sell')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={!amount}
            >
              Sell
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TradingForm
