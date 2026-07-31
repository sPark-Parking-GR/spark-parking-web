const fs = require('fs')
const path = require('path')

const LOCALES = ['en', 'el']

function flatten(value, prefix, keys) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, keys)
    }
  } else {
    keys.add(prefix)
  }
  return keys
}

function loadKeys(locale) {
  const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return flatten(data, '', new Set())
}

function missingFrom(source, target) {
  return [...source].filter((key) => !target.has(key)).sort()
}

const [en, el] = LOCALES.map(loadKeys)
const missingInEl = missingFrom(en, el)
const missingInEn = missingFrom(el, en)

if (missingInEl.length === 0 && missingInEn.length === 0) {
  console.log(`i18n parity OK: en.json and el.json both have ${en.size} keys.`)
  process.exit(0)
}

if (missingInEl.length > 0) {
  console.error(`Missing in el.json (${missingInEl.length}):`)
  for (const key of missingInEl) console.error(`  ${key}`)
}

if (missingInEn.length > 0) {
  console.error(`Missing in en.json (${missingInEn.length}):`)
  for (const key of missingInEn) console.error(`  ${key}`)
}

process.exit(1)
