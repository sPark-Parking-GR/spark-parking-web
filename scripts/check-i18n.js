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

/**
 * Audit rows fall back to a humanised action string when their label key is missing, which
 * is not an error anywhere — it just renders one row in a different voice from every other
 * row, and nobody notices until they read the log. So the table in audit-format.ts is
 * checked against both locales here rather than trusted.
 *
 * Read by regex because this script is plain node and the table is TypeScript. Finding
 * nothing is treated as a failure: a refactor that renames the field would otherwise turn
 * this check into a silent no-op, which is the exact failure it exists to catch.
 */
function auditActionKeys() {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'lib', 'audit-format.ts'),
    'utf8',
  )
  return [...source.matchAll(/key: '([A-Za-z]+)'/g)].map((match) => match[1])
}

function checkAuditActions(localeKeys) {
  const keys = auditActionKeys()
  if (keys.length === 0) {
    console.error('check-i18n could not read any action keys from audit-format.ts.')
    return false
  }

  let ok = true
  for (const [locale, present] of Object.entries(localeKeys)) {
    const missing = keys.filter((key) => !present.has(`insights.audit.actions.${key}`))
    if (missing.length > 0) {
      ok = false
      console.error(`Audit action labels missing from ${locale}.json (${missing.length}):`)
      for (const key of missing) console.error(`  ${key}`)
    }
  }
  return ok
}

const [en, el] = LOCALES.map(loadKeys)
const missingInEl = missingFrom(en, el)
const missingInEn = missingFrom(el, en)
const auditOk = checkAuditActions({ en, el })

if (missingInEl.length === 0 && missingInEn.length === 0 && auditOk) {
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
