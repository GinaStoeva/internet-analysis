import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts'

export default function ChartsPanel({ analysis = {}, selectedRegion, selectedCountry, compareCountries = [], yearFocus, onCountryClick = ()=>{} }) {
  const { globalSeries = [], topCountries = [], regionSums = {}, improvement = [] } = analysis
  const year = yearFocus || (globalSeries[globalSeries.length-1] && globalSeries[globalSeries.length-1].year)

  const regionData = Object.keys(regionSums || {}).map(r => ({ region: r, value: (regionSums[r][year] || 0) })).sort((a,b)=>b.value-a.value).slice(0,20)
  const topBars = topCountries.slice(0,20)

  const palette = ['#8884d8','#82ca9d','#ffc658','#ff7f50','#a4de6c','#d0ed57','#8dd1e1']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 shadow">
          <h3 className="font-semibold">Global Total Over Time</h3>
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={globalSeries}>
                <XAxis dataKey="year" tickFormatter={y=>y.replace('year ','')} />
                <YAxis />
                <Tooltip formatter={(v)=>typeof v === 'number' ? v.toFixed(2) : v} />
                <Line dataKey="value" stroke="#82ca9d" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 shadow">
          <h3 className="font-semibold">Regional Breakdown ({year ? year.replace('year ','') : '—'})</h3>
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="region" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value">
                  {regionData.map((entry, index) => <Cell key={`cell-${index}`} fill={palette[index%palette.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 shadow">
          <h3 className="font-semibold">Top Countries (latest)</h3>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topBars} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="country" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="latest" fill={palette[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 shadow">
          <h3 className="font-semibold">Improvement Leaderboard (2023→2024)</h3>
          <div className="mt-3 text-xs max-h-48 overflow-auto">
            <ol className="list-decimal list-inside">
              {improvement.slice(0,12).map((r,i) => <li key={r.country}>{r.country}: {r.inc} Mbps</li>)}
            </ol>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 shadow">
          <h3 className="font-semibold">Compare: {compareCountries.join(', ') || '—'}</h3>
          <div className="mt-3 text-xs">Click countries on globe to add to comparison. (Overlayed multi-line chart will appear here when >0 selected.)</div>
        </div>
      </div>
    </div>
  )
}
