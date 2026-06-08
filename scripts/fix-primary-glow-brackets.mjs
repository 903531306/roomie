import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const SKIP_DIRS = ['unpackage', 'node_modules', '.git', 'dist']

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

// var(--primary-glow, rgba(79, 70, 229, 0.2) 缺少 var() 的闭合括号
const brokenRe = /var\(--primary-glow, rgba\(79, 70, 229, ([0-9.]+)\)(?!\))/g
const fixedSuffix = 'var(--primary-glow, rgba(79, 70, 229, $1))'

let count = 0
for (const file of walk(root)) {
  if (file.includes(`${path.sep}scripts${path.sep}`)) continue
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  content = content.replace(brokenRe, fixedSuffix)
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8')
    count++
    console.log('fixed:', path.relative(root, file))
  }
}
console.log(`Done. ${count} files fixed.`)
