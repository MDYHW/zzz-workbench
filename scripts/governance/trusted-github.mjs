import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseAst } from 'rolldown/parseAst'
import {
  EVIDENCE_MARKER,
  DOCUMENTATION_CHECK_SCOPE_INPUTS,
  PolicyError,
  REVIEW_APP_AUTHOR,
  REQUIRED_CONTEXTS,
  REQUIRED_CONTEXT_NAMES,
  REQUIRED_WORKFLOWS,
  authorityTraceDigest,
  canonicalTreeDiff,
  categoryForPath,
  computeChangeClassification,
  extractRuleIdState,
  governanceSnapshotVersion,
  parseAcrDocument,
  parseAuthorityTrace,
  proveIdentifierOnlyOwnerChange,
  proveOwnerCorrectionShape,
  trustedDecision,
  validateChildOutcomes,
  isDocumentationCheckScope,
  validatePrValidationWorkflow,
  validateVisualWorkflow,
  validateFinalization,
  validateRepository,
  validateAuthorityTrace,
  validateProtectedApproval,
  validateReviewEvidence,
  validateAcrTransaction,
  validateAcrStates,
  validateSupportingRequirementRuleIds,
  createGovernanceStatusBinding,
  isActionRunTargetUrl,
  parseGovernanceStatusBinding,
} from './check-policy.mjs'

export const REPOSITORY = 'Min-DongYoung/zzz-workbench'
export const OWNER = 'Min-DongYoung'
export const REPOSITORY_NAME = 'zzz-workbench'
export const PROTECTED_BASE = 'main'
export const RECOVERY_BRANCH = 'recovery'
export const API_ORIGIN = 'https://api.github.com'

const SHA = /^[0-9a-f]{40}$/
const CODEX_BRANCH = /^codex\/[a-z0-9][a-z0-9._/-]*$/
const RECOVERY_AUDIT_PATH = 'docs/audits/2026-08-15-existing-vertical-recovery.md'

class StaleEvaluatorError extends PolicyError {}
const OWNER_FILES = [
  'docs/setup-workbench-product-contract.md',
  'docs/source-fact-boundary.md',
  'docs/workbench-ui-design-rules.md',
  'docs/zzz-formula-mechanics.md',
  'docs/zzz-game-vocabulary.md',
  'AGENTS.md',
]

export class TrustedGitHubError extends Error {
  constructor(message = 'Trusted GitHub evaluation failed.') {
    super(message)
    this.name = 'TrustedGitHubError'
  }
}

function fail(message = 'Trusted GitHub evaluation failed.') {
  throw new TrustedGitHubError(message)
}

function headers(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function responseLink(response) {
  if (!response?.headers) return ''
  if (typeof response.headers.get === 'function') return response.headers.get('link') ?? ''
  return response.headers.link ?? response.headers.Link ?? ''
}

export function createApi({ token, fetchImpl = fetch, timeoutMs = 15_000 }) {
  if (typeof token !== 'string' || token.length === 0) fail('GitHub token is unavailable.')
  async function request(pathname, init = {}) {
    let response
    try {
      response = await fetchImpl(`${API_ORIGIN}${pathname}`, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(timeoutMs),
        headers: { ...headers(token), ...(init.headers ?? {}) },
      })
    } catch {
      fail()
    }
    if (!response?.ok) fail()
    if (response.status === 204) return { data: null, response }
    try {
      return { data: await response.json(), response }
    } catch {
      fail()
    }
  }
  return {
    request,
    async json(pathname, init) {
      return (await request(pathname, init)).data
    },
    async paginate(pathname, { select = (value) => value } = {}) {
      const values = []
      let page = 1
      while (true) {
        const separator = pathname.includes('?') ? '&' : '?'
        const { data, response } = await request(`${pathname}${separator}per_page=100&page=${page}`)
        const selected = select(data)
        if (!Array.isArray(selected)) fail()
        values.push(...selected)
        const link = responseLink(response)
        if (!link.includes('rel="next"') && selected.length < 100) break
        page += 1
        if (page > 100) fail()
      }
      return values
    },
  }
}

function uniquePositiveIntegers(values) {
  const normalized = values.filter((value) => Number.isInteger(Number(value)) && Number(value) > 0).map(Number)
  return [...new Set(normalized)].sort((left, right) => left - right)
}

export async function resolveEventPullRequests({ eventName, event, api }) {
  if (!event || typeof event !== 'object') fail('GitHub event is invalid.')
  if (eventName === 'pull_request_target') {
    if (event.pull_request?.base?.ref !== PROTECTED_BASE || event.pull_request?.state === 'closed') return []
    return uniquePositiveIntegers([event.pull_request.number])
  }
  if (eventName === 'issue_comment') {
    if (!event.issue?.pull_request || event.repository?.full_name !== REPOSITORY) return []
    return uniquePositiveIntegers([event.issue.number])
  }
  if (eventName === 'workflow_run') {
    const direct = uniquePositiveIntegers((event.workflow_run?.pull_requests ?? []).map(({ number }) => number))
    if (direct.length > 0) return direct
    const headSha = event.workflow_run?.head_sha
    if (!SHA.test(headSha ?? '')) return []
    const pulls = await api.paginate(`/repos/${REPOSITORY}/commits/${headSha}/pulls?state=open`)
    return uniquePositiveIntegers(pulls.filter(({ base }) => base?.ref === PROTECTED_BASE).map(({ number }) => number))
  }
  if (eventName === 'push') {
    if (event.ref !== `refs/heads/${PROTECTED_BASE}`) return []
    const pulls = await api.paginate(`/repos/${REPOSITORY}/pulls?state=open&base=${PROTECTED_BASE}`)
    return uniquePositiveIntegers(pulls.map(({ number }) => number))
  }
  if (eventName === 'workflow_dispatch') {
    const requested = event.inputs?.pr_number
    if (requested) return uniquePositiveIntegers([requested])
    const pulls = await api.paginate(`/repos/${REPOSITORY}/pulls?state=open&base=${PROTECTED_BASE}`)
    return uniquePositiveIntegers(pulls.map(({ number }) => number))
  }
  return []
}

function assertPullRequest(pr, number) {
  if (pr?.number !== number || pr?.state !== 'open' || pr?.base?.ref !== PROTECTED_BASE
    || pr?.base?.repo?.full_name !== REPOSITORY || pr?.head?.repo?.full_name !== REPOSITORY) {
    fail('Pull request is outside the trusted protected flow.')
  }
  for (const [label, value] of [['base', pr.base.sha], ['head', pr.head.sha]]) {
    if (!SHA.test(value ?? '')) fail(`Current ${label} SHA is unavailable.`)
  }
}

async function assertUniqueHeadLifecycle(api, pr) {
  const pulls = await api.paginate(`/repos/${REPOSITORY}/pulls?state=all&sort=created&direction=desc`)
  const exact = pulls.filter((candidate) => candidate?.head?.repo?.full_name === REPOSITORY
    && candidate?.head?.sha === pr.head.sha)
  if (exact.length !== 1 || exact[0]?.number !== pr.number) {
    fail('Current PR head is not unique to one pull-request lifecycle.')
  }
}

async function fetchTreeMap(api, commitSha) {
  const commit = await api.json(`/repos/${REPOSITORY}/git/commits/${commitSha}`)
  if (!SHA.test(commit?.tree?.sha ?? '')) fail()
  const tree = await api.json(`/repos/${REPOSITORY}/git/trees/${commit.tree.sha}?recursive=1`)
  if (tree?.truncated === true || !Array.isArray(tree?.tree)) fail('Git tree is incomplete.')
  return new Map(tree.tree.filter(({ type }) => ['blob', 'commit'].includes(type)).map((entry) => [entry.path, {
    mode: entry.mode,
    type: entry.type,
    sha: entry.sha,
  }]))
}

function exactTreeDiff(baseTree, headTree) {
  const paths = [...new Set([...baseTree.keys(), ...headTree.keys()])].sort()
  return paths.flatMap((filePath) => {
    const base = baseTree.get(filePath) ?? null
    const head = headTree.get(filePath) ?? null
    if (base && head && base.mode === head.mode && base.type === head.type && base.sha === head.sha) return []
    return [{ path: filePath, base, head }]
  })
}

function normalizeComment(comment) {
  return {
    id: comment.id,
    author: comment.user?.login,
    body: comment.body,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  }
}

function normalizeReview(review) {
  return {
    id: review.id,
    author: review.user?.login,
    state: review.state,
    commitId: review.commit_id,
    submittedAt: review.submitted_at,
  }
}

async function fetchWorkflowRuns(api, pr) {
  const result = { runs: [] }
  for (const workflow of REQUIRED_WORKFLOWS) {
    const definition = await api.json(`/repos/${REPOSITORY}/actions/workflows/${encodeURIComponent(path.basename(workflow.path))}`)
    if (!Number.isInteger(definition?.id)) fail('Required workflow definition is unavailable.')
    result[workflow.idField] = definition.id
    const runs = await api.paginate(
      `/repos/${REPOSITORY}/actions/workflows/${definition.id}/runs?event=pull_request&head_sha=${pr.head.sha}`,
      { select: (payload) => payload?.workflow_runs },
    )
    for (const run of runs) {
      const binding = (run.pull_requests ?? []).find(({ number }) => number === pr.number)
      const jobs = await api.paginate(`/repos/${REPOSITORY}/actions/runs/${run.id}/jobs?filter=latest`, { select: (payload) => payload?.jobs })
      result.runs.push({
        id: run.id,
        path: workflow.path,
        workflowId: run.workflow_id,
        event: run.event,
        prNumber: binding?.number,
        baseSha: binding?.base?.sha,
        headSha: binding?.head?.sha,
        statusSha: run.head_sha,
        status: run.status,
        conclusion: run.conclusion,
        jobs: jobs.map((job) => ({
          id: job.id,
          name: job.name,
          conclusion: job.conclusion,
          steps: (job.steps ?? []).map((step) => ({ name: step.name, conclusion: step.conclusion })),
        })),
      })
    }
  }
  return result
}

async function fetchFinalizationWorkflowRuns(api, pr, expectedRunIds) {
  const expected = new Set(expectedRunIds)
  const result = { runs: [] }
  for (const workflow of REQUIRED_WORKFLOWS) {
    const definition = await api.json(`/repos/${REPOSITORY}/actions/workflows/${encodeURIComponent(path.basename(workflow.path))}`)
    if (!Number.isInteger(definition?.id)) fail('Required workflow definition is unavailable.')
    result[workflow.idField] = definition.id
    const runs = await api.paginate(
      `/repos/${REPOSITORY}/actions/workflows/${definition.id}/runs?event=pull_request&head_sha=${pr.head.sha}`,
      { select: (payload) => payload?.workflow_runs },
    )
    for (const run of runs) {
      if (run.head_sha !== pr.head.sha || !expected.has(run.id)) continue
      const jobs = await api.paginate(`/repos/${REPOSITORY}/actions/runs/${run.id}/jobs?filter=latest`, { select: (payload) => payload?.jobs })
      result.runs.push({
        id: run.id,
        path: workflow.path,
        workflowId: run.workflow_id,
        event: run.event,
        prNumber: pr.number,
        baseSha: pr.base.sha,
        headSha: pr.head.sha,
        statusSha: run.head_sha,
        status: run.status,
        conclusion: run.conclusion,
        jobs: jobs.map((job) => ({
          id: job.id,
          name: job.name,
          conclusion: job.conclusion,
          steps: (job.steps ?? []).map((step) => ({ name: step.name, conclusion: step.conclusion })),
        })),
      })
    }
  }
  return result
}

function latestSuccessfulFinalizationRuns(workflowState, pr, expectedRunIds, notApplicable = {}) {
  if (!SHA.test(pr.base?.sha ?? '') || !SHA.test(pr.head?.sha ?? '')) {
    fail('Creating-PR base or head identity is unavailable.')
  }
  const checks = validateChildOutcomes(workflowState.runs, {
    prNumber: pr.number,
    baseSha: pr.base.sha,
    headSha: pr.head.sha,
    prValidationWorkflowId: workflowState.prValidationWorkflowId,
    visualWorkflowId: workflowState.visualWorkflowId,
    documentationChecksNotApplicable: notApplicable.documentationChecksNotApplicable,
  })
  const selectedRunIds = checks.runs.map(({ id }) => Number(id)).sort((left, right) => left - right)
  const recordedRunIds = expectedRunIds.map(Number).sort((left, right) => left - right)
  if (selectedRunIds.length !== recordedRunIds.length
    || selectedRunIds.some((id, index) => id !== recordedRunIds[index])) {
    fail('Creating-PR workflow runs differ from the trusted governance record.')
  }
  return { baseSha: pr.base.sha, headSha: pr.head.sha, checks }
}

function successfulTrustedStatuses(statuses) {
  if (!Array.isArray(statuses)) fail('Creating-PR commit statuses are unavailable.')
  const result = {}
  let governanceBinding
  for (const { name: context } of REQUIRED_CONTEXTS.filter(({ kind }) => kind === 'status')) {
    const latest = statuses.filter((status) => status?.context === context)
      .sort((left, right) => Number(left.id) - Number(right.id)).at(-1)
    if (latest?.state !== 'success' || latest?.creator?.login !== 'github-actions[bot]'
      || (context === 'Protected Approval' && !isActionRunTargetUrl(latest?.target_url))) {
      fail(`Creating-PR status ${context} is not a current trusted success.`)
    }
    if (context === 'Trusted Governance') {
      governanceBinding = parseGovernanceStatusBinding({
        description: latest.description,
        targetUrl: latest.target_url,
      })
      if (!governanceBinding) fail('Trusted governance status binding is invalid.')
    }
    result[context] = 'success'
  }
  return { contexts: result, governanceBinding }
}

function governanceSuccessBinding(snapshot, decision, targetUrl) {
  const runs = Object.fromEntries(REQUIRED_WORKFLOWS.map((workflow) => {
    const matches = decision?.checks?.runs?.filter(({ path }) => path === workflow?.path) ?? []
    if (!workflow || matches.length !== 1) fail('Trusted workflow run identities are unavailable.')
    return [workflow.run, Number(matches[0].id)]
  }))
  return createGovernanceStatusBinding({
    prNumber: snapshot.prNumber,
    baseSha: snapshot.baseSha,
    runs,
    actionRunUrl: targetUrl,
  })
}

function mechanismDigestFromAudit(audit) {
  const accepted = [...audit.matchAll(/\|\s*\d+\s*\|\s*accepted\s*\|[^\n]*?\|\s*(sha256:[0-9a-f]{64})\s*\|/g)]
  return accepted.at(-1)?.[1] ?? 'none'
}

async function readRuleStateFromTree(baseTree, readText) {
  const ownerTexts = await Promise.all(OWNER_FILES.map(async (filePath) => {
    const entry = baseTree.get(filePath)
    if (!entry) fail('Historical permanent owner is unavailable.')
    return { path: filePath, text: await readText(entry) }
  }))
  return extractRuleIdState(ownerTexts)
}

async function readMechanismDigestFromTree(baseTree, readText) {
  const entry = baseTree.get(RECOVERY_AUDIT_PATH)
  return entry ? mechanismDigestFromAudit(await readText(entry)) : 'none'
}

async function derivePolicyState({ treeDiff, body, readText, baseTree, ruleState }) {
  const paths = treeDiff.entries.map(({ path: filePath }) => filePath)
  const changedSupportingRequirements = treeDiff.entries.filter(({ path: filePath }) => (
    filePath.startsWith('docs/brainstorms/') && filePath.endsWith('.md')
  ))
  for (const { path: filePath, head } of changedSupportingRequirements) {
    if (head && (head.type !== 'blob' || head.mode !== '100644')) {
      fail(`Changed supporting requirement ${filePath} must be a regular 100644 blob.`)
    }
  }
  const supportingRequirements = await Promise.all(changedSupportingRequirements
    .filter(({ head }) => head)
    .map(async ({ path: filePath, head }) => ({ path: filePath, source: await readText(head) })))
  validateSupportingRequirementRuleIds(supportingRequirements, ruleState)
  const declaration = declaredClassification(body)
  let structuralFacts
  try {
    structuralFacts = await deriveStructuralFacts({ treeDiff, readText })
  } catch {
    structuralFacts = undefined
  }
  let classification
  let classificationError
  try {
    classification = computeChangeClassification({
      paths,
      structuralFacts,
      declaration,
      visualTransaction: explicitVisualTransaction(paths),
      authorityDecision: ruleState.currentRuleIds.includes('GOV-004'),
    })
  } catch (error) {
    classificationError = error instanceof Error ? error.message : 'Change classification failed.'
    classification = {
      classification: 'protected',
      reason: 'The change matrix failed closed.',
      declarationMismatch: declaration !== 'protected',
    }
  }
  const acrState = await readBaseAcrState(baseTree, readText, ruleState.knownRuleIds)
  let identifierOnlyOwnerChange = null
  let ownerCorrection = null
  if (classification.matrix?.categories.includes('permanent-owner')) {
    const [ownerEntry] = treeDiff.entries
    if (treeDiff.entries.length === 1 && categoryForPath(ownerEntry.path) === 'permanent-owner'
      && ownerEntry.base?.type === 'blob' && ownerEntry.base.mode === '100644'
      && ownerEntry.head?.type === 'blob' && ownerEntry.head.mode === '100644') {
      const ownerChanges = [{
        path: ownerEntry.path,
        baseType: ownerEntry.base.type,
        baseMode: ownerEntry.base.mode,
        headType: ownerEntry.head.type,
        headMode: ownerEntry.head.mode,
        baseSource: await readText(ownerEntry.base),
        headSource: await readText(ownerEntry.head),
      }]
      identifierOnlyOwnerChange = proveIdentifierOnlyOwnerChange(ownerChanges, ruleState)
      ownerCorrection = proveOwnerCorrectionShape(ownerChanges)
    }
  }
  let acrTransaction
  if (classification.matrix?.categories.includes('acr-instance')) {
    acrTransaction = {
      changes: await Promise.all(treeDiff.entries
        .filter(({ path: filePath }) => categoryForPath(filePath) === 'acr-instance')
        .map(async ({ path: filePath, base, head }) => {
          if ([base, head].filter(Boolean).some((entry) => entry.type !== 'blob' || entry.mode !== '100644')) {
            fail('Authority Change Records must be regular 100644 blobs.')
          }
          return {
            path: filePath,
            baseSource: base ? await readText(base) : null,
            headSource: head ? await readText(head) : null,
          }
        })),
    }
    validateAcrTransaction(acrTransaction, {
      currentRuleIds: ruleState.currentRuleIds,
      knownRuleIds: ruleState.knownRuleIds,
      baseRecords: acrState.records,
    })
  }
  return {
    paths,
    classification,
    classificationError,
    acrState,
    acrTransaction,
    identifierOnlyOwnerChange,
    ownerCorrection,
  }
}

async function buildFinalizationEvidenceSnapshot({ api, pr, runSet, candidateSha }) {
  const current = await api.json(`/repos/${REPOSITORY}/pulls/${pr.number}`)
  if (current?.number !== pr.number || current?.state !== 'closed' || !current?.merged_at
    || current?.merge_commit_sha !== candidateSha || current?.base?.ref !== RECOVERY_BRANCH
    || current?.base?.repo?.full_name !== REPOSITORY || current?.head?.repo?.full_name !== REPOSITORY
    || current?.base?.sha !== runSet.baseSha || current?.head?.sha !== runSet.headSha
    || !CODEX_BRANCH.test(current?.head?.ref ?? '')) {
    fail('Current creating pull request metadata is no longer trusted.')
  }
  const [baseTree, headTree, comments, reviews] = await Promise.all([
    fetchTreeMap(api, runSet.baseSha),
    fetchTreeMap(api, runSet.headSha),
    api.paginate(`/repos/${REPOSITORY}/issues/${pr.number}/comments`),
    api.paginate(`/repos/${REPOSITORY}/pulls/${pr.number}/reviews`),
  ])
  const readText = (entry) => fetchBlobText(api, entry)
  const [ruleState, mechanismDigest] = await Promise.all([
    readRuleStateFromTree(baseTree, readText),
    readMechanismDigestFromTree(baseTree, readText),
  ])
  const treeDiff = canonicalTreeDiff(exactTreeDiff(baseTree, headTree))
  const policy = await derivePolicyState({
    treeDiff, body: current.body ?? '', readText, baseTree, ruleState,
  })
  const notApplicable = await notApplicableScopeForDiff({ treeDiff, baseTree, headTree, readText })
  return {
    prNumber: pr.number,
    baseSha: runSet.baseSha,
    headSha: runSet.headSha,
    body: current.body ?? '',
    diffDigest: treeDiff.digest,
    classification: policy.classification.classification,
    classificationReason: policy.classification.reason,
    declarationMismatch: policy.classification.declarationMismatch,
    classificationError: policy.classificationError,
    changeCategories: policy.classification.matrix?.categories ?? [],
    changedPaths: policy.paths,
    ...notApplicable,
    acceptedAcrRecords: policy.acrState.accepted,
    acrBaseRecords: policy.acrState.records,
    acrTransaction: policy.acrTransaction,
    identifierOnlyOwnerChange: policy.identifierOnlyOwnerChange,
    ownerCorrection: policy.ownerCorrection,
    mechanismDigest,
    knownRuleIds: ruleState.currentRuleIds,
    acrKnownRuleIds: ruleState.knownRuleIds,
    comments: comments.map(normalizeComment),
    reviews: reviews.map(normalizeReview),
    updatedAt: current.updated_at,
  }
}

export async function verifyRemoteFinalization({
  api,
  actor,
  candidateSha,
  root = process.cwd(),
  repositoryValidator = validateRepository,
}) {
  const recoveryTip = async () => {
    const ref = await api.json(`/repos/${REPOSITORY}/git/ref/heads/${RECOVERY_BRANCH}`)
    return ref?.object?.sha
  }
  if (await recoveryTip() !== candidateSha) fail('Finalization candidate is not the live recovery tip.')
  const pulls = await api.paginate(`/repos/${REPOSITORY}/commits/${candidateSha}/pulls`)
  const matches = pulls.filter((pr) => pr?.merged_at && pr?.merge_commit_sha === candidateSha
    && pr?.base?.ref === RECOVERY_BRANCH && pr?.base?.repo?.full_name === REPOSITORY
    && pr?.head?.repo?.full_name === REPOSITORY && SHA.test(pr?.base?.sha ?? '') && SHA.test(pr?.head?.sha ?? ''))
  if (matches.length !== 1) fail('Recovery candidate does not have exactly one trusted creating pull request.')
  const pr = matches[0]
  await assertUniqueHeadLifecycle(api, pr)
  const statuses = await api.paginate(`/repos/${REPOSITORY}/commits/${pr.head.sha}/statuses`)
  const trustedStatuses = successfulTrustedStatuses(statuses)
  if (trustedStatuses.governanceBinding?.prNumber !== pr.number
    || trustedStatuses.governanceBinding?.baseSha !== pr.base.sha) {
    fail('Trusted governance status does not bind the creating pull request.')
  }
  const recordedRunIds = [
    trustedStatuses.governanceBinding.runs.validation,
    trustedStatuses.governanceBinding.runs.visual,
  ]
  const workflowState = await fetchFinalizationWorkflowRuns(api, pr, recordedRunIds)
  const evidenceSnapshot = await buildFinalizationEvidenceSnapshot({
    api, pr, runSet: { baseSha: pr.base.sha, headSha: pr.head.sha }, candidateSha,
  })
  const runSet = latestSuccessfulFinalizationRuns(
    workflowState, pr, recordedRunIds, evidenceSnapshot,
  )
  evaluateEvidenceSnapshot(evidenceSnapshot)
  const actual = {
    ...trustedStatuses.contexts,
    ...Object.fromEntries(runSet.checks.jobs.map((name) => [name, 'success'])),
  }
  const repository = await repositoryValidator(root, { requireCompleteAudit: true })
  const finalTip = await recoveryTip()
  validateFinalization({
    actor,
    candidateSha,
    recoveryTipSha: finalTip,
    auditComplete: repository.auditComplete,
    statuses: actual,
  })
  return { candidateSha, creatingPr: pr.number, validatedHeadSha: runSet.headSha, statuses: actual }
}

async function readTrustedRuleState(readFile, root) {
  const ownerTexts = await Promise.all(OWNER_FILES.map(async (filePath) => ({
    path: filePath,
    text: await readFile(path.join(root, filePath), 'utf8'),
  })))
  return extractRuleIdState(ownerTexts)
}

async function readMechanismDigest(readFile, root) {
  const audit = await readFile(path.join(root, RECOVERY_AUDIT_PATH), 'utf8')
  return mechanismDigestFromAudit(audit)
}

function declaredClassification(body) {
  try {
    return parseAuthorityTrace(body).classification
  } catch {
    return 'protected'
  }
}

function explicitVisualTransaction(paths) {
  return paths.some((filePath) => categoryForPath(filePath) === 'visual-baseline')
}

function unchangedRegularInput(baseTree, headTree, filePath) {
  const base = baseTree.get(filePath)
  const head = headTree.get(filePath)
  return base?.type === 'blob' && base.mode === '100644'
    && head?.type === 'blob' && head.mode === '100644' && base.sha === head.sha
}

async function notApplicableScopeForDiff({ treeDiff, baseTree, headTree, readText }) {
  const result = { documentationChecksNotApplicable: false }
  if (isDocumentationCheckScope(treeDiff.entries)
    && DOCUMENTATION_CHECK_SCOPE_INPUTS.every((filePath) => unchangedRegularInput(baseTree, headTree, filePath))) {
    const prWorkflow = await readText(baseTree.get('.github/workflows/pr-validation.yml'))
    const visualWorkflow = await readText(baseTree.get('.github/workflows/visual-baseline.yml'))
    try {
      validatePrValidationWorkflow(prWorkflow)
      validateVisualWorkflow(visualWorkflow)
      return { documentationChecksNotApplicable: true }
    } catch (error) {
      if (!(error instanceof PolicyError)) throw error
    }
  }
  return result
}

function sourceLines(source) {
  return source.replaceAll('\r\n', '\n').split('\n')
}

function additiveLineIndexes(baseSource, headSource) {
  const base = sourceLines(baseSource)
  const head = sourceLines(headSource)
  const added = []
  let baseIndex = 0
  for (let headIndex = 0; headIndex < head.length; headIndex += 1) {
    if (baseIndex < base.length && head[headIndex] === base[baseIndex]) baseIndex += 1
    else added.push(headIndex)
  }
  return baseIndex === base.length ? { lines: head, added } : null
}

function unionMembers(source, typeName) {
  const start = source.indexOf(`export type ${typeName} =`)
  const end = source.indexOf('\nexport ', start + 1)
  if (start < 0 || end < 0) return null
  return [...source.slice(start, end).matchAll(/\|\s*'([^']+)'/g)].map((match) => match[1])
}

function rangesContainingLine(lines, matcher, endMatcher) {
  const ranges = []
  for (let index = 0; index < lines.length; index += 1) {
    if (!matcher(lines[index], index)) continue
    let end = index
    while (end < lines.length - 1 && !endMatcher(lines[end], end, index)) end += 1
    ranges.push([index, end])
  }
  return ranges
}

function additionsStayInside(added, ranges, allowedLine = () => false) {
  return added.every((index) => allowedLine(index) || ranges.some(([start, end]) => index >= start && index <= end))
}

function propertyRanges(lines, agentId) {
  const escaped = agentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const property = new RegExp(`^\\s{2}(?:'${escaped}'|${escaped}):`)
  const nextProperty = /^\s{2}(?:'[A-Za-z][A-Za-z0-9]*'|[A-Za-z][A-Za-z0-9]*):/
  const ranges = []
  for (let start = 0; start < lines.length; start += 1) {
    if (!property.test(lines[start])) continue
    let end = start
    while (end + 1 < lines.length && !nextProperty.test(lines[end + 1]) && !/^}\s/.test(lines[end + 1]) && lines[end + 1] !== '}') end += 1
    ranges.push([start, end])
  }
  return ranges
}

function importAndCaseRanges(lines, agentId, agentSlug) {
  const ranges = []
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].includes(`'./calculation/agents/${agentSlug}'`)) {
      let start = index
      while (start > 0 && !/^import\b/.test(lines[start])) start -= 1
      ranges.push([start, index])
    }
    if (lines[index].match(new RegExp(`^\\s*case '${agentId}':\\s*$`))) {
      let end = index + 1
      while (end < lines.length && !/^\s*(?:case\s|default:)/.test(lines[end])) end += 1
      ranges.push([index, end - 1])
    }
  }
  return ranges
}

const FORBIDDEN_GLOBALS = new Set([
  'addEventListener', 'alert', 'cancelAnimationFrame', 'close', 'confirm', 'console', 'dispatchEvent',
  'document', 'eval', 'fetch', 'Function', 'globalThis', 'history', 'localStorage', 'location',
  'navigator', 'open', 'postMessage', 'print', 'process', 'prompt', 'queueMicrotask',
  'removeEventListener', 'requestAnimationFrame', 'Proxy', 'Reflect', 'sessionStorage', 'setImmediate',
  'setInterval', 'setTimeout', 'WebAssembly', 'WebSocket', 'window', 'Worker', 'XMLHttpRequest',
])

const AGENT_MODULE_IMPORTS = new Map([
  ['../../actions', new Set(['AFTERSHOCK_TARGET', 'actionForm', 'actionTarget', 'canonicalAction', 'sourceLocalAction'])],
  ['../../content', new Set([
    'DRIVE_DISC_FACTS', 'SOURCE_LABELS', 'VERTICAL_VALUES', 'W_ENGINES', 'W_ENGINE_FACTS',
    'equipmentEffectBaseValue', 'equipmentEffectMaximumValue', 'equipmentEffectProgressionIncrementValue',
    'equipmentEffectProgressionValue',
  ])],
  ['../../effects', new Set([
    'STATIC_SOURCES', 'active', 'additive', 'additiveMetricBundle', 'discSource', 'discStatInput',
    'effectiveSubstatInput', 'engineAdvancedInput', 'engineSource', 'mainStatInput', 'mindscapeSource',
    'perSecond', 'percentage', 'presentSetupInputs', 'pufferElectroFourPieceClauses',
    'resolveDeliveredClauses', 'source', 'withApplicability', 'withCandidatePressure',
  ])],
  ['../composition', new Set([
    'composeActionEffects', 'composeActionHierarchy', 'composeMetricEffects', 'contribution',
    'energyRegenProjection', 'percentageContribution', 'surfaces', 'withoutZero',
  ])],
  ['../initial-atk', new Set(['initialAtkFor'])],
  ['../result', new Set([
    'ActionModifier', 'AgentResult', 'Contribution', 'GaugeResult', 'ResultMetric', 'ResultOperation',
  ])],
  ['../rupture', new Set(['composeRuptureSheerForce'])],
])

const AGENT_PURE_IMPORT_CALLS = new Map([
  ['../../actions', new Set(['actionForm', 'actionTarget', 'canonicalAction', 'sourceLocalAction'])],
  ['../../content', new Set([
    'equipmentEffectBaseValue', 'equipmentEffectMaximumValue', 'equipmentEffectProgressionIncrementValue',
    'equipmentEffectProgressionValue',
  ])],
  ['../../effects', new Set([
    'active', 'additive', 'additiveMetricBundle', 'discSource', 'discStatInput', 'effectiveSubstatInput',
    'engineAdvancedInput', 'engineSource', 'mainStatInput', 'mindscapeSource', 'perSecond', 'percentage',
    'presentSetupInputs', 'pufferElectroFourPieceClauses', 'resolveDeliveredClauses', 'source',
    'withApplicability', 'withCandidatePressure',
  ])],
  ['../composition', new Set([
    'composeActionEffects', 'composeActionHierarchy', 'composeMetricEffects', 'contribution',
    'energyRegenProjection', 'percentageContribution', 'surfaces', 'withoutZero',
  ])],
  ['../initial-atk', new Set(['initialAtkFor'])],
  ['../rupture', new Set(['composeRuptureSheerForce'])],
])

const PURE_IDENTIFIER_CALLS = new Set(['Boolean', 'Number', 'String', 'parseFloat', 'parseInt'])

const DANGEROUS_PROPERTIES = new Set([
  '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__',
  '__proto__', 'arguments', 'callee', 'caller', 'constructor', 'prototype',
])

const PURE_INSTANCE_METHODS = new Set([
  'at', 'composeActionEffects', 'composeActionHierarchy', 'composeMetricEffects',
  'concat', 'dawnClauses', 'every', 'filter', 'find', 'flat', 'flatMap',
  'includes', 'join', 'map', 'optionalMetric', 'presentSetupInputs',
  'pufferElectroFourPieceClauses', 'reduce', 'replace', 'replaceAll',
  'resolveDeliveredClauses', 'slice', 'some', 'toFixed', 'toLowerCase',
  'toUpperCase', 'trim',
])

const PURE_STATIC_METHODS = new Map([
  ['Array', new Set(['isArray'])],
  ['Math', new Set(['abs', 'ceil', 'floor', 'max', 'min', 'round', 'trunc'])],
  ['Number', new Set(['isFinite', 'isInteger', 'isNaN'])],
  ['Object', new Set(['entries', 'hasOwn', 'keys', 'values'])],
])

const CALLBACK_POSITIONS = new Map([
  ['every', 0], ['filter', 0], ['find', 0], ['flatMap', 0], ['map', 0], ['reduce', 0],
  ['replace', 1], ['replaceAll', 1], ['some', 0],
])

function propertyName(node) {
  if (node?.computed === false && node.property?.type === 'Identifier') return node.property.name
  if (node?.computed === true && node.property?.type === 'Literal'
    && ['string', 'number'].includes(typeof node.property.value)) return String(node.property.value)
  return undefined
}

function rootIdentifier(node) {
  let current = node
  while (current && ['ChainExpression', 'MemberExpression', 'TSAsExpression', 'TSNonNullExpression', 'TSSatisfiesExpression', 'TSTypeAssertion'].includes(current.type)) {
    current = current.type === 'MemberExpression' ? current.object : current.expression
  }
  return current?.type === 'Identifier' ? current.name : undefined
}

function pureTopLevelInitializer(node) {
  if (!node) return true
  if (['Literal', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) return true
  if (node.type === 'TemplateLiteral') return node.expressions.length === 0
  if (node.type === 'UnaryExpression') return ['+', '-', '!', '~', 'void'].includes(node.operator) && pureTopLevelInitializer(node.argument)
  if (node.type === 'ArrayExpression') return node.elements.every((item) => item === null || pureTopLevelInitializer(item))
  if (node.type === 'ObjectExpression') return node.properties.every((item) => item.type === 'Property'
    && item.computed === false && item.kind === 'init' && pureTopLevelInitializer(item.value))
  return false
}

function safeTopLevelStatement(statement) {
  if (statement.type === 'ImportDeclaration') {
    const allowed = AGENT_MODULE_IMPORTS.get(statement.source?.value)
    return allowed && statement.specifiers.length > 0 && statement.specifiers.every((specifier) => (
      specifier.type === 'ImportSpecifier' && allowed.has(specifier.imported?.name ?? specifier.imported?.value)
    ))
  }
  if (['FunctionDeclaration', 'TSInterfaceDeclaration', 'TSTypeAliasDeclaration'].includes(statement.type)) return true
  if (statement.type === 'VariableDeclaration') return statement.declarations.every(({ init }) => pureTopLevelInitializer(init))
  if (statement.type === 'ExportNamedDeclaration') {
    if (!statement.declaration) return statement.source === null
    return safeTopLevelStatement(statement.declaration)
  }
  return false
}

function safeMemberCall(callee) {
  const property = propertyName(callee)
  if (!property || DANGEROUS_PROPERTIES.has(property)) return false
  const root = rootIdentifier(callee)
  if (PURE_STATIC_METHODS.has(root)) return PURE_STATIC_METHODS.get(root).has(property)
  if (['Array', 'Math', 'Number', 'Object'].includes(root)) return false
  return PURE_INSTANCE_METHODS.has(property)
}

function unwrapExpression(node) {
  let current = node
  while (['ChainExpression', 'TSAsExpression', 'TSNonNullExpression', 'TSSatisfiesExpression', 'TSTypeAssertion'].includes(current?.type)) {
    current = current.expression
  }
  return current
}

function safeCallback(node, allowedCalls) {
  const callback = unwrapExpression(node)
  if (['ArrowFunctionExpression', 'FunctionExpression'].includes(callback?.type)) return true
  return callback?.type === 'Identifier' && allowedCalls.has(callback.name)
}

function safeCallbackOrLiteral(node, allowedCalls, allowLiteral) {
  const callback = unwrapExpression(node)
  if (allowLiteral && (callback?.type === 'Literal'
    || (callback?.type === 'TemplateLiteral' && callback.expressions.length === 0))) return true
  return safeCallback(callback, allowedCalls)
}

function bindingNames(node) {
  if (!node) return []
  if (node.type === 'Identifier') return [node.name]
  if (node.type === 'RestElement') return bindingNames(node.argument)
  if (node.type === 'AssignmentPattern') return bindingNames(node.left)
  if (node.type === 'ArrayPattern') return node.elements.flatMap(bindingNames)
  if (node.type === 'ObjectPattern') return node.properties.flatMap((property) => (
    property.type === 'RestElement' ? bindingNames(property.argument) : bindingNames(property.value)
  ))
  return []
}

function allowedIdentifierCalls(program) {
  const allowed = new Set(PURE_IDENTIFIER_CALLS)
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'ImportDeclaration') {
      const pure = AGENT_PURE_IMPORT_CALLS.get(node.source?.value) ?? new Set()
      for (const specifier of node.specifiers ?? []) {
        if (specifier.type === 'ImportSpecifier'
          && pure.has(specifier.imported?.name ?? specifier.imported?.value)) allowed.add(specifier.local.name)
      }
    }
    if (node.type === 'FunctionDeclaration' && node.id?.type === 'Identifier') allowed.add(node.id.name)
    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier'
      && ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.init?.type)) allowed.add(node.id.name)
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(program)
  return allowed
}

function walksSafely(node, allowedCalls) {
  if (!node || typeof node !== 'object') return true
  if (['ArrayPattern', 'AssignmentPattern', 'ForInStatement', 'ForOfStatement', 'ObjectPattern'].includes(node.type)) return false
  if (['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression'].includes(node.type)
    && (node.params ?? []).flatMap(bindingNames).some((name) => allowedCalls.has(name))) return false
  if (node.type === 'VariableDeclarator' && bindingNames(node.id).some((name) => allowedCalls.has(name))
    && !['ArrowFunctionExpression', 'FunctionExpression'].includes(node.init?.type)) return false
  if (node.type === 'CatchClause' && bindingNames(node.param).some((name) => allowedCalls.has(name))) return false
  if (node.type === 'MemberExpression') {
    const property = propertyName(node)
    if (!property || DANGEROUS_PROPERTIES.has(property)) return false
    const root = rootIdentifier(node)
    if (PURE_STATIC_METHODS.has(root) && !PURE_STATIC_METHODS.get(root).has(property)) return false
  }
  if (['AssignmentExpression', 'UpdateExpression'].includes(node.type)) return false
  if (node.type === 'UnaryExpression' && node.operator === 'delete') return false
  if (['ImportExpression', 'MetaProperty', 'NewExpression', 'TaggedTemplateExpression'].includes(node.type)) return false
  if (node.type === 'Identifier' && FORBIDDEN_GLOBALS.has(node.name)) return false
  if (node.type === 'CallExpression') {
    const callee = node.callee
    if (callee?.type === 'Identifier' && !allowedCalls.has(callee.name)) return false
    if (!['Identifier', 'MemberExpression'].includes(callee?.type)) return false
    if (callee.type === 'MemberExpression' && !safeMemberCall(callee)) return false
    const callbackMethod = callee.type === 'MemberExpression' ? propertyName(callee) : undefined
    if (CALLBACK_POSITIONS.has(callbackMethod)) {
      const position = CALLBACK_POSITIONS.get(callbackMethod)
      const allowLiteral = callbackMethod === 'replace' || callbackMethod === 'replaceAll'
      if (!safeCallbackOrLiteral(node.arguments[position], allowedCalls, allowLiteral)) return false
    }
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      if (!value.every((child) => walksSafely(child, allowedCalls))) return false
    } else if (value && typeof value === 'object' && !walksSafely(value, allowedCalls)) return false
  }
  return true
}

function agentModuleIsStructurallyLocal(source) {
  let program
  try {
    program = parseAst(source, { lang: 'ts' })
  } catch {
    return false
  }
  return program.body.length > 0 && program.body.every(safeTopLevelStatement)
    && walksSafely(program, allowedIdentifierCalls(program))
}

function propertyKey(node) {
  if (node?.computed === false && node.key?.type === 'Identifier') return node.key.name
  if (node?.computed === false && node.key?.type === 'Literal' && typeof node.key.value === 'string') return node.key.value
  return undefined
}

function stringArray(node) {
  if (node?.type !== 'ArrayExpression' || node.elements.some((item) => item?.type !== 'Literal' || typeof item.value !== 'string')) {
    return undefined
  }
  return node.elements.map(({ value }) => value)
}

function variableDeclaratorByName(program, name) {
  const declarations = []
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier' && node.id.name === name) declarations.push(node)
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(program)
  return declarations.length === 1 ? declarations[0] : null
}

function objectPropertyValue(objectExpression, property) {
  return objectPropertyNode(objectExpression, property)?.value
}

function objectPropertyNode(objectExpression, property) {
  if (objectExpression?.type !== 'ObjectExpression') return undefined
  const matches = objectExpression.properties.filter((item) => item.type === 'Property' && propertyKey(item) === property)
  return matches.length === 1 ? matches[0] : undefined
}

function agentSetupCandidatePropertyNodes(source, agentId) {
  let program
  try {
    program = parseAst(source, { lang: 'ts' })
  } catch {
    return undefined
  }
  const owners = ['ENGINE_CANDIDATES_BY_AGENT', 'DISC_IDS_BY_AGENT_AND_PIECE']
  const nodes = owners.map((owner) => {
    const declaration = variableDeclaratorByName(program, owner)
    return objectPropertyNode(declaration?.init, agentId)
  })
  return nodes.every((node) => Number.isInteger(node?.start) && Number.isInteger(node?.end))
    ? nodes
    : undefined
}

function addedLinesStayInsideNodes(source, addedLineIndexes, nodes) {
  const lines = source.split('\n')
  const lineStarts = []
  let offset = 0
  for (const line of lines) {
    lineStarts.push(offset)
    offset += line.length + 1
  }
  return addedLineIndexes.every((lineIndex) => {
    const start = lineStarts[lineIndex]
    if (!Number.isInteger(start)) return false
    const end = start + lines[lineIndex].length
    for (let index = start; index < end; index += 1) {
      const character = source[index]
      if (/\s/.test(character) || character === ',') continue
      if (!nodes.some((node) => index >= node.start && index < node.end)) return false
    }
    return true
  })
}

function engineCandidateIds(node) {
  if (node?.type !== 'ArrayExpression') return undefined
  const engineIds = []
  for (const element of node.elements) {
    if (element?.type === 'Literal' && typeof element.value === 'string') {
      engineIds.push(element.value)
      continue
    }
    return undefined
  }
  return engineIds
}

function agentEngineMembershipIdsFromCandidatesSource(source, agentId) {
  let program
  try {
    program = parseAst(source, { lang: 'ts' })
  } catch {
    return undefined
  }
  const declaration = variableDeclaratorByName(program, 'ENGINE_CANDIDATES_BY_AGENT')
  return engineCandidateIds(objectPropertyValue(declaration?.init, agentId))
}

function agentDiscMembershipIdsFromCandidatesSource(source, agentId) {
  let program
  try {
    program = parseAst(source, { lang: 'ts' })
  } catch {
    return undefined
  }
  const declaration = variableDeclaratorByName(program, 'DISC_IDS_BY_AGENT_AND_PIECE')
  const value = objectPropertyValue(declaration?.init, agentId)
  if (value?.type !== 'ObjectExpression') return undefined
  if (value.properties.length !== 2 || value.properties.some((item) => (
    item.type !== 'Property'
    || item.computed
    || item.kind !== 'init'
    || item.method
    || item.shorthand
  ))) return undefined
  const pieces = new Map(value.properties.map((item) => [propertyKey(item), stringArray(item.value)]))
  if (pieces.size !== 2 || !pieces.has('fourPiece') || !pieces.has('twoPiece')
    || !pieces.get('fourPiece') || !pieces.get('twoPiece')) return undefined
  return [...pieces.get('fourPiece'), ...pieces.get('twoPiece')]
}

async function fetchBlobText(api, entry) {
  if (!entry || entry.type !== 'blob') return null
  const blob = await api.json(`/repos/${REPOSITORY}/git/blobs/${entry.sha}`)
  if (blob?.encoding !== 'base64' || typeof blob?.content !== 'string'
    || !Number.isInteger(blob?.size) || blob.size > 1_000_000) fail('Git blob is unavailable or too large for structural inspection.')
  const decoded = Buffer.from(blob.content.replaceAll('\n', ''), 'base64')
  if (decoded.byteLength !== blob.size) fail('Git blob size does not match its trusted metadata.')
  return decoded.toString('utf8')
}

/**
 * The trusted parser recognizes one deliberately narrow, additive registration
 * shape. Anything outside these real seams remains protected.
 */
export async function deriveStructuralFacts({ treeDiff, readText }) {
  const production = treeDiff.entries.filter(({ path: filePath }) => categoryForPath(filePath) === 'production-test')
  if (production.length === 0) return undefined
  const byPath = new Map(treeDiff.entries.map((entry) => [entry.path, entry]))
  const typesEntry = byPath.get('src/workbench/content/types.ts')
  const candidatesEntry = byPath.get('src/workbench/content/agent-setup-candidates.ts')
  if (!typesEntry?.base || !typesEntry.head) return undefined
  if (!candidatesEntry?.base || !candidatesEntry.head) return undefined
  const [baseTypes, headTypes, candidateHeadSource] = await Promise.all([
    readText(typesEntry.base),
    readText(typesEntry.head),
    readText(candidatesEntry.head),
  ])
  const baseAgents = unionMembers(baseTypes, 'AgentId')
  const headAgents = unionMembers(headTypes, 'AgentId')
  if (!baseAgents || !headAgents) return undefined
  const addedAgents = headAgents.filter((id) => !baseAgents.includes(id))
  if (addedAgents.length !== 1 || baseAgents.some((id) => !headAgents.includes(id))) return undefined
  const newAgentId = addedAgents[0]
  const moduleEntries = production.filter(({ path: filePath, base, head }) => (
    !base && head && /^src\/workbench\/calculation\/agents\/[a-z0-9]+(?:-[a-z0-9]+)*\.ts$/.test(filePath)
  ))
  if (moduleEntries.length !== 1) return undefined
  const agentSlug = path.basename(moduleEntries[0].path, '.ts')
  const facts = []
  const baseEngineIds = unionMembers(baseTypes, 'EngineId') ?? []
  const baseDiscIds = unionMembers(baseTypes, 'DiscId') ?? []
  const headEngineIds = unionMembers(headTypes, 'EngineId') ?? []
  const headDiscIds = unionMembers(headTypes, 'DiscId') ?? []
  const existingEquipmentIds = [...baseEngineIds, ...baseDiscIds]
  const addedEquipment = [
    ...headEngineIds.filter((id) => !baseEngineIds.includes(id)).map((id) => ({ id, kind: 'w-engines' })),
    ...headDiscIds.filter((id) => !baseDiscIds.includes(id)).map((id) => ({ id, kind: 'drive-discs' })),
  ]
  if (baseEngineIds.some((id) => !headEngineIds.includes(id)) || baseDiscIds.some((id) => !headDiscIds.includes(id))) return undefined
  const candidateEngineMembership = agentEngineMembershipIdsFromCandidatesSource(candidateHeadSource, newAgentId)
  const candidateDiscMembership = agentDiscMembershipIdsFromCandidatesSource(candidateHeadSource, newAgentId)
  if (!candidateEngineMembership || !candidateDiscMembership) return undefined
  const verifiedEngineMembership = [...new Set(candidateEngineMembership)]
  const verifiedDiscMembership = [...new Set(candidateDiscMembership)]
  if (verifiedEngineMembership.length !== candidateEngineMembership.length
    || verifiedEngineMembership.some((id) => !headEngineIds.includes(id))
    || candidateDiscMembership.some((id) => !headDiscIds.includes(id))) return undefined
  if (verifiedEngineMembership.length === 0 || verifiedDiscMembership.length === 0) return undefined

  for (const entry of production) {
    const { path: filePath, base, head } = entry
    if (!head || head.type !== 'blob') return undefined
    const equipmentAsset = addedEquipment.find(({ kind }) => filePath.startsWith(`src/assets/equipment/${kind}/`))
    if (!base && equipmentAsset) {
      const expectedSlug = equipmentAsset.id.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
      if (filePath !== `src/assets/equipment/${equipmentAsset.kind}/${expectedSlug}.webp`) return undefined
      facts.push({ path: filePath, kind: 'equipment-asset-addition', operation: 'additive', equipmentIds: [equipmentAsset.id] })
      continue
    }
    if (entry === moduleEntries[0]) {
      if (!agentModuleIsStructurallyLocal(await readText(head))) return undefined
      facts.push({ path: filePath, kind: 'agent-calculation-module-addition', operation: 'additive', agentIds: [newAgentId] })
      continue
    }
    const [baseSource, headSource] = await Promise.all([
      base ? readText(base) : Promise.resolve(''),
      readText(head),
    ])
    const additive = additiveLineIndexes(baseSource, headSource)
    if (!additive) return undefined
    const { lines, added } = additive
    if (filePath === 'src/workbench/content/types.ts') {
      const allowedValues = new Set([newAgentId, ...addedEquipment.map(({ id }) => id)])
      const allowed = added.every((index) => lines[index].trim() === ''
        || [...allowedValues].some((id) => lines[index].trim() === `| '${id}'`))
      if (!allowed) return undefined
      facts.push({ path: filePath, kind: 'agent-id-union-addition', operation: 'additive', agentIds: [newAgentId] })
      for (const { id } of addedEquipment) {
        facts.push({ path: filePath, kind: 'equipment-id-addition', operation: 'additive', equipmentIds: [id] })
      }
      continue
    }
    if (filePath === 'src/workbench/content/agents.ts') {
      const idLine = lines.findIndex((line) => line.includes(`id: '${newAgentId}'`))
      if (idLine < 0) return undefined
      let start = idLine
      while (start > 0 && lines[start].trim() !== '{') start -= 1
      let end = idLine
      while (end < lines.length && !/^\s*},?\s*$/.test(lines[end])) end += 1
      if (!additionsStayInside(added, [[start, end]], (index) => lines[index].trim() === '')) return undefined
      facts.push({ path: filePath, kind: 'agent-summary-addition', operation: 'additive', agentIds: [newAgentId] })
      continue
    }
    if (filePath === 'src/workbench/calculate.ts' || filePath === 'src/workbench/provider-effects.ts') {
      const ranges = importAndCaseRanges(lines, newAgentId, agentSlug)
      if (ranges.length < 2 || !additionsStayInside(added, ranges, (index) => lines[index].trim() === '')) return undefined
      facts.push({ path: filePath, kind: 'agent-import-and-switch-addition', operation: 'additive', agentIds: [newAgentId] })
      continue
    }
    if (filePath === 'src/workbench/content/agent-setup-candidates.ts') {
      const nodes = agentSetupCandidatePropertyNodes(headSource, newAgentId)
      if (!nodes || !addedLinesStayInsideNodes(headSource, added, nodes)) return undefined
      facts.push({
        path: filePath, kind: 'agent-equipment-membership-addition', operation: 'additive',
        agentIds: [newAgentId],
        equipmentIds: verifiedEngineMembership,
      })
      facts.push({
        path: filePath, kind: 'agent-equipment-membership-addition', operation: 'additive',
        agentIds: [newAgentId],
        equipmentIds: verifiedDiscMembership,
      })
      continue
    }
    if (filePath === 'src/workbench/content/engines.ts' || filePath === 'src/workbench/content/discs.ts') {
      const localEquipment = addedEquipment.filter(({ kind }) => filePath.includes(kind === 'w-engines' ? 'engines' : 'discs'))
      const ranges = []
      for (const { id } of localEquipment) ranges.push(...propertyRanges(lines, id))
      for (let index = 0; index < lines.length; index += 1) {
        for (const { id, kind } of localEquipment) {
          const slug = id.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
          if (lines[index].includes(`../../assets/equipment/${kind}/${slug}.webp`)) ranges.push([index, index])
        }
      }
      if (localEquipment.length === 0) return undefined
      if (!additionsStayInside(added, ranges, (index) => lines[index].trim() === '')) return undefined
      const candidateMembership = filePath.endsWith('engines.ts')
        ? verifiedEngineMembership
        : verifiedDiscMembership
      if (localEquipment.some(({ id }) => !candidateMembership.includes(id))) return undefined
      for (const { id } of localEquipment) {
        const occurrences = propertyRanges(lines, id)
        if (occurrences.length < 2) return undefined
        facts.push({ path: filePath, kind: 'equipment-fact-addition', operation: 'additive', equipmentIds: [id] })
        facts.push({ path: filePath, kind: 'equipment-choice-addition', operation: 'additive', equipmentIds: [id] })
      }
      continue
    }
    if (['src/workbench/content/setup-options.ts', 'src/workbench/content/representatives.ts', 'src/workbench/content/retained-values.ts'].includes(filePath)) {
      const ranges = propertyRanges(lines, newAgentId)
      if (filePath.endsWith('representatives.ts')) {
        ranges.push(...rangesContainingLine(
          lines,
          (line) => line.startsWith(`const ${newAgentId}Representative`),
          (line, index, start) => index > start && /^}\)\s*$/.test(line),
        ))
      }
      const prefix = new RegExp(`^\\s{2}${newAgentId}[A-Z][A-Za-z0-9]*:`)
      if (ranges.length === 0 || !additionsStayInside(added, ranges, (index) => lines[index].trim() === '' || prefix.test(lines[index]))) return undefined
      facts.push({ path: filePath, kind: 'agent-owned-record-entry', operation: 'additive', agentIds: [newAgentId] })
      continue
    }
    if (/\.test\.[cm]?[jt]sx?$/.test(filePath)) {
      facts.push({ path: filePath, kind: 'test-additions-only', operation: 'additive', agentIds: [newAgentId] })
      continue
    }
    return undefined
  }
  return { newAgentId, agentSlug, existingEquipmentIds, files: facts }
}

async function readBaseAcrState(baseTree, readText, knownRuleIds) {
  const records = []
  for (const [filePath, entry] of baseTree) {
    if (!filePath.startsWith('docs/authority-changes/') || filePath.endsWith('/README.md')) continue
    const source = await readText(entry)
    const record = parseAcrDocument(filePath, source, { knownRuleIds })
    records.push(record)
  }
  validateAcrStates(records)
  return {
    records,
    accepted: records.filter(({ status }) => status === 'accepted')
      .map(({ id, ruleIds }) => ({ id, ruleIds }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  }
}

export async function buildCurrentSnapshot({
  api,
  prNumber,
  root = process.cwd(),
  readFile = fs.readFile,
  includeWorkflows = true,
  expectedBaseSha,
}) {
  const pr = await api.json(`/repos/${REPOSITORY}/pulls/${prNumber}`)
  assertPullRequest(pr, prNumber)
  await assertUniqueHeadLifecycle(api, pr)
  if (expectedBaseSha && pr.base.sha !== expectedBaseSha) {
    throw new StaleEvaluatorError('Trusted evaluator revision no longer matches the pull request base.')
  }
  const [baseTree, headTree, comments, reviews, workflowState, ruleState, mechanismDigest] = await Promise.all([
    fetchTreeMap(api, pr.base.sha),
    fetchTreeMap(api, pr.head.sha),
    api.paginate(`/repos/${REPOSITORY}/issues/${prNumber}/comments`),
    api.paginate(`/repos/${REPOSITORY}/pulls/${prNumber}/reviews`),
    includeWorkflows ? fetchWorkflowRuns(api, pr) : Promise.resolve({ runs: [] }),
    readTrustedRuleState(readFile, root),
    readMechanismDigest(readFile, root),
  ])
  const treeDiff = canonicalTreeDiff(exactTreeDiff(baseTree, headTree))
  const readText = (entry) => fetchBlobText(api, entry)
  const policy = await derivePolicyState({
    treeDiff, body: pr.body ?? '', readText, baseTree, ruleState,
  })
  const notApplicable = await notApplicableScopeForDiff({ treeDiff, baseTree, headTree, readText })
  return {
    prNumber,
    baseSha: pr.base.sha,
    headSha: pr.head.sha,
    body: pr.body ?? '',
    diffDigest: treeDiff.digest,
    classification: policy.classification.classification,
    classificationReason: policy.classification.reason,
    declarationMismatch: policy.classification.declarationMismatch,
    classificationError: policy.classificationError,
    changeCategories: policy.classification.matrix?.categories ?? [],
    changedPaths: policy.paths,
    ...notApplicable,
    acceptedAcrRecords: policy.acrState.accepted,
    acrBaseRecords: policy.acrState.records,
    acrTransaction: policy.acrTransaction,
    identifierOnlyOwnerChange: policy.identifierOnlyOwnerChange,
    ownerCorrection: policy.ownerCorrection,
    mechanismDigest,
    knownRuleIds: ruleState.currentRuleIds,
    acrKnownRuleIds: ruleState.knownRuleIds,
    comments: comments.map(normalizeComment),
    reviews: reviews.map(normalizeReview),
    runs: workflowState.runs,
    prValidationWorkflowId: workflowState.prValidationWorkflowId,
    visualWorkflowId: workflowState.visualWorkflowId,
    updatedAt: pr.updated_at,
  }
}

export function evaluateSnapshot(snapshot) {
  if (snapshot.classificationError) throw new PolicyError(snapshot.classificationError)
  if (snapshot.declarationMismatch) throw new PolicyError('Pull request classification attempts to lower trusted protection.')
  return trustedDecision(snapshot)
}

function evaluateEvidence(snapshot, comments) {
  if (snapshot.classificationError) throw new PolicyError(snapshot.classificationError)
  if (snapshot.declarationMismatch) throw new PolicyError('Pull request classification attempts to lower trusted protection.')
  const trace = validateAuthorityTrace(parseAuthorityTrace(snapshot.body), {
    knownRuleIds: snapshot.knownRuleIds,
    computedClassification: snapshot.classification,
    changeCategories: snapshot.changeCategories,
    acceptedAcrRecords: snapshot.acceptedAcrRecords,
    changedPaths: snapshot.changedPaths,
    identifierOnlyOwnerChange: snapshot.identifierOnlyOwnerChange,
    ownerCorrection: snapshot.ownerCorrection,
    acrTransaction: snapshot.acrTransaction,
    acrBaseRecords: snapshot.acrBaseRecords,
    acrKnownRuleIds: snapshot.acrKnownRuleIds,
  })
  const evidence = validateReviewEvidence(comments, {
    prNumber: snapshot.prNumber,
    baseSha: snapshot.baseSha,
    headSha: snapshot.headSha,
    diffDigest: snapshot.diffDigest,
    classification: snapshot.classification,
    traceDigest: authorityTraceDigest(trace),
    mechanismDigest: snapshot.mechanismDigest,
    ruleIds: trace.ruleIds,
    consumers: trace.consumers,
  })
  return { trace, evidence, targetSha: snapshot.headSha }
}

export function evaluateProposedEvidenceSnapshot(snapshot, { body, publishedAt }) {
  return evaluateEvidence(snapshot, [{
    id: 'proposed',
    author: REVIEW_APP_AUTHOR,
    body,
    createdAt: publishedAt,
    updatedAt: publishedAt,
  }])
}

export function evaluatePublishedEvidenceSnapshot(snapshot, { body, publishedAt, commentId }) {
  const marked = snapshot.comments.filter(({ body: commentBody }) => (
    typeof commentBody === 'string' && commentBody.includes(EVIDENCE_MARKER)
  ))
  const actualPublishedAt = marked[0]?.updatedAt ?? marked[0]?.createdAt
  if (marked.length !== 1 || marked[0].id !== commentId || marked[0].author !== REVIEW_APP_AUTHOR
    || marked[0].body !== body || actualPublishedAt !== publishedAt) {
    fail('Published review evidence does not match the verified mutation result.')
  }
  return evaluateEvidence(snapshot, snapshot.comments)
}

export function evaluateEvidenceSnapshot(snapshot) {
  const { trace, evidence, targetSha } = evaluateEvidence(snapshot, snapshot.comments)
  const approval = validateProtectedApproval(snapshot.reviews, {
    classification: snapshot.classification,
    headSha: snapshot.headSha,
    evidenceUpdatedAt: evidence.updatedAt,
  })
  return { trace, evidence, approval, targetSha }
}

export async function postCommitStatus(api, { sha, context, state, description, targetUrl }) {
  if (!SHA.test(sha ?? '') || !['success', 'failure', 'pending', 'error'].includes(state)) fail()
  await api.json(`/repos/${REPOSITORY}/statuses/${sha}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, context, description, target_url: targetUrl }),
  })
}

export async function evaluateAndPublish({
  prNumber,
  api,
  root = process.cwd(),
  readFile = fs.readFile,
  targetUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : undefined,
  snapshotProvider = buildCurrentSnapshot,
  statusWriter = postCommitStatus,
  trustedBaseSha,
}) {
  const readSnapshot = async () => {
    try {
      return await snapshotProvider({ api, prNumber, root, readFile, expectedBaseSha: trustedBaseSha })
    } catch (error) {
      if (error instanceof StaleEvaluatorError) return null
      throw error
    }
  }
  const initial = await readSnapshot()
  if (!initial || (trustedBaseSha && initial.baseSha !== trustedBaseSha)) {
    return { posted: false, stale: true, reason: 'Trusted evaluator revision does not match the pull request base.' }
  }
  const initialVersion = governanceSnapshotVersion(initial)
  const current = await readSnapshot()
  if (!current) return { posted: false, stale: true, reason: 'Trusted evaluator revision changed during evaluation.' }
  if (governanceSnapshotVersion(current) !== initialVersion) {
    return { posted: false, stale: true, reason: 'Current pull request state changed during evaluation.' }
  }
  const stillCurrent = async () => {
    const latest = await readSnapshot()
    if (!latest) return false
    if (trustedBaseSha && latest.baseSha !== trustedBaseSha) return false
    return governanceSnapshotVersion(latest) === initialVersion
  }
  const write = async (context, state, description, statusTargetUrl = targetUrl) => {
    if (!await stillCurrent()) return false
    await statusWriter(api, { sha: current.headSha, context, state, description, targetUrl: statusTargetUrl })
    return true
  }
  for (const context of ['Trusted Governance', 'Protected Approval']) {
    if (!await write(context, 'pending', 'Trusted governance is evaluating the current PR state.')) {
      return { posted: false, stale: true, reason: 'Current pull request state changed before status invalidation.' }
    }
  }
  let decision
  let governanceFailure
  try {
    decision = evaluateSnapshot(initial)
  } catch (error) {
    governanceFailure = error instanceof Error ? error.message : 'Trusted governance failed.'
    decision = {
      targetSha: initial.headSha,
      statuses: { 'Trusted Governance': 'failure', 'Protected Approval': 'failure' },
    }
  }
  const states = decision.statuses
  try {
    const governanceBinding = governanceFailure ? null : governanceSuccessBinding(current, decision, targetUrl)
    if (!await write('Protected Approval', states['Protected Approval'], states['Protected Approval'] === 'success'
      ? 'Current protection approval requirement is satisfied.'
      : 'Current product-owner approval is required.')) {
      return { posted: false, stale: true, reason: 'Current pull request state changed before approval status write.' }
    }
    if (!await write('Trusted Governance', states['Trusted Governance'], governanceFailure
      ? 'Trusted policy rejected the current PR state.'
      : governanceBinding.description, governanceFailure
      ? targetUrl
      : governanceBinding.targetUrl)) {
      return { posted: false, stale: true, reason: 'Current pull request state changed before governance status write.' }
    }
  } catch (error) {
    for (const context of ['Protected Approval', 'Trusted Governance']) {
      try {
        await statusWriter(api, { sha: current.headSha, context, state: 'failure', description: 'Trusted status publication did not complete.', targetUrl })
      } catch {}
    }
    throw error
  }
  return { posted: true, stale: false, decision, governanceFailure }
}

export async function evaluate({ prNumber, token = process.env.GITHUB_TOKEN, fetchImpl = fetch, root, readFile }) {
  const api = createApi({ token, fetchImpl })
  const snapshot = await buildCurrentSnapshot({ api, prNumber, root, readFile })
  return { snapshot, version: governanceSnapshotVersion(snapshot), decision: evaluateSnapshot(snapshot) }
}

export async function evaluateMergePreflight({ prNumber, token, fetchImpl = fetch, root, readFile, trustedBaseSha }) {
  const api = createApi({ token, fetchImpl })
  const first = await buildCurrentSnapshot({
    api, prNumber, root, readFile, includeWorkflows: false, expectedBaseSha: trustedBaseSha,
  })
  const version = governanceSnapshotVersion(first)
  const decision = evaluateEvidenceSnapshot(first)
  const current = await buildCurrentSnapshot({
    api, prNumber, root, readFile, includeWorkflows: false, expectedBaseSha: trustedBaseSha,
  })
  if (governanceSnapshotVersion(current) !== version || current.headSha !== decision.targetSha) {
    fail('Governance state changed during merge preflight.')
  }
  evaluateEvidenceSnapshot(current)
  return { snapshot: current, version, decision }
}

export async function evaluateEvidenceUpsertPreflight({
  prNumber,
  proposedBody,
  token,
  fetchImpl = fetch,
  root,
  readFile,
  trustedBaseSha,
  publishedAt,
  publishedCommentId,
}) {
  const api = createApi({ token, fetchImpl })
  const proposedPublishedAt = publishedAt ?? new Date().toISOString()
  const evaluateCandidate = (snapshot) => publishedAt === undefined
    ? evaluateProposedEvidenceSnapshot(snapshot, { body: proposedBody, publishedAt: proposedPublishedAt })
    : evaluatePublishedEvidenceSnapshot(snapshot, {
      body: proposedBody, publishedAt, commentId: publishedCommentId,
    })
  const first = await buildCurrentSnapshot({
    api, prNumber, root, readFile, includeWorkflows: false, expectedBaseSha: trustedBaseSha,
  })
  const version = governanceSnapshotVersion(first)
  const decision = evaluateCandidate(first)
  const current = await buildCurrentSnapshot({
    api, prNumber, root, readFile, includeWorkflows: false, expectedBaseSha: trustedBaseSha,
  })
  if (governanceSnapshotVersion(current) !== version || current.headSha !== decision.targetSha) {
    fail('Governance state changed during evidence preflight.')
  }
  evaluateCandidate(current)
  return { snapshot: current, version, decision }
}

export async function evaluatePullRequestBatch({ prNumbers, evaluate, onFailure = async () => {} }) {
  const results = []
  const failures = []
  for (const prNumber of prNumbers) {
    try {
      results.push(await evaluate(prNumber))
    } catch (error) {
      failures.push({ prNumber, error })
      try { await onFailure(prNumber, error) } catch {}
    }
  }
  return { results, failures }
}

export async function publishEvaluationFailure(api, prNumber, trustedBaseSha) {
  const pr = await api.json(`/repos/${REPOSITORY}/pulls/${prNumber}`)
  if (pr?.base?.ref !== PROTECTED_BASE || pr?.base?.repo?.full_name !== REPOSITORY
    || pr?.head?.repo?.full_name !== REPOSITORY || !SHA.test(pr?.head?.sha ?? '')
    || !SHA.test(trustedBaseSha ?? '') || pr?.base?.sha !== trustedBaseSha) return false
  for (const context of ['Protected Approval', 'Trusted Governance']) {
    await postCommitStatus(api, {
      sha: pr.head.sha,
      context,
      state: 'failure',
      description: 'Trusted evaluation did not complete for this pull request.',
    })
  }
  return true
}

export async function runEvent({
  eventName = process.env.GITHUB_EVENT_NAME,
  eventPath = process.env.GITHUB_EVENT_PATH,
  token = process.env.GITHUB_TOKEN,
  trustedBaseSha = process.env.TRUSTED_BASE_SHA,
  fetchImpl = fetch,
  root = process.cwd(),
  readFile = fs.readFile,
}) {
  if (!SHA.test(trustedBaseSha ?? '')) fail('Trusted evaluator base SHA is unavailable.')
  if (!eventPath || !path.isAbsolute(eventPath)) fail('GitHub event path is invalid.')
  let event
  try {
    event = JSON.parse(await readFile(eventPath, 'utf8'))
  } catch {
    fail('GitHub event is invalid.')
  }
  const api = createApi({ token, fetchImpl })
  const prNumbers = await resolveEventPullRequests({ eventName, event, api })
  const batch = await evaluatePullRequestBatch({
    prNumbers,
    evaluate: (prNumber) => evaluateAndPublish({ prNumber, api, root, readFile, trustedBaseSha }),
    onFailure: (prNumber) => publishEvaluationFailure(api, prNumber, trustedBaseSha),
  })
  if (batch.failures.length > 0) fail(`Trusted governance failed for ${batch.failures.length} pull request(s).`)
  return batch.results
}

async function main() {
  try {
    const [command] = process.argv.slice(2)
    if (command === 'event') {
      const results = await runEvent({})
      process.stdout.write(`Trusted governance evaluated ${results.length} pull request(s).\n`)
      return
    }
    if (command === 'finalization') {
      const api = createApi({ token: process.env.GITHUB_TOKEN })
      const result = await verifyRemoteFinalization({
        api,
        actor: process.env.ACTOR,
        candidateSha: process.env.CANDIDATE_SHA,
      })
      process.stdout.write(`Recovery finalization verified PR #${result.creatingPr} at ${result.candidateSha}.\n`)
      return
    }
    fail('Trusted GitHub command is not allowlisted.')
  } catch {
    process.stderr.write('Trusted GitHub evaluation failed.\n')
    process.exitCode = 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
