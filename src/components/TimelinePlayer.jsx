import React, { useState, useRef } from 'react'

export default function TimelinePlayer({ years = [], onFrame = ()=>{} }) {
  const [playing, setPlaying] = useState(false)
  const idxRef = useRef(0)
  const timerRef = useRef(null)

  function play(){
    if (playing) { setPlaying(false); clearInterval(timerRef.current); return }
    if (!years.length) return
    setPlaying(true)
    idxRef.current = 0
    onFrame(years[idxRef.current])
    timerRef.current = setInterval(()=>{
      idxRef.current = (idxRef.current + 1) % years.length
      onFrame(years[idxRef.current])
    }, 800)
  }

  return (
    <div className="p-3 bg-slate-800 rounded-lg text-sm">
      <h4 className="font-semibold">Timeline Player</h4>
      <div className="mt-2 flex gap-2">
        <button className="px-3 py-2 rounded bg-indigo-600" onClick={play}>{playing ? 'Stop' : 'Play'}</button>
        <button className="px-3 py-2 rounded bg-slate-700" onClick={()=> { idxRef.current = 0; onFrame(years[0]) }}>Reset</button>
      </div>
    </div>
  )
}
