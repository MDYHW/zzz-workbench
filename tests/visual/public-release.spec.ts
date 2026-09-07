import { createHash } from 'node:crypto'
import path from 'node:path'
import { openInitialWorkbench, openWorkbench } from './support/workbench-page'
import { expect, test } from './support/visual-test'
import {
  REQUIRED_FOOTER_DIGEST,
  acceptPreparedArtifact,
  buildCandidateArtifact,
  readArtifactTree,
} from '../../scripts/github-app/public-release-artifact.mjs'
import {
  APP_PERMISSION_PROFILES,
  GITHUB_API_VERSION,
  GITHUB_CONFIG_SCHEMA,
  publishArtifactTree,
} from '../../scripts/github-app/public-release-github.mjs'
import { sanitizeRasterMetadata } from '../../scripts/github-app/public-raster-metadata.js'

const releaseViewports = [
  { width: 1440, height: 800 },
  { width: 375, height: 800 },
] as const

const exactCsp = "default-src 'none'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'none'; frame-src 'none'; img-src 'self' data:; manifest-src 'self'; media-src 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'none'"

let admittedRuntimeEntries: Array<{ path: string, size: number, sha256: string }>

const fixtureDigest = (character: string) => `sha256:${character.repeat(64)}`
const fixtureSha = (character: string) => character.repeat(40)

function publicationConfig() {
  return {
    schema: GITHUB_CONFIG_SCHEMA,
    apiVersion: GITHUB_API_VERSION,
    destination: { owner: 'neutral-workbench', repository: 'neutral-workbench.github.io', branch: 'main' },
    apps: {
      bootstrap: {
        appId: 101, installationId: 201, owner: 'neutral-workbench',
        botLogin: 'neutral-bootstrap[bot]', keyPath: path.resolve('/release-secrets/bootstrap.pem'),
      },
      publisher: {
        appId: 102, installationId: 202, owner: 'neutral-workbench',
        botLogin: 'neutral-publisher[bot]', keyPath: path.resolve('/release-secrets/publisher.pem'),
      },
    },
    allowedPublicActors: ['neutral-bootstrap[bot]', 'neutral-publisher[bot]', 'github-pages[bot]'],
    forbiddenPrivateIdentifiers: ['private-owner', 'private-repository'],
  }
}

function privateBindings() {
  const packageRoot = path.resolve('/release-tools/npm')
  const tool = (name: string) => ({
    path: path.resolve(`/release-tools/${name}`),
    realPath: path.resolve(`/release-tools/${name}`),
    digest: fixtureDigest('8'),
  })
  return {
    tools: {
      git: tool('git'),
      node: tool('node'),
      npm: {
        path: path.join(packageRoot, 'bin', 'npm-cli.js'),
        realPath: path.join(packageRoot, 'bin', 'npm-cli.js'),
        digest: fixtureDigest('8'),
        packageRoot,
        packageFileCount: 3,
        packageTreeDigest: fixtureDigest('9'),
      },
    },
    publishingChild: {
      path: 'scripts/github-app/public-release-github.mjs',
      blobSha: fixtureSha('c'),
      digest: fixtureDigest('7'),
    },
    github: {
      digest: fixtureDigest('6'),
      destination: publicationConfig().destination,
      apps: {
        bootstrap: { appId: 101, installationId: 201, owner: 'neutral-workbench', botLogin: 'neutral-bootstrap[bot]' },
        publisher: { appId: 102, installationId: 202, owner: 'neutral-workbench', botLogin: 'neutral-publisher[bot]' },
      },
    },
  }
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    async json() { return body },
  }
}

function publicationTransport() {
  const previousTip = fixtureSha('1')
  const treeSha = fixtureSha('4')
  const commitSha = fixtureSha('5')
  let updated = false
  let entries: Array<{ path: string, mode: string, type: string, sha: string }> = []
  const fetchImpl = async (url: string, init: { method?: string, body?: string }) => {
    if (url.includes('/git/ref/heads/main')) {
      if (init.method === 'PATCH') {
        updated = true
        throw new Error('ambiguous ref response')
      }
      return response({ object: { sha: updated ? commitSha : previousTip } })
    }
    if (url.endsWith('/git/blobs')) {
      const input = JSON.parse(init.body ?? '{}')
      const bytes = Buffer.from(input.content, 'base64')
      const sha = createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex')
      return response({ sha }, 201)
    }
    if (url.endsWith('/git/trees')) {
      entries = JSON.parse(init.body ?? '{}').tree
      return response({ sha: treeSha }, 201)
    }
    if (url.endsWith(`/git/trees/${treeSha}?recursive=1`)) {
      return response({ sha: treeSha, truncated: false, tree: entries })
    }
    if (url.endsWith('/git/commits')) return response({ sha: commitSha }, 201)
    if (url.endsWith(`/git/commits/${commitSha}`)) {
      return response({ sha: commitSha, tree: { sha: treeSha }, parents: [{ sha: previousTip }] })
    }
    throw new Error(`Unexpected publication URL: ${url}`)
  }
  return { fetchImpl, previousTip }
}

test.beforeAll(async () => {
  const generatedFiles = await readArtifactTree(path.resolve('dist'))
  const runtimeScripts = generatedFiles.filter(({ path: filePath }) => filePath.endsWith('.js'))
  const diagnosticUrls = [
    ['https://react.dev/errors/', 2],
    ['http://www.w3.org/2000/svg', 5],
    ['http://www.w3.org/1998/Math/MathML', 3],
    ['http://www.w3.org/1999/xlink', 7],
    ['http://www.w3.org/XML/1998/namespace', 3],
  ] as const
  const inertExternalUrlExceptions = diagnosticUrls.flatMap(([url, expectedOccurrences]) => {
    const exceptions = runtimeScripts.flatMap((file) => {
      const occurrences = file.bytes.toString('utf8').split(url).length - 1
      return occurrences === 0 ? [] : [{
        path: file.path, url, occurrences, reason: 'non-requesting-diagnostic' as const,
      }]
    })
    if (exceptions.reduce((total, entry) => total + entry.occurrences, 0) !== expectedOccurrences) {
      throw new Error(`Production diagnostic inventory changed: ${url}`)
    }
    return exceptions
  })
  const controllerRoot = path.resolve('/release-controller')
  const extractionRoot = path.resolve('/release-extracted')
  const gitExecutable = path.resolve('/release-tools/git')
  const sourceCommit = fixtureSha('a')
  const sourceTree = fixtureSha('b')
  const buildInput = {
    branch: 'main',
    controllerRoot,
    extractedPaths: ['index.html', 'package-lock.json', 'package.json', 'src/main.tsx'],
    extractedTreeSha: sourceTree,
    extractionRoot,
    gitExecutable,
    gitStatus: '',
    headSha: sourceCommit,
    lockfilePath: path.join(extractionRoot, 'package-lock.json'),
    nodeVersion: 'v24.19.0',
    originMainSha: sourceCommit,
    remoteUrl: 'git@github.com:private-owner/private-repository.git',
    repositoryRoot: controllerRoot,
    sourceTreeSha: sourceTree,
  }
  const candidate = await buildCandidateArtifact({
    buildInput,
    buildExpectation: {
      controllerRoot, gitExecutable, headSha: sourceCommit,
      remoteUrl: buildInput.remoteUrl, repositoryRoot: controllerRoot,
    },
    install: async () => {},
    build: async () => {},
    readGeneratedFiles: async () => generatedFiles,
    releaseContext: {
      footerDigest: REQUIRED_FOOTER_DIGEST,
      guidance: [{ id: 'reviewed-guidance', digest: fixtureDigest('4') }],
      lockfileSha256: fixtureDigest('3'),
      operatorUseModel: { purpose: 'non-commercial' },
    },
    phase: 'publish',
    forbiddenFragments: ['private-owner', 'private-repository'],
    inertExternalUrlExceptions,
    inertRuntimeApiExceptions: [],
    privateBindings: privateBindings(),
  })
  const decision = {
    ...candidate.template,
    decision: 'accepted',
    issuer: 'test-product-owner',
    issuedAt: '2026-09-07T10:00:00.000Z',
    notAfter: '2026-09-08T10:00:00.000Z',
    phaseRevalidation: {
      phase: 'publish', confirmedAt: '2026-09-07T11:00:00.000Z', invalidatorsUnchanged: true,
    },
  }
  const publication = publicationTransport()
  const published = await acceptPreparedArtifact({
    candidate,
    decision,
    phase: 'publish',
    now: Date.parse('2026-09-07T12:00:00.000Z'),
    onAccepted: ({ files, manifest }) => publishArtifactTree({
      fetchImpl: publication.fetchImpl,
      token: 'TEST_PUBLICATION_TOKEN_7',
      config: publicationConfig(),
      files,
      artifactTreeDigest: manifest.treeDigest,
      expectedTip: publication.previousTip,
    }),
  })
  if (published.state !== 'reconciled' || published.artifactTreeDigest !== candidate.manifest.treeDigest) {
    throw new Error('Prepared artifact did not cross the mocked publication and reconciliation boundary.')
  }
  admittedRuntimeEntries = candidate.manifest.entries
})

test('emits separately addressed sanitized raster files without inline copies', async ({ page }) => {
  const generatedFiles = await readArtifactTree(path.resolve('dist'))
  const rasterFiles = generatedFiles.filter(({ path: filePath }) => /\.(?:png|webp)$/.test(filePath))
  expect(rasterFiles.length).toBeGreaterThan(0)
  for (const file of rasterFiles) {
    expect(file.path).toMatch(/^assets\/[A-Za-z0-9][A-Za-z0-9._-]*-[A-Za-z0-9_-]{6,}\.(?:png|webp)$/)
    expect(Buffer.compare(Buffer.from(sanitizeRasterMetadata(file.path, file.bytes)), file.bytes)).toBe(0)
  }
  for (const file of generatedFiles.filter(({ path: filePath }) => /\.(?:css|html|js)$/.test(filePath))) {
    expect(file.bytes.toString('utf8')).not.toMatch(/data:image\/(?:png|webp)(?:;|,)/i)
  }
  await openInitialWorkbench(page, releaseViewports[1])
  for (let offset = 0; offset < rasterFiles.length; offset += 24) {
    const dimensions = await page.evaluate(async (filePaths) => Promise.all(filePaths.map(async (filePath) => {
      const image = new Image()
      image.src = new URL(filePath, window.location.href).href
      await image.decode()
      return { height: image.naturalHeight, width: image.naturalWidth }
    })), rasterFiles.slice(offset, offset + 24).map(({ path: filePath }) => filePath))
    expect(dimensions.every(({ height, width }) => height > 0 && width > 0)).toBe(true)
  }
})

test('keeps the shared legal footer readable and outside the workbench at every release surface', async ({ page }) => {
  for (const viewport of releaseViewports) {
    for (const openSurface of [openInitialWorkbench, openWorkbench]) {
      await openSurface(page, viewport)

      const footer = page.getByRole('contentinfo')
      await expect(footer).toHaveCount(1)
      await footer.scrollIntoViewIfNeeded()
      await expect(footer).toBeVisible()
      await expect(footer.locator('p[lang="en"]')).toContainText(
        'unofficial, non-commercial fan-made website',
      )
      await expect(footer.locator('p[lang="ko"]')).toContainText(
        '비공식·비상업적 팬메이드 웹사이트',
      )
      await expect(footer.locator(
        'a[href], button, input, select, textarea, summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
      )).toHaveCount(0)

      const geometry = await page.locator('.app-shell').evaluate((shell) => {
        const main = shell.querySelector('main')!
        const footerElement = shell.querySelector('footer')!
        const mainBox = main.getBoundingClientRect()
        const footerBox = footerElement.getBoundingClientRect()
        return {
          footerAfterMain: footerElement.offsetTop >= main.offsetTop + main.offsetHeight,
          footerInsideShell: footerBox.left >= shell.getBoundingClientRect().left
            && footerBox.right <= shell.getBoundingClientRect().right,
          footerWidth: footerBox.width,
          mainWidth: mainBox.width,
          noDocumentOverflow: document.documentElement.scrollWidth
            <= document.documentElement.clientWidth,
        }
      })
      expect(geometry.footerAfterMain).toBe(true)
      expect(geometry.footerInsideShell).toBe(true)
      expect(geometry.footerWidth).toBeCloseTo(geometry.mainWidth, 0)
      expect(geometry.noDocumentOverflow).toBe(true)
    }
  }
})

test('reaches the footer by keyboard without changing pane offsets or focused workbench control', async ({ page }) => {
  for (const viewport of releaseViewports) {
    await openWorkbench(page, viewport)

    await page.locator('.metric-toggle').evaluateAll((toggles) => {
      for (const toggle of toggles) (toggle as HTMLButtonElement).click()
    })

    const reference = page.locator('.workspace-reference')
    const result = page.locator('.result-panel')
    await reference.evaluate((element) => { element.scrollTop = 120 })
    await result.evaluate((element) => { element.scrollTop = 120 })
    const referenceOffset = await reference.evaluate((element) => element.scrollTop)
    const resultOffset = await result.evaluate((element) => element.scrollTop)
    if (viewport.width >= 1_000) expect(referenceOffset + resultOffset).toBeGreaterThan(0)

    const editParty = page.getByRole('button', { name: 'Edit party' })
    await editParty.focus()
    await page.keyboard.press('End')

    await expect(page.getByRole('contentinfo')).toBeInViewport()
    await expect(editParty).toBeFocused()
    expect(await reference.evaluate((element) => element.scrollTop)).toBe(referenceOffset)
    expect(await result.evaluate((element) => element.scrollTop)).toBe(resultOffset)

    await page.keyboard.press('Home')
    await expect(editParty).toBeFocused()
    expect(await reference.evaluate((element) => element.scrollTop)).toBe(referenceOffset)
    expect(await result.evaluate((element) => element.scrollTop)).toBe(resultOffset)
  }
})

test('loads only same-origin resources and leaves browser persistence empty', async ({ page, context, browser }) => {
  const persistedState = () => page.evaluate(async () => ({
    cacheKeys: 'caches' in window ? await caches.keys() : [],
    indexedDatabases: 'indexedDB' in window && typeof indexedDB.databases === 'function'
      ? await indexedDB.databases()
      : [],
    localStorageKeys: Object.keys(localStorage),
    serviceWorkers: 'serviceWorker' in navigator
      ? (await navigator.serviceWorker.getRegistrations()).length
      : 0,
    sessionStorageKeys: Object.keys(sessionStorage),
  }))
  const emptyState = {
    cacheKeys: [],
    indexedDatabases: [],
    localStorageKeys: [],
    serviceWorkers: 0,
    sessionStorageKeys: [],
  }

  for (const viewport of releaseViewports) {
    for (const openSurface of [openInitialWorkbench, openWorkbench]) {
      const requestUrls: string[] = []
      const socketUrls: string[] = []
      page.on('request', (request) => requestUrls.push(request.url()))
      page.on('websocket', (socket) => socketUrls.push(socket.url()))
      await openSurface(page, viewport)

      await expect(page.locator('meta[http-equiv="Content-Security-Policy"]'))
        .toHaveAttribute('content', exactCsp)
      const probeContext = await browser.newContext({ viewport })
      const probePage = await probeContext.newPage()
      const probeRequests: string[] = []
      probePage.on('request', (request) => probeRequests.push(request.url()))
      await probePage.goto(page.url())
      const blockedCrossOriginRequest = await probePage.evaluate(async () => {
        try {
          await fetch('https://example.invalid/zzz-workbench-csp-probe')
          return false
        } catch {
          return true
        }
      })
      expect(blockedCrossOriginRequest).toBe(true)
      expect(probeRequests.some((url) => url.includes('zzz-workbench-csp-probe'))).toBe(false)
      await probeContext.close()

      expect(requestUrls.length).toBeGreaterThan(0)
      const pageUrl = new URL(page.url())
      expect(requestUrls.every((url) => new URL(url).origin === pageUrl.origin)).toBe(true)
      expect(socketUrls.every((url) => new URL(url).host === pageUrl.host)).toBe(true)
      expect(await context.cookies()).toEqual([])
      expect(await persistedState()).toEqual(emptyState)

      await page.reload()
      await expect(page.getByRole('heading', { name: 'Editing party' })).toBeVisible()
      await expect(page.getByRole('contentinfo')).toHaveCount(1)
      expect(await context.cookies()).toEqual([])
      expect(await persistedState()).toEqual(emptyState)
      page.removeAllListeners('request')
      page.removeAllListeners('websocket')
    }
  }

  const pageUrl = new URL(page.url())
  for (const entry of admittedRuntimeEntries) {
    const response = await page.request.get(new URL(entry.path, pageUrl).href)
    expect(response.ok(), `production artifact URL failed: ${entry.path}`).toBe(true)
    const bytes = await response.body()
    expect(bytes.length, `production artifact size changed: ${entry.path}`).toBe(entry.size)
    expect(
      createHash('sha256').update(bytes).digest('hex'),
      `production artifact bytes changed: ${entry.path}`,
    ).toBe(entry.sha256)
  }
})
