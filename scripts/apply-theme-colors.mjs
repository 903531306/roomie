import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const SKIP_FILES = new Set([
  'App.vue',
  'appTheme.ts',
  'ThemePickerModal.vue',
  'ThemeProvider.vue',
  'ThemeSelector.uvue'
])

const SKIP_DIRS = ['unpackage', 'node_modules', '.git', 'dist']

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.includes(name)) continue
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walk(full, files)
    else if (/\.(vue|uvue)$/.test(name)) files.push(full)
  }
  return files
}

function shouldSkip(file) {
  return SKIP_FILES.has(path.basename(file))
}

function replaceColors(content) {
  if (content.includes('var(--primary-color')) {
    // 已部分替换，继续处理未替换项
  }
  let out = content
  // 避免重复包裹
  out = out.replace(/var\(--primary-color,\s*var\(--primary-color[^)]+\)\)/g, 'var(--primary-color, #4F46E5)')
  out = out.replace(
    /var\(--primary-glow,\s*var\(--primary-glow,\s*rgba\(79,\s*70,\s*229,\s*([0-9.]+)\)\)/g,
    'var(--primary-glow, rgba(79, 70, 229, $1))'
  )
  out = out.replace(
    /var\(--primary-soft,\s*var\(--primary-soft,\s*(#[0-9A-Fa-f]{3,8})\)\)/g,
    'var(--primary-soft, $1)'
  )

  out = out.replace(/#4F46E5/g, (match, offset) => {
    const before = out.slice(Math.max(0, offset - 30), offset)
    if (before.includes('var(--primary-color')) return match
    return 'var(--primary-color, #4F46E5)'
  })

  out = out.replace(/#EEF2FF/g, 'var(--primary-soft, #EEF2FF)')
  // 将主题光晕 rgba 包进 var()，并补上闭合括号
  out = out.replace(
    /rgba\(79,\s*70,\s*229,\s*([0-9.]+)\)/g,
    'var(--primary-glow, rgba(79, 70, 229, $1))'
  )
  // 修复历史错误替换（少一个右括号）
  out = out.replace(
    /var\(--primary-glow, rgba\(79, 70, 229, ([0-9.]+)\)(?!\))/g,
    'var(--primary-glow, rgba(79, 70, 229, $1))'
  )
  return out
}

function injectThemeClass(content) {
  if (content.includes('themeClass')) return content
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
  if (!templateMatch) return content

  let template = templateMatch[1]
  const viewRe = /<view\s+([^>]*?)>/ 
  const m = template.match(viewRe)
  if (!m) return content

  const full = m[0]
  const attrs = m[1]
  if (attrs.includes('themeClass')) return content

  let replacement
  if (attrs.includes(':class=')) {
    replacement = full.replace(/:class="([^"]*)"/, ':class="[themeClass, $1]"')
    if (replacement === full) {
      replacement = full.replace(/:class='([^']*)'/, ":class=\"[themeClass, $1]\"")
    }
  } else if (attrs.includes('class=')) {
    replacement = full.replace('<view ', '<view :class="themeClass" ')
  } else {
    replacement = full.replace('<view ', '<view :class="themeClass" ')
  }

  if (replacement === full) return content
  template = template.replace(full, replacement)
  return content.replace(templateMatch[0], `<template>${template}</template>`)
}

const dirs = [
  path.join(root, 'pages'),
  path.join(root, 'components')
]

let updated = 0
for (const dir of dirs) {
  for (const file of walk(dir)) {
    if (shouldSkip(file)) continue
    let content = fs.readFileSync(file, 'utf8')
    const original = content
    content = replaceColors(content)
    content = injectThemeClass(content)
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8')
      updated++
      console.log('updated:', path.relative(root, file))
    }
  }
}
console.log(`Done. ${updated} files updated.`)
