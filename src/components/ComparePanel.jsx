import React from 'react'

export default function ComparePanel({ countries = [], compare = [], setCompare = ()=>{}, data = [], analysis = {} }) {
  function toggle(c){
    if (compare.includes(c)) setCompare(compare.filter(x=>x!==c))
    else setCompare(prev => (prev.length >= 4 ? prev.slice(1).concat(c) : prev.concat(c)))
  }

  return (
    <div className="p-3 bg-slate-800 rounded-lg text-sm">
      <h4 className="font-semibold">Compare Countries</h4>
      <div className="mt-2 grid grid-cols-2 gap-2 max-h-40 overflow-auto">
        {countries.slice(0,200).map(c=>(
          <button key={c} className={`text-xs p-1 rounded ${compare.includes(c)? 'bg-indigo-600':'bg-slate-700'}`} onClick={()=>toggle(c)}>{c}</button>
        ))}
      </div>
      <div className="mt-2 text-xs">Select up to 4 countries to compare. Clicking a country on the globe adds it here.</div>
    </div>
  )
}
