// script.js — advanced globe + charts + interactions

// libs assumed loaded in HTML: Chart.js, Three.js, Globe.gl, html2canvas, jspdf
// AOS optional

// ---------- sample CSV ----------
const sampleCSV = `country,major_area,region,year2017,year2018,year2019,year2020,year2021,year2022,year2023,year2024
Afghanistan,Asia,Southern Asia,null,null,6.49,8.2,9.23,1.9,2.84,3.63
Albania,Europe,Southern Europe,11.48,14.71,28.61,37.11,41.47,33.67,46.47,62.71
Algeria,Africa,Northern Africa,3.98,3.52,4.06,3.92,9.95,10.84,11.3,14.26
Australia,Oceania,Australia and New Zealand,45.1,52.3,63.1,71.2,75.3,80.4,90.1,105.7
Brazil,Americas,South America,12.2,15.8,21.3,25.9,28.1,30.2,32.5,55.1
Canada,Americas,Northern America,30.1,40.5,50.2,62.3,70.1,72.0,75.9,88.0
China,Asia,Eastern Asia,70.2,75.1,80.5,85.7,90.2,92.5,95.3,120.4
Egypt,Africa,Northern Africa,7.5,8.2,9.1,10.0,11.5,12.2,13.4,14.6`;

// ---------- country lat/lng mapping (expandable) ----------
const countryCoords = {
  'afghanistan': {lat:33.93911,lng:67.709953},
  'albania': {lat:41.153332,lng:20.168331},
  'algeria': {lat:28.033886,lng:1.659626},
  'australia': {lat:-25.274398,lng:133.775136},
  'brazil': {lat:-14.235004,lng:-51.92528},
  'canada': {lat:56.130366,lng:-106.346771},
  'china': {lat:35.86166,lng:104.195397},
  'egypt': {lat:26.820553,lng:30.802498}
  // add more as needed for better globe placement
};

// ---------- CSV parsing ----------
function csvToRows(text){ return text.trim().split('\n').map(line=>line.split(',')); }
function parseRows(rows){
  const data=[];
  for(let i=1;i<rows.length;i++){
    const p = rows[i].map(s=>s.trim());
    if(p.length<11) continue;
    const country=p[0], majorArea=p[1], region=p[2];
    const s23 = (p[9]===''||p[9].toLowerCase()==='null')?0:parseFloat(p[9]);
    const s24 = (p[10]===''||p[10].toLowerCase()==='null')?0:parseFloat(p[10]);
    const key = country.toLowerCase();
    const coords = countryCoords[key] || {lat: (Math.random()*140)-70, lng: (Math.random()*360)-180};
    data.push({
      country,
      countryKey: key,
      majorArea,
      region,
      speed2023: s23,
      speed2024: s24,
      lat: coords.lat,
      lng: coords.lng,
      selected: false // selection state for visuals
    });
  }
  return data;
}

// ---------- state ----------
let records = [];
let selectedSet = new Set();
let globe = null;
let countryChart = null;
let topChart = null;

// ---------- DOM ----------
const csvFile = document.getElementById('csvFile');
const uploadBtn = document.getElementById('uploadBtn');
const useSample = document.getElementById('useSample');
const runQuery = document.getElementById('runQuery');
const clearSelectionBtn = document.getElementById('clearSelection');
const yearSelect = document.getElementById('yearSelect');
const countryInput = document.getElementById('countryInput');
const continentSelect = document.getElementById('continentSelect');
const kpiAvg = document.getElementById('kpiAvg');
const kpiGrowth = document.getElementById('kpiGrowth');
const kpiImpact = document.getElementById('kpiImpact');
const selectedList = document.getElementById('selectedList');
const countryDetails = document.getElementById('countryDetails');
const outliersDiv = document.getElementById('outliers');

// ---------- file handling ----------
uploadBtn.addEventListener('click', ()=> csvFile.click());
csvFile.addEventListener('change', e=>{
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=> { const rows = csvToRows(reader.result); records = parseRows(rows); onDataLoaded(); };
  reader.readAsText(f);
});
useSample.addEventListener('click', ()=>{ records = parseRows(csvToRows(sampleCSV)); onDataLoaded(); });

// ---------- utility color & scale ----------
function colorForSpeed(v){
  if(v>150) return '#06b6d4';
  if(v>80) return '#60a5fa';
  if(v>30) return '#7dd3fc';
  if(v>0) return '#facc15';
  return '#94a3b8';
}

// ---------- charts ----------
function drawBarChart(elId, labels, values, opts={}){
  const ctx = (typeof elId === 'string') ? document.getElementById(elId) : elId;
  if(ctx.chart) ctx.chart.destroy();
  ctx.chart = new Chart(ctx,{
    type: opts.type || 'bar',
    data: { labels, datasets: [{ label: opts.label || 'Mbps', data: values, backgroundColor: opts.background || 'rgba(96,165,250,0.9)', borderRadius:6 }] },
    options: { responsive:true, plugins:{ legend:{display:false}, tooltip:{callbacks:{ label: ctx => ctx.formattedValue + ' Mbps' } } }, scales:{ y:{ beginAtZero:true } } }
  });
}

// ---------- KPIs ----------
function computeKPIs(){
  if(!records || records.length===0) return;
  const avg24 = records.reduce((s,r)=>s + r.speed2024, 0) / records.length;
  const improved = records.filter(r => (r.speed2024 - r.speed2023) > 0).length;
  const meanGrowth = records.reduce((a,b)=>a + (b.speed2024 - b.speed2023), 0)/records.length;
  const impactScore = Math.max(0, (meanGrowth / (avg24 || 1)) * 100);
  kpiAvg.innerText = avg24.toFixed(2);
  kpiGrowth.innerText = improved;
  kpiImpact.innerText = impactScore.toFixed(1);
}

// ---------- selection helpers ----------
function updateSelectedListUI(){
  if(selectedSet.size===0){
    selectedList.innerText = 'None';
    return;
  }
  selectedList.innerHTML = Array.from(selectedSet).map((c, i)=>`${i+1}. ${c}`).join('<br>');
}
function updateCountryInputFromSelection(){
  countryInput.value = Array.from(selectedSet).join(', ');
}
function clearSelection(){
  selectedSet.clear();
  records.forEach(r=> r.selected = false);
  updateSelectedListUI();
  updateCountryInputFromSelection();
  refreshGlobePoints(); // update visuals
  drawCountryComparison(); // clear chart
}
clearSelectionBtn.addEventListener('click', ()=> clearSelection());

// ---------- draw selected countries chart ----------
function drawCountryComparison(){
  const year = yearSelect.value;
  const selected = Array.from(selectedSet);
  if(selected.length===0){
    // clear chart
    const ctx = document.getElementById('countryChart');
    if(ctx.chart) ctx.chart.destroy();
    return;
  }
  const filtered = records.filter(r => selected.includes(r.country));
  const labels = filtered.map(r => r.country);
  const values = filtered.map(r => (year==='2023'? r.speed2023 : year==='2024'? r.speed2024 : (r.speed2023 + r.speed2024)/2));
  drawBarChart('countryChart', labels, values, { label: `Selected (${year})`, background: filtered.map(r=>colorForSpeed(r.speed2024)) });
}

// ---------- top countries chart ----------
function drawTopCountries(){
  const sorted = records.slice().sort((a,b)=> b.speed2024 - a.speed2024).slice(0,8);
  const labels = sorted.map(r => r.country);
  const values = sorted.map(r => r.speed2024);
  drawBarChart('topChart', labels, values);
  // outliers (high & low)
  const vals = records.map(r=>r.speed2024);
  const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
  const std = Math.sqrt(vals.reduce((a,b)=>a+Math.pow(b-mean,2),0)/vals.length);
  const highs = records.filter(r=> r.speed2024 > mean + 2*std).map(r=>r.country);
  const lows = records.filter(r=> r.speed2024 < mean - 2*std).map(r=>r.country);
  outliersDiv.innerHTML = `<div>Mean: ${mean.toFixed(2)} Mbps &nbsp; Std: ${std.toFixed(2)} Mbps</div><div style="margin-top:6px"><strong>High outliers:</strong> ${highs.join(', ') || 'None'}</div><div><strong>Low outliers:</strong> ${lows.join(', ') || 'None'}</div>`;
}

// ---------- Globe: create and refresh points ----------
function createGlobe(){
  // remove previous globe if exists
  const globeContainer = document.getElementById('globeViz');
  globeContainer.innerHTML = ''; // clear
  globe = Globe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .pointsData(records)
    .pointLat(d => d.lat)
    .pointLng(d => d.lng)
    .pointAltitude(d => (d.selected? d.speed2024/100 : d.speed2024/200)) // selected points stand taller
    .pointColor(d => d.selected ? '#f97316' : colorForSpeed(d.speed2024))
    .pointsMerge(true)
    .pointsTransitionDuration(600)
    .pointLabel(d => `<strong>${d.country}</strong><br/>${d.majorArea} • ${d.region}<br/>2023: ${d.speed2023} Mbps<br/>2024: ${d.speed2024} Mbps`)
    .onPointHover(d => {
      // show details in side panel on hover
      if(d) {
        countryDetails.innerHTML = `<strong>${d.country}</strong><div class="small">Region: ${d.region} • Continent: ${d.majorArea}</div><div style="margin-top:6px">2023: <strong>${d.speed2023} Mbps</strong><br/>2024: <strong>${d.speed2024} Mbps</strong><br/>Change: <strong>${(d.speed2024 - d.speed2023).toFixed(2)} Mbps</strong></div>`;
      } else {
        // clear if not hovering
        // keep last clicked details (do nothing)
      }
    })
    .onPointClick(d => {
      // toggle selection
      if(!d) return;
      if(selectedSet.has(d.country)){
        selectedSet.delete(d.country);
        d.selected = false;
      } else {
        selectedSet.add(d.country);
        d.selected = true;
      }
      updateSelectedListUI();
      updateCountryInputFromSelection();
      drawCountryComparison();
      refreshGlobePoints(); // animate changes
    })
    .width(globeContainer.clientWidth)
    .height(globeContainer.clientHeight)
    .backgroundColor('#071427')
    .showAtmosphere(true)
    .atmosphereColor('#3b82f6');

  globeContainer.appendChild(globe.renderer().domElement);
  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.25;
}

// update globe points (rebind pointsData to trigger transition)
function refreshGlobePoints(){
  if(!globe) return;
  globe.pointsTransitionDuration(600);
  globe.pointsData(records);
}

// ---------- continent filtering ----------
continentSelect.addEventListener('change', ()=>{
  const sel = continentSelect.value;
  if(sel === 'all'){
    // show all
    records.forEach(r=> r._visible = true);
  } else {
    records.forEach(r=> r._visible = (r.majorArea && r.majorArea.toLowerCase().includes(sel.toLowerCase())));
  }
  // reflect on globe by filtering pointsData
  globe.pointsData(records.filter(r=> r._visible));
});

// ---------- runQuery (supports typed countries too) ----------
runQuery.addEventListener('click', ()=>{
  const text = countryInput.value.trim();
  if(!text){
    alert('Type or select countries first (you can also click the globe).');
    return;
  }
  const arr = text.split(',').map(s=>s.trim()).filter(Boolean);
  // make selection set consistent
  selectedSet.clear();
  records.forEach(r=> r.selected = false);
  arr.forEach(name => {
    const rec = records.find(rr => rr.country.toLowerCase() === name.toLowerCase());
    if(rec){
      selectedSet.add(rec.country);
      rec.selected = true;
    }
  });
  updateSelectedListUI();
  drawCountryComparison();
  refreshGlobePoints();
});

// ---------- clear selection handled earlier ----------

// ---------- export PDF ----------
document.getElementById('exportReport').addEventListener('click', async ()=>{
  const node = document.querySelector('main.container');
  const canvas = await html2canvas(node, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p','mm','a4');
  const w = pdf.internal.pageSize.getWidth() - 20;
  const imgProps = pdf.getImageProperties(imgData);
  const h = imgProps.height * (w / imgProps.width);
  pdf.addImage(imgData, 'PNG', 10, 10, w, h);
  pdf.save('Internet-Speeds-Report.pdf');
});

// ---------- initial load & helpers ----------
function drawTopAndKPIs(){
  drawTopCountries();
  computeKPIs();
}

function drawTopCountries(){
  if(!records || records.length===0) return;
  const sorted = records.slice().sort((a,b)=> b.speed2024 - a.speed2024).slice(0,8);
  const labels = sorted.map(r=> r.country);
  const values = sorted.map(r=> r.speed2024);
  drawBarChart('topChart', labels, values);
  // outliers
  const vals = records.map(r=> r.speed2024);
  const mean = vals.reduce((a,b)=>a+b,0)/vals.length;
  const std = Math.sqrt(vals.reduce((a,b)=>a+Math.pow(b-mean,2),0)/vals.length);
  const highs = records.filter(r => r.speed2024 > mean + 2*std).map(r => r.country);
  const lows = records.filter(r => r.speed2024 < mean - 2*std).map(r => r.country);
  outliersDiv.innerHTML = `<div>Mean: ${mean.toFixed(2)} Mbps • Std: ${std.toFixed(2)}</div><div style="margin-top:8px"><strong>High:</strong> ${highs.join(', ') || 'None'}</div><div><strong>Low:</strong> ${lows.join(', ') || 'None'}</div>`;
}

function onDataLoaded(){
  // ensure _visible default true
  records.forEach(r=> r._visible = true);
  // build globe & charts
  if(!globe){
    createGlobe(); // defined below in case of scoping; else call createGlobe alias
  }
  refreshGlobePoints();
  drawTopAndKPIs();
}

// createGlobe wrapper to avoid hoisting issues
function createGlobe(){
  createGlobe = undefined; // prevent accidental redefinition
  // create globe using current records
  const container = document.getElementById('globeViz');
  container.innerHTML = ''; // clear
  globe = Globe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .pointsData(records.filter(r=> r._visible))
    .pointLat(d=>d.lat)
    .pointLng(d=>d.lng)
    .pointAltitude(d => (d.selected ? d.speed2024/100 : d.speed2024/200))
    .pointColor(d => d.selected ? '#fb923c' : colorForSpeed(d.speed2024))
    .pointsTransitionDuration(700)
    .pointLabel(d => `<strong>${d.country}</strong><br>${d.majorArea} • ${d.region}<br>2023: ${d.speed2023} Mbps<br>2024: ${d.speed2024} Mbps`)
    .onPointClick(d => {
      if(!d) return;
      // toggle selection
      d.selected = !d.selected;
      if(d.selected) selectedSet.add(d.country); else selectedSet.delete(d.country);
      updateSelectedListUI(); updateCountryInputFromSelection(); drawCountryComparison(); refreshGlobePoints();
    })
    .onPointHover(d => {
      if(d) {
        countryDetails.innerHTML = `<strong>${d.country}</strong><div class="small">Region: ${d.region} • Continent: ${d.majorArea}</div><div style="margin-top:6px">2023: <strong>${d.speed2023} Mbps</strong><br/>2024: <strong>${d.speed2024} Mbps</strong><br/>Change: <strong>${(d.speed2024 - d.speed2023).toFixed(2)} Mbps</strong></div>`;
      }
    })
    .width(container.clientWidth)
    .height(container.clientHeight)
    .backgroundColor('#071427')
    .showAtmosphere(true)
    .atmosphereColor('#3b82f6');

  container.appendChild(globe.renderer().domElement);
  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.2;
}

// helper to update selection UI after direct code changes
function updateCountryInputFromSelection(){
  countryInput.value = Array.from(selectedSet).join(', ');
  updateSelectedListUI();
}

// initial bootstrap
records = parseRows(csvToRows(sampleCSV));
drawTopAndKPIs();
createGlobe();
refreshGlobePoints();

// expose refreshGlobePoints in case it's called earlier
function refreshGlobePoints(){
  if(!globe) return;
  globe.pointsTransitionDuration(700);
  globe.pointsData(records.filter(r => r._visible));
}
