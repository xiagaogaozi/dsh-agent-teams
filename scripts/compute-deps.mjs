// Compute the minimal @deepseek-ai closure needed by the built lib/ at runtime,
// plus the non-scope deps. Prints two lists (keep scope dirs / delete scope dirs).
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'D:/github/dsh-agent-teams'
const SCOPE = path.join(ROOT, 'node_modules', '@deepseek-ai')

// Roots: bare specifiers imported by the compiled host lib.
const libImports = new Set()
for (const file of fs.readdirSync(path.join(ROOT, 'lib')).filter(f => f.endsWith('.js'))) {
  const text = fs.readFileSync(path.join(ROOT, 'lib', file), 'utf8')
  for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) libImports.add(m[1])
  for (const m of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) libImports.add(m[1])
  for (const m of text.matchAll(/require\(["']([^"']+)["']\)/g)) libImports.add(m[1])
}
// Client externals (browser-side, provided by the host app) still need types at
// build time and resolve at bundle time.
for (const p of ['@deepseek-ai/dsh-client-locale', '@deepseek-ai/dsh-client-runtime', '@deepseek-ai/dsh-client-ui-conversation', '@deepseek-ai/dsh-client-ui-primitives']) libImports.add(p)

// Non-relative specifier → top-level package name.
function pkgName(spec) {
  if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:')) return null
  return spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
}

const scopePkgs = fs.readdirSync(SCOPE).filter(n => fs.statSync(path.join(SCOPE, n)).isDirectory())
const keep = new Set()
const queue = []
for (const spec of libImports) {
  const name = pkgName(spec)
  // Strip the scope prefix: SCOPE is already the @deepseek-ai directory.
  if (name && name.startsWith('@deepseek-ai/')) queue.push(name.slice('@deepseek-ai/'.length))
}
// BFS through package.json dependencies + peerDependencies within the scope.
while (queue.length) {
  const name = queue.pop()
  if (keep.has(name)) continue
  const pj = path.join(SCOPE, name, 'package.json')
  if (!fs.existsSync(pj)) continue
  keep.add(name)
  try {
    const p = JSON.parse(fs.readFileSync(pj, 'utf8'))
    const deps = { ...(p.dependencies || {}), ...(p.peerDependencies || {}) }
    for (const dep of Object.keys(deps)) {
      if (dep.startsWith('@deepseek-ai/')) queue.push(dep.slice('@deepseek-ai/'.length))
    }
  } catch { /* ignore */ }
}

const deleteList = scopePkgs.filter(n => !keep.has(n))
console.log('LIB IMPORTS (' + libImports.size + '):', [...libImports].sort().join(', '))
console.log('KEEP (' + keep.size + '):', [...keep].sort().join(', '))
console.log('DELETE (' + deleteList.length + '):', deleteList.join(', '))

if (process.argv.includes('--apply')) {
  let removed = 0
  for (const name of deleteList) {
    fs.rmSync(path.join(SCOPE, name), { recursive: true, force: true })
    removed++
  }
  console.log(`APPLIED: removed ${removed} packages from ${SCOPE}`)
}
