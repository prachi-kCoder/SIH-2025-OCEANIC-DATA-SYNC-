import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import ObisTable from '../components/Dashboard/ObisTable'
import ObisDepthChart from '../components/Charts/ObisDepthChart'
import EmptyStateIngest from '../components/common/EmptyStateIngest'

// Recharts imports
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function ObisRecordsPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [obisQuery, setObisQuery] = useState('')
  const [obisDepthMin, setObisDepthMin] = useState('')
  const [obisDepthMax, setObisDepthMax] = useState('')
  const [obisDateFrom, setObisDateFrom] = useState('')
  const [obisDateTo, setObisDateTo] = useState('')
  const [showDataset, setShowDataset] = useState(false)
  const [speciesQuery, setSpeciesQuery] = useState('') // For dataset filter

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.getData()
        if (mounted) setRecords(data)
      } catch (e) {
        setError('Failed to load OBIS data')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const obisRecords = useMemo(
    () => records.filter(r => r.source?.toLowerCase().startsWith('obis')),
    [records]
  )

  const filteredObisRecords = useMemo(() => {
    const query = (obisQuery || '').toLowerCase()
    const minD = obisDepthMin === '' ? -Infinity : Number(obisDepthMin)
    const maxD = obisDepthMax === '' ? Infinity : Number(obisDepthMax)
    const from = obisDateFrom ? new Date(obisDateFrom) : null
    const to = obisDateTo ? new Date(obisDateTo) : null
    return obisRecords.filter(r => {
      const nameMatch = !query || (r.species || '').toLowerCase().includes(query)
      const depthVal = typeof r.depth === 'number'
        ? r.depth
        : Number.isFinite(Number(r.depth)) ? Number(r.depth) : null
      const depthMatch = depthVal === null ? true : (depthVal >= minD && depthVal <= maxD)
      const dateVal = r.eventDate ? new Date(r.eventDate) : null
      const dateMatch = (!from || (dateVal && dateVal >= from)) && (!to || (dateVal && dateVal <= to))
      return nameMatch && depthMatch && dateMatch
    })
  }, [obisRecords, obisQuery, obisDepthMin, obisDepthMax, obisDateFrom, obisDateTo])

  // Species filter for dataset table
  const datasetFilteredRecords = useMemo(() => {
    if (!speciesQuery) return filteredObisRecords
    const query = speciesQuery.toLowerCase()
    return filteredObisRecords.filter(r => (r.species || '').toLowerCase().includes(query))
  }, [filteredObisRecords, speciesQuery])

  // 📊 Prepare Yearly Records Data for BarChart
  const yearlyData = useMemo(() => {
    const counts = {}
    filteredObisRecords.forEach(r => {
      if (r.eventDate) {
        const year = new Date(r.eventDate).getFullYear()
        counts[year] = (counts[year] || 0) + 1
      }
    })
    return Object.entries(counts).map(([year, count]) => ({
      year,
      count,
    }))
  }, [filteredObisRecords])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-slate-900/70 to-slate-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 p-8">
        <h2 className="text-3xl font-bold text-emerald-400 mb-10 text-center">
          🌊 OBIS Oceanic Records
        </h2>

        {error && (
          <div className="text-red-400 mb-4 bg-red-500/10 border border-red-400/30 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Chart Section */}
        {filteredObisRecords.length > 0 && (
          <>
            {/* Depth Chart */}
            <div className="bg-slate-800/60 rounded-xl p-6 shadow-inner mb-10">
              <ObisDepthChart records={filteredObisRecords} />
            </div>

            {/* New Bar Chart Section */}
            <div className="bg-slate-800/60 rounded-xl p-6 shadow-inner mb-10">
              <h3 className="text-xl font-semibold text-slate-200 mb-4 text-center">
                 Records Distribution by Year
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#CA7842" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <div className="flex justify-center mb-4">
          <button
            className="btn bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-9 rounded-md shadow-md"
            onClick={() => setShowDataset(!showDataset)}
          >
            {showDataset ? 'Hide Dataset' : 'View Dataset'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5 mb-6">
          {/* ... same filter inputs for species, depth, date ... */}
        </div>

        {/* Dataset Table */}
        {showDataset && (
          <div className="bg-slate-800/50 rounded-xl p-6 shadow-lg">
            {/* Filter Box */}
            <div className="bg-slate-900/60 rounded-xl p-4 mb-4 shadow-inner flex flex-wrap items-center gap-4">
              <label className="text-slate-200 font-semibold mb-1 md:mb-0">
                Filter by Species
              </label>
              <input
                type="text"
                value={speciesQuery}
                onChange={(e) => setSpeciesQuery(e.target.value)}
                placeholder="e.g., Sardinella longiceps"
                className="bg-white/5 text-slate-200 placeholder-slate-400 border border-slate-600 rounded-2xl px-4 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-300"
                style={{ minWidth: 250 }}
              />
              <button
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md shadow-sm"
                onClick={() => setSpeciesQuery('')}
                disabled={!speciesQuery}
              >
                Clear
              </button>
            </div>

            {/* Table */}
            {datasetFilteredRecords.length === 0 ? (
              <EmptyStateIngest
                title="No OBIS records found"
                description="Use the ingestion panel to import OBIS data."
                onAfterIngest={async () => setRecords(await api.getData())}
              />
            ) : (
              <ObisTable records={datasetFilteredRecords} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}




