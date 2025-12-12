import React from 'react'

export default function Controls({ years = [], regions = [], selectedRegion, setSelectedRegion, countries = [], selectedCountry, setSelectedCountry, minSpeedFilter, setMinSpeedFilter, yearFocus, setYearFocus }) {
  return (
    <div className="p-3 bg-slate-800 rounded-lg">
      <h4 className="font-semibold">Controls</h4>
      <div className="mt-2 text-sm space-y-2">
        <div>
          <label className="block text-xs">Region</label>
          <select className="w-full bg-slate-700 p-2 rounded" value={selectedRegion} onChange={e=>setSelectedRegion(e.target.value)}>
            {regions.map(r=> <option key={r} value={r}>{r}</option> )}
          </select>
        </div>
        <div>
          <label className="block text-xs">Quick country</label>
          <select className="w-full bg-slate-700 p-2 rounded" value={selectedCountry||''} onChange={e=>setSelectedCountry(e.target.value||null)}>
            <option value=''>— none —</option>
            {countries.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs">Min speed filter (Mbps)</label>
          <input type="number" className="w-full bg-slate-700 p-2 rounded" value={minSpeedFilter||''} onChange={e=>setMinSpeedFilter(e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div>
          <label className="block text-xs">Year focus</label>
          <select className="w-full bg-slate-700 p-2 rounded" value={yearFocus||''} onChange={e=>setYearFocus(e.target.value)}>
            {years.map(y=> <option key={y} value={y}>{y.replace('year ','')}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
