import React from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts"

export default function ObisLineChart({ records }) {
  if (!records || records.length === 0) return null

  // Group data by depth ranges (100m intervals)
  const depthData = records.reduce((acc, r) => {
    const depthVal = typeof r.depth === "number" ? r.depth : Number(r.depth)
    if (!Number.isFinite(depthVal)) return acc
    const bucket = Math.floor(depthVal / 100) * 100
    acc[bucket] = (acc[bucket] || 0) + 1
    return acc
  }, {})

  // Convert to array for Recharts
  const chartData = Object.entries(depthData)
    .sort((a, b) => Number(a[0]) - Number(b[0])) // sort by depth
    .map(([depth, count]) => ({
      depth: `${depth}-${Number(depth) + 99}m`,
      count
    }))

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="depth" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip
          contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
          labelStyle={{ color: "#22d3ee" }}
        />
        <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
