// analyze(parsedData) -> returns object used by UI
export default async function analyze(data) {
  if (!data || !data.length) return {}

  const years = Object.keys(data[0]).filter(k => k.startsWith('year')).sort()
  const toNum = v => (v === null || v === undefined || v === '' || String(v).toLowerCase() === 'null') ? NaN : Number(v)

  // build country records
  const countries = data.map(row => {
    const vals = {}
    years.forEach(y => vals[y] = toNum(row[y]))
    const latestYear = [...years].reverse().find(y => !Number.isNaN(vals[y]))
    const latest = latestYear ? vals[latestYear] : NaN
    const firstYear = years.find(y => !Number.isNaN(vals[y]))
    const first = firstYear ? vals[firstYear] : NaN
    const growthPct = (!Number.isNaN(first) && !Number.isNaN(latest) && first !== 0) ? ((latest - first) / Math.abs(first)) * 100 : null
    return {
      country: row.country,
      major_area: row.major_area,
      region: row.region,
      values: vals,
      latestYear,
      latest: Number.isNaN(latest) ? null : latest,
      firstYear: firstYear || null,
      first: Number.isNaN(first) ? null : first,
      growthPct
    }
  })

  // per-year stats
  const yearStats = {}
  years.forEach(y => {
    const vals = countries.map(c => c.values[y]).filter(v => !Number.isNaN(v))
    const n = vals.length
    const sum = vals.reduce((s,x)=>s+x,0)
    const mean = n ? sum/n : null
    yearStats[y] = { n, sum, mean, min: n? Math.min(...vals):null, max: n? Math.max(...vals):null }
  })

  // top countries by latest and improvement
  const topCountries = [...countries].filter(c=>c.latest!=null).sort((a,b)=>b.latest-a.latest).slice(0,50)
  const improvement = [...countries].map(c => ({ country: c.country, inc: ( (c.values['year 2024']||0) - (c.values['year 2023']||0) ) })).sort((a,b)=>b.inc-a.inc).slice(0,50)

  // region sums per year
  const regionSums = {}
  countries.forEach(c => {
    const r = c.region || c.major_area || 'Unknown'
    regionSums[r] = regionSums[r] || {}
    years.forEach(y => { regionSums[r][y] = (regionSums[r][y]||0) + (Number.isNaN(c.values[y])?0:c.values[y]) })
  })

  const globalSeries = years.map(y => ({ year: y, value: Object.values(regionSums).reduce((s,rs)=>s + (rs[y]||0),0) }))

  // prepare coordinate points (stable hash -> lat/lng)
  function hashToLatLng(str){
    let h = 2166136261
    for(let i=0;i<str.length;i++){ h = Math.imul(h ^ str.charCodeAt(i), 16777619) }
    const lat = ((h % 180) + 180) - 90
    const lng = (((Math.floor(h/7)) % 360) + 360) - 180
    return [lat, lng]
  }
  const points = countries.filter(c=>c.latest!=null).map(c => {
    const [lat,lng] = hashToLatLng(c.country)
    return { country: c.country, lat, lng, value: c.latest }
  })

  return {
    years,
    yearStats,
    topCountries: topCountries.map(c=>({ country: c.country, latest: c.latest, latestYear: c.latestYear, growthPct: c.growthPct })),
    improvement,
    regionSums,
    globalSeries,
    points,
    countries: countries.map(c => ({ country: c.country, region: c.region, major_area: c.major_area, values: c.values }))
  }
}
