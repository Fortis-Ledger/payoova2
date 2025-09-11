import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const PortfolioChart = () => {
  const data = [
    { name: 'ETH', value: 45.2, color: '#3B82F6' },
    { name: 'BTC', value: 32.1, color: '#F59E0B' },
    { name: 'MATIC', value: 12.8, color: '#8B5CF6' },
    { name: 'BNB', value: 9.9, color: '#F59E0B' }
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.payload.name}</p>
          <p className="text-gray-300">{data.value}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center space-x-4 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center space-x-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-white text-sm">{item.name}</span>
            <span className="text-gray-400 text-sm">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PortfolioChart
