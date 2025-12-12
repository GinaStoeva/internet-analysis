import React, { useEffect, useRef } from 'react'
import Globe from 'react-globe.gl'

export default function GlobeViewer({ points = [], onCountryClick = ()=>{}, highlightCountry = null, yearFocus }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    // gentle auto-rotate
    try {
      ref.current.controls().autoRotate = true
      ref.current.controls().autoRotateSpeed = 0.25
    } catch(e){}
  }, [])

  // prepare data for globe
  const pointsData = points.map(p => ({
    lat: p.lat,
    lng: p.lng,
    size: Math.max(1, Math.log10((p.value||1)+1) * 2),
    country: p.country,
    value: p.value
  }))

  return (
    <div className="w-full h-96 rounded-2xl shadow-xl overflow-hidden">
      <Globe
        ref={ref}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        pointsData={pointsData}
        pointAltitude={d => 0.01 + (d.size * 0.01)}
        pointRadius={d => Math.max(0.2, d.size * 0.25)}
        pointColor={d => highlightCountry === d.country ? 'orange' : (d.value > 100 ? 'hotpink' : (d.value > 30 ? 'cyan' : 'lightgreen'))}
        onPointClick={p => onCountryClick(p.country)}
        tooltipText={d => `<b>${d.country}</b><br/>${d.value !== undefined ? d.value + ' Mbps' : 'N/A'}`}
        width={800}
        height={600}
      />
    </div>
  )
}
