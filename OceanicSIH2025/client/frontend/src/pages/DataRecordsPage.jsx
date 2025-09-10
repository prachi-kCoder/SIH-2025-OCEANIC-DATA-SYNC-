import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import EmptyStateIngest from '../components/common/EmptyStateIngest'

// Recharts
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  Brush,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#845EC2', '#D65DB1', '#FF6F91']
const col=['#F2613F','#D6BD98','#C8ACD6']
export default function DataRecordsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState([])
  const [speciesQuery, setSpeciesQuery] = useState('')
  const [showDataset, setShowDataset] = useState(false)

  // ----------------------------- FETCH DATA -----------------------------
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.getData()
        if (mounted) setRecords(data)
      } catch (e) {
        setError('Failed to load records')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // ----------------------------- FILTERED RECORDS -----------------------------
  const speciesFilteredRecords = useMemo(() => {
    if (!speciesQuery) return records
    const query = speciesQuery.toLowerCase()
    return records.filter(r => (
      r.species?.toLowerCase().includes(query) ||
      r.scientificName?.toLowerCase().includes(query) ||
      r.valid_name?.toLowerCase().includes(query)
    ))
  }, [records, speciesQuery])

  // ----------------------------- BAR & LINE CHART DATA -----------------------------
  const speciesData = useMemo(() => {
    const map = {}
    records.forEach(r => {
      if (r.species) map[r.species] = (map[r.species] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
  }, [records])

  // Line chart: Top species over time
  const lineChartData = useMemo(() => {
    if (!records.length) return []

    // Collect unique dates
    const dates = Array.from(new Set(records.map(r => r.timestamp && new Date(r.timestamp).toISOString().split('T')[0]).filter(Boolean)))
      .sort((a, b) => new Date(a) - new Date(b))

    // Collect top species names
    const topSpecies = speciesData.map(d => d.name)

    // Build data for each date
    return dates.map(date => {
      const item = { date }
      topSpecies.forEach(sp => {
        item[sp] = records.filter(r => {
          const ts = r.timestamp ? new Date(r.timestamp).toISOString().split('T')[0] : null
          return ts === date && r.species === sp
        }).length
      })
      return item
    })
  }, [records, speciesData])

  const speciesList = useMemo(() => speciesData.map(d => d.name), [speciesData])

  // ----------------------------- PIE CHART DATA -----------------------------
  const pieData = useMemo(() => {
    const map = {}
    records.forEach(r => {
      const key = r.source || 'Unknown'
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [records])

  return (
    <div className="container">

      {/* ------------------- CHARTS ------------------- */}
      <div className="grid grid-3" style={{ gap: 24, marginBottom: 32 }}>

        {/* Line Chart */}
        <div className="card" style={{ gridColumn: 'span 2',width:"90%" }}>
          <div className="card-body">
            <h2 className="card-title">Records Over Time (Top Species)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#000' }} angle={-45} textAnchor="end" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff8dc', borderRadius: 8, border: '1px solid #ccc' }}
                  formatter={(value) => [`VALUE: ${value}`, '']}
                />
                <Legend verticalAlign="top" align="center" wrapperStyle={{ fontSize: 12, paddingBottom: 10 }} />
                {speciesList.map((sp, index) => (
                  <Line
                    key={sp}
                    type="monotone"
                    dataKey={sp}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card" style={{width: "190%", marginLeft: "-25%"}}>
          <div className="card-body">
            <h2 className="card-title">Records Distribution by Source</h2>
            <ResponsiveContainer width="100%" height={300} style={{ marginLeft: "10px" }}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={col[index % col.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bar Chart: Top 10 species */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <h2 className="card-title">Top 10 Species</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={speciesData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#E2DFD0' }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#910A67" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ------------------- VIEW DATASET BUTTON ------------------- */}
      <div className="flex justify-center mb-4">
        <button
          className="btn bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-md shadow-md"
          onClick={() => setShowDataset(!showDataset)}
        >
          {showDataset ? 'Hide Dataset' : 'View Dataset'}
        </button>
      </div>

      {/* ------------------- DATASET TABLE ------------------- */}
      {showDataset && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div className="flex" style={{ gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <label htmlFor="speciesFilter" className="card-title" style={{ margin: 0, marginRight: 12, color: '#CFFFE2' }}>
                  Filter by Species
                </label>
                <input
                  id="speciesFilter"
                  type="text"
                  value={speciesQuery}
                  onChange={(e) => setSpeciesQuery(e.target.value)}
                  placeholder="e.g., Sardinella longiceps"
                  className="input bg-slate-900/40 text-slate-200 placeholder-slate-400 ring-1 ring-slate-700 focus:ring-2 focus:ring-emerald-500 rounded-md px-3 py-2"
                  style={{ minWidth: 260 }}
                />
                <button
                  className="btn bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setSpeciesQuery('')}
                  disabled={!speciesQuery}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Data Records</h2>
              {error && <div className="text-red-400 mb-2">{error}</div>}
              {loading ? (
                <div>Loading...</div>
              ) : (
                <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="text-left">Source</th>
                        <th className="text-left">Timestamp</th>
                        <th className="text-left">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(speciesQuery ? speciesFilteredRecords : records).length === 0 ? (
                        <tr>
                          <td colSpan={3}>
                            <EmptyStateIngest title="No records found" description="Use the ingestion panel below to import data." onAfterIngest={async () => setRecords(await api.getData())} />
                          </td>
                        </tr>
                      ) : (
                        (speciesQuery ? speciesFilteredRecords : records).slice(0, 200).map((r, i) => (
                          <tr key={i}>
                            <td className="align-top whitespace-nowrap">{r.source}</td>
                            <td className="align-top whitespace-nowrap">{r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}</td>
                            <td className="align-top">
                              {r.parameter ? (
                                <>
                                  <strong>{r.parameter}</strong>: {r.value} {r.unit || ''}
                                  <br />
                                  {r.station ? <>Station: {r.station}</> : null}
                                </>
                              ) : (
                                r.species || r.year || '—'
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}


