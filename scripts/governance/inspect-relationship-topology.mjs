import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseAst } from 'rolldown/parseAst'

const DERIVED_RELATIONSHIP_TOPOLOGY = Object.freeze({
  linear: { stage: 'ordinary' },
  gauge: { stage: 'ordinary', implicitOutputs: ['gauge'] },
  'threshold-operation': {
    stage: 'completed-stat',
    implicitOutputs: ['gauge', 'operation'],
    implicitSurface: 'combat/fully',
  },
  'projection-gauge': {
    stage: 'terminal',
    implicitBasis: 'metric',
    implicitOutputs: ['gauge'],
    implicitSurface: 'fully',
  },
  'post-delivery-stat-modifier-gauge': {
    stage: 'post-delivery',
    implicitOutputs: ['modifier', 'gauge'],
  },
  'post-delivery-metric-stat-gauge': {
    stage: 'post-delivery',
    implicitOutputs: ['stat', 'gauge'],
  },
  'surface-stat-derived-metric': {
    stage: 'terminal',
    implicitBasis: 'stat',
    implicitOutputs: ['metric'],
    implicitSurface: 'each',
  },
  'post-delivery-linear': { stage: 'post-delivery' },
  'post-delivery-gauge': { stage: 'post-delivery', implicitOutputs: ['gauge'] },
})

const DIRECT_RELATIONSHIP_KINDS = Object.freeze([
  'stat', 'modifier', 'automatic-energy', 'operation', 'provider',
])

function propertyName(property) {
  if (!['Property', 'TSPropertySignature'].includes(property?.type) || property.computed) return null
  if (property.key?.type === 'Identifier') return property.key.name
  if (property.key?.type === 'Literal' && typeof property.key.value === 'string') {
    return property.key.value
  }
  return null
}

function propertyValue(object, name) {
  if (object?.type !== 'ObjectExpression') return undefined
  return object.properties.find((property) => propertyName(property) === name)?.value
}

function literalString(node) {
  return node?.type === 'Literal' && typeof node.value === 'string'
    ? node.value
    : undefined
}

function visit(node, callback) {
  if (!node || typeof node !== 'object') return
  if (typeof node.type === 'string') callback(node)
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || key === 'range' || key === 'comments') continue
    if (Array.isArray(value)) {
      for (const child of value) visit(child, callback)
    } else if (value && typeof value === 'object') {
      visit(value, callback)
    }
  }
}

function outputKinds(object, topology) {
  const outputs = new Set(topology.implicitOutputs ?? [])
  const outputNode = propertyValue(object, 'outputs')
  if (outputNode) {
    visit(outputNode, (node) => {
      if (node.type !== 'Property' || propertyName(node) !== 'emission') return
      const kind = literalString(propertyValue(node.value, 'kind'))
      if (kind) outputs.add(kind)
    })
  }
  return [...outputs].sort()
}

function basisKind(object, topology) {
  const basis = propertyValue(object, 'basis')
  if (!basis) return topology.implicitBasis ?? 'none'
  if (basis.type !== 'ObjectExpression') return 'indirect'
  if (propertyValue(basis, 'statId')) return 'stat'
  if (propertyValue(basis, 'metricId')) return 'metric'
  return 'other'
}

function basisSurface(object, topology) {
  const basis = propertyValue(object, 'basis')
  if (basis?.type !== 'ObjectExpression') return topology.implicitSurface ?? null
  return literalString(propertyValue(basis, 'surface')) ?? topology.implicitSurface ?? null
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split(/\r?\n/).length
}

export function inspectRelationshipSource(source, file = '<source>') {
  const program = parseAst(source, { lang: 'ts' })
  const rows = []
  visit(program, (node) => {
    if (node.type !== 'ObjectExpression') return
    const kind = literalString(propertyValue(node, 'kind'))
    const topology = DERIVED_RELATIONSHIP_TOPOLOGY[kind]
    if (!topology || !propertyValue(node, 'source')) return
    rows.push({
      kind,
      stage: topology.stage,
      basis: basisKind(node, topology),
      surface: basisSurface(node, topology),
      outputs: outputKinds(node, topology),
      file: file.replaceAll('\\', '/'),
      line: lineNumber(source, node.start ?? 0),
    })
  })
  return rows
}

function typeLiteralKind(typeLiteral) {
  if (typeLiteral?.type !== 'TSTypeLiteral') return undefined
  const kind = typeLiteral.members.find((member) => (
    member.type === 'TSPropertySignature' && propertyName(member) === 'kind'
  ))
  return literalString(kind?.typeAnnotation?.typeAnnotation?.literal)
}

export function profileRelationshipCoverage(source) {
  const program = parseAst(source, { lang: 'ts' })
  const declarations = program.body.flatMap((statement) => {
    if (statement.type === 'ExportNamedDeclaration' && statement.declaration) {
      return [statement.declaration]
    }
    return ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration'].includes(statement.type)
      ? [statement]
      : []
  })
  const declarationByName = new Map(declarations.flatMap((declaration) => (
    ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration'].includes(declaration.type)
      && declaration.id?.type === 'Identifier'
      ? [[declaration.id.name, declaration]]
      : []
  )))
  const relationship = declarationByName.get('ProfileRelationship')
  const kindsForType = (node, seen = new Set()) => {
    if (!node || seen.has(node)) return []
    const nextSeen = new Set(seen).add(node)
    if (node.type === 'TSTypeAliasDeclaration') return kindsForType(node.typeAnnotation, nextSeen)
    if (node.type === 'TSInterfaceDeclaration') {
      return kindsForType({ type: 'TSTypeLiteral', members: node.body.body }, nextSeen)
    }
    if (node.type === 'TSUnionType' || node.type === 'TSIntersectionType') {
      return node.types.flatMap((member) => kindsForType(member, nextSeen))
    }
    if (node.type === 'TSTypeLiteral') {
      const kind = typeLiteralKind(node)
      return kind ? [kind] : []
    }
    if (node.type === 'TSTypeReference' && node.typeName?.type === 'Identifier') {
      const declaration = declarationByName.get(node.typeName.name)
      return declaration ? kindsForType(declaration, nextSeen) : []
    }
    return []
  }
  if (relationship?.typeAnnotation?.type !== 'TSUnionType') {
    throw new Error('ProfileRelationship union is unavailable')
  }
  const kinds = [...new Set(kindsForType(relationship))].sort()
  const expected = [...DIRECT_RELATIONSHIP_KINDS, ...Object.keys(DERIVED_RELATIONSHIP_TOPOLOGY)].sort()
  const missing = expected.filter((kind) => !kinds.includes(kind))
  const unclassified = kinds.filter((kind) => !expected.includes(kind))
  return { kinds, expected, missing, unclassified }
}

async function sourceFiles(root, relative = '') {
  const directory = path.join(root, relative)
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const child = path.join(relative, entry.name)
    if (entry.isDirectory()) files.push(...await sourceFiles(root, child))
    else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
      files.push(child)
    }
  }
  return files.sort()
}

export async function inspectRelationshipDirectory(root) {
  const rows = []
  const displayRoot = path.relative(process.cwd(), root)
  for (const file of await sourceFiles(root)) {
    const source = await fs.readFile(path.join(root, file), 'utf8')
    rows.push(...inspectRelationshipSource(source, path.join(displayRoot, file)))
  }
  return rows.sort((left, right) => (
    left.stage.localeCompare(right.stage)
    || left.kind.localeCompare(right.kind)
    || left.file.localeCompare(right.file)
    || left.line - right.line
  ))
}

export function filterRelationshipRows(rows, filters) {
  return rows.filter((row) => (
    (!filters.stage || row.stage === filters.stage)
    && (!filters.basis || row.basis === filters.basis)
    && (!filters.output || row.outputs.includes(filters.output))
    && (!filters.kind || row.kind === filters.kind)
  ))
}

export function parseArguments(argv) {
  const filters = {}
  let root = 'src/workbench/content'
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`)
    const [flag, inlineValue] = argument.slice(2).split('=', 2)
    const value = inlineValue ?? argv[++index]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${flag}`)
    if (flag === 'root') root = value
    else if (['stage', 'basis', 'output', 'kind'].includes(flag)) filters[flag] = value
    else throw new Error(`Unknown option: --${flag}`)
  }
  return { root, filters }
}

export function formatRelationshipRows(rows) {
  const header = [
    'Generated relationship-topology projection; inspect each returned consumer.',
    'No row proves semantic applicability, and no empty result proves absence.',
    '',
    'stage | basis | surface | outputs | kind | source',
  ]
  const body = rows.map((row) => [
    row.stage,
    row.basis,
    row.surface ?? '-',
    row.outputs.length > 0 ? row.outputs.join(',') : 'unresolved',
    row.kind,
    `${row.file}:${row.line}`,
  ].join(' | '))
  return [...header, ...(body.length > 0 ? body : ['(no literal relationship declarations matched)'])].join('\n')
}

async function main() {
  const { root, filters } = parseArguments(process.argv.slice(2))
  const absoluteRoot = path.resolve(root)
  const rows = filterRelationshipRows(
    await inspectRelationshipDirectory(absoluteRoot),
    filters,
  )
  process.stdout.write(`${formatRelationshipRows(rows)}\n`)
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
