import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const SKIP = new Set(['ThemePickerModal.vue', 'ThemeProvider.vue', 'ThemeSelector.uvue'])
const SKIP_DIRS = ['unpackage', 'node_modules', '.git']

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.includes(name)) continue
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) walk(full, files)
    else if (/\.vue$/.test(name)) files.push(full)
  }
  return files
}

const IMPORT_LINE = "import { useAppTheme } from '@/common/themes/useAppTheme.js'"
const SETUP_LINE = 'const { themeClass, primaryColor, softColor, theme } = useAppTheme()'

function inject(file) {
  if (SKIP.has(path.basename(file))) return false
  let content = fs.readFileSync(file, 'utf8')
  if (!content.includes('<script setup>')) return false
  if (!content.includes('themeClass')) return false
  if (content.includes('useAppTheme')) return false

  content = content.replace(
    /<script setup>\s*\n/,
    `<script setup>\n${IMPORT_LINE}\n${SETUP_LINE}\n\n`
  )
  fs.writeFileSync(file, content, 'utf8')
  return true
}

let n = 0
for (const dir of [path.join(root, 'pages'), path.join(root, 'components')]) {
  for (const file of walk(dir)) {
    if (inject(file)) {
      n++
      console.log('injected:', path.relative(root, file))
    }
  }
}
console.log(`Injected useAppTheme into ${n} files.`)
