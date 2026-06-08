import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const SKIP_DIRS = ['unpackage', 'node_modules', '.git', 'dist', 'scripts']

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.includes(name)) continue
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walk(full, files)
    else if (/\.(vue|css|scss)$/.test(name)) files.push(full)
  }
  return files
}

function fixContent(content) {
  let out = content

  // var(--primary-glow, var(--primary-glow, rgba(...))) → var(--primary-glow, rgba(...))
  out = out.replace(
    /var\(--primary-glow,\s*var\(--primary-glow,\s*rgba\(79,\s*70,\s*229,\s*([0-9.]+)\)\)/g,
    'var(--primary-glow, rgba(79, 70, 229, $1))'
  )

  // var(--primary-soft, var(--primary-soft, #EEF2FF)) → var(--primary-soft, #EEF2FF)
  out = out.replace(
    /var\(--primary-soft,\s*var\(--primary-soft,\s*(#[0-9A-Fa-f]{3,8})\)\)/g,
    'var(--primary-soft, $1)'
  )

  // 仍可能残留：var(--primary-glow, rgba(...); 少一个 )
  out = out.replace(
    /var\(--primary-glow,\s*rgba\(79,\s*70,\s*229,\s*([0-9.]+)\);/g,
    'var(--primary-glow, rgba(79, 70, 229, $1));'
  )

  return out
}

let count = 0
for (const file of walk(root)) {
  let content = fs.readFileSync(file, 'utf8')
  const fixed = fixContent(content)
  if (fixed !== content) {
    fs.writeFileSync(file, fixed, 'utf8')
    count++
    console.log('fixed:', path.relative(root, file))
  }
}
console.log(`Done. ${count} files fixed.`)
