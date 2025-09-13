import React, { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, CandlestickChart } from 'recharts'
import { Button } from '@/components/ui/button'

const TradingChart = ({ pair }) => {
  const [timeframe, setTimeframe] = useState('1H')
  const [chartType, setChartType] = useState('line')
  
  // Real price data state
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real price data
  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with actual API call to fetch price data
        // const response = await fetch(`/api/trading/chart/${pair}?timeframe=${timeframe}`);
        // const data = await response.json();
        
        // For now, set empty data until real API is implemented
        setPriceData([]);
      } catch (err) {
        console.error('Error fetching price data:', err);
        setError('Failed to load price data');
        setPriceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [pair, timeframe]);

  // Chart data is now managed by priceData state

  // Chart data is now fetched via the fetchPriceData useEffect above

  const timeframes = ['5M', '15M', '1H', '4H', '1D', '1W']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-xs mb-1">
            {new Date(label).toLocaleString()}
          </p>
          <p className="text-white font-medium">
            Price: ${payload[0].value?.toFixed(2)}
          </p>
          {data.volume && (
            <p className="text-gray-400 text-xs">
              Volume: ${(data.volume / 1000000).toFixed(2)}M
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-96 w-full">
      {/* Chart Controls */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex space-x-1">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              variant={timeframe === tf ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe(tf)}
              className={`text-xs ${
                timeframe === tf 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tf}
            </Button>
          ))}
        </div>

        <div className="flex space-x-1">
          <Button
            variant={chartType === 'line' ? "default" : "ghost"}
            size="sm"
            onClick={() => setChartType('line')}
            className={`text-xs ${
              chartType === 'line' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Line
          </Button>
          <Button
            variant={chartType === 'area' ? "default" : "ghost"}
            size="sm"
            onClick={() => setChartType('area')}
            className={`text-xs ${
              chartType === 'area' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Area
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              />
              <YAxis 
                domain={['dataMin - 50', 'dataMax + 50']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3B82F6' }}
              />
            </LineChart>
          ) : (
            <AreaChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                tickFormatter={(value) => new Date(value).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              />
              <YAxis 
                domain={['dataMin - 50', 'dataMax + 50']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#3B82F6" 
                strokeWidth={2}
                fill="url(#priceGradient)"
                fillOpacity={1}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TradingChart
