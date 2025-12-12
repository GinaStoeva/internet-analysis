import React, { useMemo } from 'react'

export default function CountryTable({ data = [], analysis = {}, onSelectCountry = ()=>{}, regionFilter = 'All', minSpeed = null }) {
  const rows = useMemo(() => {
    return data.filter(d => {
      if (regionFilter && regionFilter !== 'All' && d.region !== regionFilter) return false
      if (minSpeed != null) {
        const num = Number(d['year 2024'])
        if (Number.isNaN(num) || num < minSpeed) return false
      }
      return true
    }).map(d => ({ country: d.country, region: d.region, major_area: d.major_area, y2023: d['year 2023'], y2024: d['year 2024'] }))
  }, [data, regionFilter, minSpeed])

  return (
    <div className="p-4 rounded-2xl bg-slate-900">
      <h3 className="font-medium">Countries</h3>
      <div className="mt-2 text-xs max-h-96 overflow-auto">
        <table className="table-auto w-full text-left text-xs">
          <thead>
            <tr><th className="pr-2">Country</th><th>Region</th><th>2023</th><th>2024</th></tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className={i%2 ? 'bg-slate-800' : ''} style={{cursor:'pointer'}} onClick={()=>onSelectCountry(r.country)}>
                <td className="pr-2">{r.country}</td>
                <td>{r.region}</td>
                <td>{r.y2023}</td>
                <td>{r.y2024}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
