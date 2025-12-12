import Papa from 'papaparse'

export function parseCSVText(csvText) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err)
    })
  })
}

export async function fetchAndParseCSV(url = '/data.csv') {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch CSV: ' + res.status)
  const text = await res.text()
  return parseCSVText(text)
}
