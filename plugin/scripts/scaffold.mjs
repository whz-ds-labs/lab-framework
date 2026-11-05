#!/usr/bin/env node
// Dependency-free scaffolder for DS Labs course repos, intern repos and labs.
// Node built-ins only: it runs from an installed Claude plugin without node_modules.
//
//   node scaffold.mjs course --dir <path> --course <id> --title-de <s> --title-en <s> [--packs <dir>]
//   node scaffold.mjs intern --dir <path> --course <id>
//   node scaffold.mjs lab    --dir <course-dir> --topic <id> --title-de <s> --title-en <s>
//
// Every command also accepts --templates <dir> (default: ../templates next to this script);
// meant for tests and framework development only.
//
// Exit codes: 0 ok (created paths printed), 1 usage/validation error (one line on
// stderr, nothing written).
import {
  existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync,
} from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))

const ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const KNOWN_PLACEHOLDER_RE =
  /%%(course|courseTitleDe|courseTitleEn|topic|topicTitleDe|topicTitleEn|frameworkVersion|year)%%/g
const ANY_PLACEHOLDER_RE = /%%[A-Za-z]+%%/
const TEXT_EXTENSIONS = new Set([
  '.ts', '.vue', '.js', '.mjs', '.json', '.md', '.html', '.css', '.py', '.toml',
  '.yml', '.yaml', '.txt', '.lock',
])
const RENAMES = {
  _gitignore: '.gitignore',
  _gitattributes: '.gitattributes',
  _github: '.github',
  '_CLAUDE.md': 'CLAUDE.md',
}
// Titles end up inside generated code (JSON, TS strings, YAML); keep them free of
// characters that could break out of a string or act as replacement patterns.
const UNSAFE_TITLE_RE = /[\u0000-\u001f"'`\\$<>{}%]/
const IMPORT_MARKER = '// ds-labs:lab-imports'
const LIST_MARKER = '// ds-labs:lab-list'

class ScaffoldError extends Error {}

function fail(message) {
  throw new ScaffoldError(message)
}

function checkId(value, label) {
  if (typeof value !== 'string' || value.length < 2 || value.length > 41 || !ID_RE.test(value)) {
    fail(`invalid id for ${label}: ${JSON.stringify(value)} (2-41 chars, lowercase letters, digits, single dashes inside)`)
  }
}

function checkTitle(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`missing ${label}`)
  if (UNSAFE_TITLE_RE.test(value)) {
    fail(`${label} contains an unsupported character (quotes, backslash, $, <, >, {, }, %, control characters)`)
  }
}

function checkDir(value) {
  if (typeof value !== 'string' || value === '') fail('missing --dir')
}

function camelCase(id) {
  return id.replace(/-([a-z0-9])/g, (_m, c) => c.toUpperCase())
}

/**
 * Names already bound at (or near) top level of a TS module: imports and simple declarations.
 * Known limit: destructuring, multiple declarators, default-exported functions and type aliases
 * are not scanned. site/course.ts is template-generated and every lab binding ends in "Lab",
 * so exotic binding forms are out of scope.
 */
function declaredNames(source) {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/.*$/gm, '$1')
  const names = new Set()
  const ident = /^[A-Za-z_$][\w$]*$/
  for (const m of text.matchAll(/^\s*import\s+(?:type\s+)?([^'";]*?)\s+from\s+['"][^'"]+['"]/gm)) {
    const clause = m[1]
    const braces = /\{([\s\S]*)\}/.exec(clause)
    if (braces) {
      for (const part of braces[1].split(',')) {
        const words = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)
        const local = (words[1] ?? words[0]).trim()
        if (ident.test(local)) names.add(local)
      }
    }
    for (const part of clause.replace(/\{[\s\S]*\}/, '').split(',')) {
      const local = part.trim().replace(/^\*\s*as\s+/, '')
      if (ident.test(local)) names.add(local)
    }
  }
  const decl = /^\s*(?:export\s+)?(?:declare\s+)?(?:async\s+)?(?:const|let|var|function\s*\*?|class)\s+([A-Za-z_$][\w$]*)/gm
  for (const m of text.matchAll(decl)) names.add(m[1])
  return names
}

function frameworkVersion() {
  const file = join(scriptDir, '..', 'package.json')
  try {
    return JSON.parse(readFileSync(file, 'utf8')).version
  } catch {
    return fail(`cannot read the framework version from ${file}`)
  }
}

function isTextFile(name) {
  const ext = extname(name)
  return ext === '' || TEXT_EXTENSIONS.has(ext)
}

function listFiles(root, rel = '') {
  const out = []
  for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
    const next = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...listFiles(root, next))
    else if (entry.isFile()) out.push(next)
  }
  return out.sort()
}

function renameSegments(rel) {
  return rel
    .split('/')
    .map((seg) => RENAMES[seg] ?? seg)
    .join('/')
}

/** Reads a template folder into memory and resolves all placeholders. Writes nothing. */
function renderTemplate(templateRoot, values) {
  if (!existsSync(templateRoot) || !statSync(templateRoot).isDirectory()) {
    fail(`templates directory not found: ${templateRoot}`)
  }
  const files = []
  for (const rel of listFiles(templateRoot)) {
    const target = renameSegments(rel)
    const raw = readFileSync(join(templateRoot, rel))
    if (!isTextFile(target)) {
      files.push({ rel: target, content: raw })
      continue
    }
    const text = raw
      .toString('utf8')
      .replace(KNOWN_PLACEHOLDER_RE, (_m, name) => {
        const v = values[name]
        return v === undefined ? `%%${name}%%` : String(v)
      })
    const left = ANY_PLACEHOLDER_RE.exec(text)
    if (left) fail(`unknown placeholder ${left[0]} in ${target}`)
    files.push({ rel: target, content: text })
  }
  return files
}

function assertEmptyTarget(dir) {
  if (!existsSync(dir)) return
  if (!statSync(dir).isDirectory()) fail(`target is not a directory: ${dir}`)
  if (readdirSync(dir).length > 0) fail(`target directory is not empty: ${dir}`)
}

function findPacks(packsDir) {
  const dir = resolve(packsDir)
  if (!existsSync(dir) || !statSync(dir).isDirectory()) fail(`--packs is not a directory: ${dir}`)
  const names = readdirSync(dir)
  const pick = (re, label) => {
    const hits = names.filter((n) => re.test(n))
    if (hits.length !== 1) fail(`--packs needs exactly one ${label} tarball in ${dir}, found ${hits.length}`)
    return `file:${resolve(dir, hits[0]).replace(/\\/g, '/')}`
  }
  return {
    ui: pick(/^whz-ds-labs-ui-.*\.tgz$/, 'whz-ds-labs-ui-*.tgz'),
    labKit: pick(/^whz-ds-labs-lab-kit-.*\.tgz$/, 'whz-ds-labs-lab-kit-*.tgz'),
  }
}

function applyPacks(files, packs) {
  const pkg = files.find((f) => f.rel === 'package.json')
  if (!pkg) fail('--packs needs a package.json in the generated course')
  const json = JSON.parse(pkg.content)
  json.dependencies = {
    ...json.dependencies,
    '@whz-ds-labs/lab-kit': packs.labKit,
    '@whz-ds-labs/ui': packs.ui,
  }
  pkg.content = JSON.stringify(json, null, 2) + '\n'
}

function writeAll(baseDir, files) {
  const created = []
  for (const f of files) {
    const abs = join(baseDir, ...f.rel.split('/'))
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, f.content)
    created.push(abs)
  }
  return created
}

function insertBeforeMarker(text, marker, build) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const lines = text.split(eol)
  const idx = lines.findIndex((l) => l.includes(marker))
  const indent = /^\s*/.exec(lines[idx])[0]
  lines.splice(idx, 0, build(indent))
  return lines.join(eol)
}

/**
 * @param {'course'|'intern'|'lab'} kind
 * @param {object} opts
 * @returns {{ created: string[] }}
 */
export function scaffold(kind, opts = {}) {
  if (!['course', 'intern', 'lab'].includes(kind)) fail(`unknown command "${kind}" (use course, intern or lab)`)
  checkDir(opts.dir)
  const templatesDir = opts.templatesDir ?? join(scriptDir, '..', 'templates')
  const dir = resolve(opts.dir)
  const version = frameworkVersion()
  const year = new Date().getFullYear()

  if (kind === 'course' || kind === 'intern') {
    checkId(opts.course, 'course')
    if (kind === 'course') {
      checkTitle(opts.titleDe, '--title-de')
      checkTitle(opts.titleEn, '--title-en')
    }
    if (kind === 'intern' && opts.packs !== undefined) fail('--packs is only valid for course')
    assertEmptyTarget(dir)
    const files = renderTemplate(join(templatesDir, kind === 'course' ? 'course' : 'course-intern'), {
      course: opts.course,
      courseTitleDe: opts.titleDe,
      courseTitleEn: opts.titleEn,
      frameworkVersion: version,
      year,
    })
    if (opts.packs !== undefined) applyPacks(files, findPacks(opts.packs))
    return { created: writeAll(dir, files) }
  }

  // lab
  checkId(opts.topic, 'topic')
  // "kit" is the message scope of the framework texts; a lab with that id would overwrite them.
  if (opts.topic === 'kit') fail('"kit" is a reserved id (framework message scope); choose another topic id')
  checkTitle(opts.titleDe, '--title-de')
  checkTitle(opts.titleEn, '--title-en')
  if (opts.packs !== undefined) fail('--packs is only valid for course')
  if (!existsSync(dir) || !statSync(dir).isDirectory()) fail(`course directory not found: ${dir}`)
  const labDir = join(dir, 'labs', opts.topic)
  if (existsSync(labDir)) fail(`lab already exists: ${labDir}`)
  const courseFile = join(dir, 'site', 'course.ts')
  if (!existsSync(courseFile)) fail(`site/course.ts not found in ${dir}`)
  const courseText = readFileSync(courseFile, 'utf8')
  for (const marker of [IMPORT_MARKER, LIST_MARKER]) {
    if (!courseText.includes(marker)) fail(`site/course.ts is missing the marker "${marker}"`)
  }
  const files = renderTemplate(join(templatesDir, 'lab'), {
    topic: opts.topic,
    topicTitleDe: opts.titleDe,
    topicTitleEn: opts.titleEn,
    frameworkVersion: version,
    year,
  })
  const name = `${camelCase(opts.topic)}Lab`
  if (declaredNames(courseText).has(name)) {
    fail(`site/course.ts already declares "${name}"; choose another topic id`)
  }
  let updated = insertBeforeMarker(
    courseText,
    IMPORT_MARKER,
    () => `import { lab as ${name} } from '../labs/${opts.topic}/lab'`,
  )
  updated = insertBeforeMarker(updated, LIST_MARKER, (indent) => `${indent}${name},`)

  const created = writeAll(labDir, files)
  writeFileSync(courseFile, updated)
  return { created }
}

const OPTIONS = {
  course: { required: ['dir', 'course', 'title-de', 'title-en'], optional: ['packs', 'templates'] },
  intern: { required: ['dir', 'course'], optional: ['templates'] },
  lab: { required: ['dir', 'topic', 'title-de', 'title-en'], optional: ['templates'] },
}

function parseArgs(argv) {
  const [kind, ...rest] = argv
  if (!kind || !(kind in OPTIONS)) fail('usage: scaffold.mjs <course|intern|lab> --dir <path> ... (see header of scaffold.mjs)')
  const spec = OPTIONS[kind]
  const values = {}
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i]
    if (!flag.startsWith('--')) fail(`unexpected argument "${flag}"`)
    const key = flag.slice(2)
    if (![...spec.required, ...spec.optional].includes(key)) fail(`unknown option ${flag} for ${kind}`)
    if (i + 1 >= rest.length) fail(`option ${flag} needs a value`)
    values[key] = rest[i + 1]
  }
  for (const key of spec.required) if (values[key] === undefined) fail(`missing required option --${key}`)
  return {
    kind,
    opts: {
      dir: values.dir,
      course: values.course,
      topic: values.topic,
      titleDe: values['title-de'],
      titleEn: values['title-en'],
      packs: values.packs,
      templatesDir: values.templates,
    },
  }
}

function main(argv) {
  try {
    const { kind, opts } = parseArgs(argv)
    const { created } = scaffold(kind, opts)
    console.log(created.join('\n'))
    return 0
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`error: ${msg.replace(/\s*\n\s*/g, ' ')}`)
    return 1
  }
}

function isEntryPoint() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isEntryPoint()) {
  process.exitCode = main(process.argv.slice(2))
}
