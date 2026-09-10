import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { AGENT_SELECTOR_PORTRAITS } from './components/agentSelectorPortraits'
import { localizedAgentName } from './localization'
import { ADMITTED_AGENTS, agentDisplayName, type AgentId } from './workbench/content'
import { createPreparedState } from './workbench/state'
import { createSetupShortcutUrl, readSetupShortcut } from './workbench/setup-shortcut'

const originalClipboard = navigator.clipboard

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: originalClipboard,
  })
})

function renderEnglishApp() {
  const rendered = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '표시 언어: 한국어' }))
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Display in English' }))
  return rendered
}

async function renderPreparedFixtureParty() {
  const user = userEvent.setup()
  renderEnglishApp()

  for (const [slot, agent] of [
    [1, /Yixuan, Auric Ink, Rupture/],
    [2, /Dialyn, Physical, Stun/],
    [3, /Lucia, Ether, Support/],
  ] as const) {
    await user.click(screen.getByRole('button', { name: `Select Agent for slot ${slot}` }))
    await user.click(screen.getByRole('button', { name: agent }))
  }
  await user.click(screen.getByRole('button', { name: 'Apply party' }))
  return user
}

describe('workbench UI integration', () => {
  it('defaults to Korean without storing or encoding the language choice', () => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    const address = window.location.href

    render(<App />)

    expect(document.documentElement).toHaveAttribute('lang', 'ko')
    expect(screen.getByRole('heading', { name: '파티 편성 중' })).toBeInTheDocument()
    const language = screen.getByRole('button', { name: '표시 언어: 한국어' })
    expect(language).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(language)
    expect(screen.getByRole('menuitemradio', { name: '한국어로 표시' }))
      .toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Display in English' }))
      .toHaveAttribute('aria-checked', 'false')
    expect(window.location.href).toBe(address)
    expect(window.localStorage).toHaveLength(0)
    expect(window.sessionStorage).toHaveLength(0)
  })

  it('switches only presentation language while preserving the current editor state', async () => {
    const user = userEvent.setup()
    render(<App />)
    const address = window.location.href

    await user.click(screen.getByRole('button', { name: '1번 슬롯 에이전트 선택' }))
    const selectedCandidate = screen.getByRole('button', { name: /레미엘, 광휘, 이상, S급/ })
    await user.click(selectedCandidate)
    await user.click(screen.getByRole('button', { name: '2번 슬롯 에이전트 선택' }))
    const koreanPool = screen.getByRole('region', { name: '에이전트 후보 목록' })
    const koreanIds = within(koreanPool).getAllByRole('button')
      .map((card) => card.dataset.agent as AgentId)
    const koreanNames = koreanIds.map((agentId) => localizedAgentName(agentId, 'ko'))
    expect(koreanNames).toEqual([...koreanNames].sort(new Intl.Collator('ko-KR', {
      numeric: true,
      sensitivity: 'base',
    }).compare))

    await user.click(screen.getByRole('button', { name: '표시 언어: 한국어' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Display in English' }))

    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('heading', { name: 'Editing party' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Replace slot 1, Remielle/ })).toBeInTheDocument()
    const englishPool = screen.getByRole('region', { name: 'Agent candidate pool' })
    const englishIds = within(englishPool).getAllByRole('button')
      .map((card) => card.dataset.agent as AgentId)
    const englishNames = englishIds.map((agentId) => localizedAgentName(agentId, 'en'))
    expect(englishNames).toEqual([...englishNames].sort(new Intl.Collator('en-US', {
      numeric: true,
      sensitivity: 'base',
    }).compare))
    expect(screen.getByRole('button', { name: 'Display language: English' }))
      .toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Display language: English' }))
      .toHaveFocus())
    expect(window.location.href).toBe(address)
    expect(window.localStorage).toHaveLength(0)
    expect(window.sessionStorage).toHaveLength(0)
  })

  it('preserves applied selection and open disclosure state across language changes', async () => {
    const state = createPreparedState({}, ['dialyn', 'anbySoldier0', 'lucia'], 1)
    window.history.replaceState(
      null,
      '',
      new URL(createSetupShortcutUrl(state, window.location.href)).hash,
    )
    const user = userEvent.setup()
    render(<App />)

    const viewed = screen.getByRole('tab', { name: '0호·엔비 세팅과 결과 보기' })
    expect(viewed).toHaveAttribute('aria-selected', 'true')
    const engine = screen.getByRole('button', { name: /에서 W-엔진 변경/ })
    await user.click(engine)
    expect(engine).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('button', { name: '표시 언어: 한국어' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Display in English' }))

    expect(screen.getByRole('tab', { name: 'View Anby: Soldier 0 setup and Result' }))
      .toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: /Change W-Engine from/ }))
      .toHaveAttribute('aria-expanded', 'true')
    expect(document.querySelector('.selector-region--engine')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Select .* W[1-5]$/ }).length).toBeGreaterThan(0)
  })

  it('supports keyboard entry and dismissal for the language menu', async () => {
    render(<App />)
    const trigger = screen.getByRole('button', { name: '표시 언어: 한국어' })

    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(screen.getByRole('menuitemradio', { name: '한국어로 표시' }))
      .toHaveFocus())

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.pointerDown(document.body)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('copies a complete Setup shortcut without changing the current address', async () => {
    const state = createPreparedState({}, ['dialyn', 'anbySoldier0', 'lucia'], 1)
    const shortcut = createSetupShortcutUrl(state, window.location.href)
    window.history.replaceState(null, '', `${window.location.pathname}?manual=1${new URL(shortcut).hash}`)
    const addressBeforeCopy = window.location.href
    const writeText = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    renderEnglishApp()

    const focused = screen.getByRole('tab', { name: 'View Anby: Soldier 0 setup and Result' })
    expect(focused).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('region', { name: 'Anby: Soldier 0 setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Anby: Soldier 0 Result' })).toBeInTheDocument()

    const copy = screen.getByRole('button', { name: 'Copy Setup shortcut' })
    expect(copy).toBeEnabled()
    await user.click(copy)

    expect(writeText).toHaveBeenCalledOnce()
    const copiedUrl = writeText.mock.calls[0][0] as string
    expect(window.location.href).toBe(addressBeforeCopy)
    expect(new URL(copiedUrl).search).toBe('')
    expect(readSetupShortcut(new URL(copiedUrl).hash)).toEqual(state)
    expect(copy).toHaveTextContent('Copied')
    expect(copy).toHaveFocus()
    expect(focused).toHaveAttribute('aria-selected', 'true')
    expect(within(document.querySelector('.masthead-actions')!).getByRole('status'))
      .toHaveTextContent('Setup shortcut copied.')

    writeText.mockRejectedValueOnce(new Error('Clipboard denied'))
    await user.click(copy)
    expect(window.location.href).toBe(addressBeforeCopy)
    expect(copy).toHaveTextContent('Copy failed')
    expect(within(document.querySelector('.masthead-actions')!).getByRole('status'))
      .toHaveTextContent('Setup shortcut could not be copied.')
  })

  it('isolates each copy from older feedback and allows only one write at a time', async () => {
    const state = createPreparedState({}, ['dialyn', 'anbySoldier0', 'lucia'], 1)
    const shortcut = createSetupShortcutUrl(state, window.location.href)
    window.history.replaceState(null, '', new URL(shortcut).hash)
    let finishCopy!: () => void
    const pendingCopy = new Promise<void>((resolve) => { finishCopy = resolve })
    const writeText = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockReturnValueOnce(pendingCopy)
    const clearTimeout = vi.spyOn(window, 'clearTimeout')
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderEnglishApp()

    const copy = screen.getByRole('button', { name: 'Copy Setup shortcut' })
    await user.click(copy)
    await waitFor(() => expect(copy).toHaveTextContent('Copied'))
    await user.click(copy)
    expect(copy).toHaveAttribute('aria-disabled', 'true')
    expect(copy).toBeEnabled()
    expect(copy).toHaveTextContent('Copying')
    expect(copy).toHaveFocus()
    expect(clearTimeout).toHaveBeenCalled()
    fireEvent.click(copy)
    expect(writeText).toHaveBeenCalledTimes(2)

    finishCopy()
    await waitFor(() => expect(copy).toHaveTextContent('Copied'))
    expect(copy).toHaveFocus()
  })

  it('expires copy feedback and clears its timer on unmount', async () => {
    vi.useFakeTimers()
    const state = createPreparedState({}, ['dialyn', 'anbySoldier0', 'lucia'], 1)
    window.history.replaceState(
      null,
      '',
      new URL(createSetupShortcutUrl(state, window.location.href)).hash,
    )
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const { unmount } = renderEnglishApp()
    const copy = screen.getByRole('button', { name: 'Copy Setup shortcut' })

    fireEvent.click(copy)
    await act(async () => { await Promise.resolve() })
    expect(copy).toHaveTextContent('Copied')

    act(() => vi.advanceTimersByTime(1800))
    expect(copy).toHaveTextContent(/^Copy setup$/)

    fireEvent.click(copy)
    await act(async () => { await Promise.resolve() })
    expect(copy).toHaveTextContent('Copied')
    expect(vi.getTimerCount()).toBe(1)

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('suppresses clipboard feedback after shortcut navigation replaces the Setup', async () => {
    const initial = createPreparedState({}, ['yixuan', 'dialyn', 'lucia'], 0)
    const replacement = createPreparedState({}, ['dialyn', 'anbySoldier0', 'lucia'], 1)
    window.history.replaceState(
      null,
      '',
      new URL(createSetupShortcutUrl(initial, window.location.href)).hash,
    )
    let finishInitialCopy!: () => void
    let finishReplacementCopy!: () => void
    const writeText = vi.fn()
      .mockReturnValueOnce(new Promise<void>((resolve) => { finishInitialCopy = resolve }))
      .mockReturnValueOnce(new Promise<void>((resolve) => { finishReplacementCopy = resolve }))
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderEnglishApp()

    const copy = screen.getByRole('button', { name: 'Copy Setup shortcut' })
    await user.click(copy)
    expect(copy).toHaveTextContent('Copying')

    window.location.hash = new URL(
      createSetupShortcutUrl(replacement, window.location.href),
    ).hash
    finishInitialCopy()
    await waitFor(() => expect(screen.getByRole('tab', {
      name: '0호·엔비 세팅과 결과 보기',
    })).toHaveAttribute('aria-selected', 'true'))

    await waitFor(() => expect(copy).toHaveTextContent(/^세팅 복사$/))
    expect(copy).not.toHaveTextContent('Copied')
    expect(within(document.querySelector('.masthead-actions')!).getByRole('status'))
      .toHaveTextContent('')

    await user.click(copy)
    expect(copy).toHaveTextContent('복사 중')
    finishReplacementCopy()
    await waitFor(() => expect(copy).toHaveTextContent('복사됨'))
    expect(readSetupShortcut(new URL(String(writeText.mock.calls[1][0])).hash))
      .toEqual(replacement)

    window.location.hash = 'setup=unsupported'
    await waitFor(() => expect(screen.getByRole('heading', { name: '파티 편성 중' }))
      .toBeInTheDocument())
    await waitFor(() => expect(copy).toHaveTextContent(/^세팅 복사$/))
    expect(copy).toBeDisabled()
    expect(copy).not.toHaveTextContent('Copied')
    expect(within(document.querySelector('.masthead-actions')!).getByRole('status'))
      .toHaveTextContent('')
  })

  it.each([
    ['resolved', 'Copied'],
    ['rejected', 'Copy failed'],
  ] as const)('suppresses a %s clipboard result as soon as the address hash changes', async (
    outcome,
    staleLabel,
  ) => {
    const initial = createPreparedState({}, ['yixuan', 'dialyn', 'lucia'], 0)
    const replacement = createPreparedState({}, ['dialyn', 'anbySoldier0', 'lucia'], 1)
    window.history.replaceState(
      null,
      '',
      new URL(createSetupShortcutUrl(initial, window.location.href)).hash,
    )
    let resolveCopy!: () => void
    let rejectCopy!: (error: Error) => void
    const writeText = vi.fn().mockReturnValue(new Promise<void>((resolve, reject) => {
      resolveCopy = resolve
      rejectCopy = reject
    }))
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderEnglishApp()

    const copy = screen.getByRole('button', { name: 'Copy Setup shortcut' })
    fireEvent.click(copy)
    window.history.replaceState(
      null,
      '',
      new URL(createSetupShortcutUrl(replacement, window.location.href)).hash,
    )

    if (outcome === 'resolved') resolveCopy()
    else rejectCopy(new Error('Clipboard denied'))
    await act(async () => { await Promise.resolve() })

    expect(copy).toHaveClass('masthead-action--idle')
    expect(copy).not.toHaveTextContent(staleLabel)
    expect(within(document.querySelector('.masthead-actions')!).getByRole('status'))
      .toHaveTextContent('')
  })

  it('suppresses a rejected clipboard result after shortcut navigation', async () => {
    const initial = createPreparedState({}, ['yixuan', 'dialyn', 'lucia'], 0)
    const replacement = createPreparedState({}, ['dialyn', 'anbySoldier0', 'lucia'], 1)
    window.history.replaceState(
      null,
      '',
      new URL(createSetupShortcutUrl(initial, window.location.href)).hash,
    )
    let rejectCopy!: (error: Error) => void
    const writeText = vi.fn().mockReturnValue(new Promise<void>((_, reject) => {
      rejectCopy = reject
    }))
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderEnglishApp()

    const copy = screen.getByRole('button', { name: 'Copy Setup shortcut' })
    await user.click(copy)
    window.location.hash = new URL(
      createSetupShortcutUrl(replacement, window.location.href),
    ).hash
    await waitFor(() => expect(screen.getByRole('tab', {
      name: '0호·엔비 세팅과 결과 보기',
    })).toHaveAttribute('aria-selected', 'true'))

    rejectCopy(new Error('Clipboard denied'))
    await waitFor(() => expect(copy).toHaveTextContent(/^세팅 복사$/))
    expect(copy).not.toHaveTextContent('Copy failed')
    expect(within(document.querySelector('.masthead-actions')!).getByRole('status'))
      .toHaveTextContent('')
  })

  it('reports a delayed copy after draft-only Party Edit changes', async () => {
    const state = createPreparedState({}, ['yixuan', 'dialyn', 'lucia'], 0)
    window.history.replaceState(
      null,
      '',
      new URL(createSetupShortcutUrl(state, window.location.href)).hash,
    )
    let finishCopy!: () => void
    const writeText = vi.fn().mockReturnValue(new Promise<void>((resolve) => {
      finishCopy = resolve
    }))
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderEnglishApp()

    const copy = screen.getByRole('button', { name: 'Copy Setup shortcut' })
    await user.click(copy)
    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    expect(screen.getByRole('heading', { name: 'Editing party' })).toBeInTheDocument()

    finishCopy()
    await waitFor(() => expect(copy).toHaveTextContent('Copied'))
    expect(readSetupShortcut(new URL(String(writeText.mock.calls[0][0])).hash)).toEqual(state)
  })

  it('falls back atomically to initial Party Edit for an invalid shortcut', () => {
    window.history.replaceState(null, '', '/#setup=unsupported')
    renderEnglishApp()

    expect(screen.getByRole('heading', { name: 'Editing party' })).toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Applied party slots' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy Setup shortcut' })).toBeDisabled()
  })

  it('atomically follows Setup shortcut navigation within the current tab', async () => {
    const initial = createPreparedState({}, ['yixuan', 'dialyn', 'lucia'], 0)
    const replacement = createPreparedState({}, ['dialyn', 'anbySoldier0', 'lucia'], 1)
    window.history.replaceState(
      null,
      '',
      new URL(createSetupShortcutUrl(initial, window.location.href)).hash,
    )
    renderEnglishApp()

    expect(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
      .toHaveAttribute('aria-selected', 'true')

    window.location.hash = new URL(
      createSetupShortcutUrl(replacement, window.location.href),
    ).hash

    await waitFor(() => expect(screen.getByRole('tab', {
      name: '0호·엔비 세팅과 결과 보기',
    })).toHaveAttribute('aria-selected', 'true'))
    expect(screen.getByRole('heading', { name: '0호·엔비 결과' })).toBeInTheDocument()

    window.location.hash = 'setup=unsupported'

    await waitFor(() => expect(screen.getByRole('heading', { name: '파티 편성 중' }))
      .toBeInTheDocument())
    expect(screen.queryByRole('tablist', { name: '적용된 파티 슬롯' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '세팅 바로가기 복사' })).toBeDisabled()
  })

  it('keeps one non-interactive legal footer across the initial and applied states', async () => {
    window.localStorage.clear()
    window.sessionStorage.clear()

    const user = userEvent.setup()
    renderEnglishApp()

    const initialFooter = screen.getByRole('contentinfo')
    const initialCopy = initialFooter.textContent
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
    expect(initialFooter).toHaveTextContent('unofficial, non-commercial fan-made website')
    expect(initialFooter).toHaveTextContent('not sponsored, endorsed, or approved by HoYoverse')
    expect(initialFooter).toHaveTextContent('© All rights reserved by miHoYo')
    expect(initialFooter).toHaveTextContent(
      'not derived from Zenless Zone Zero belong to their respective owners',
    )
    expect(initialFooter).toHaveTextContent('비공식·비상업적 팬메이드 웹사이트')
    expect(initialFooter).toHaveTextContent('그 밖의 자산과 권리는 각 소유자에게 귀속됩니다')
    expect(initialFooter.querySelectorAll('p')).toHaveLength(2)
    expect(initialFooter).toHaveAttribute('data-font-license', expect.stringContaining('SUIT-LICENSE'))
    expect(initialFooter.querySelector('p[lang="en"]')).toBeInTheDocument()
    expect(initialFooter.querySelector('p[lang="ko"]')).toBeInTheDocument()
    expect(initialFooter.querySelector(
      'a[href], button, input, select, textarea, summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
    )).not.toBeInTheDocument()
    expect(document.querySelector('main')!.compareDocumentPosition(initialFooter))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING)

    for (const [slot, agent] of [
      [1, /Yixuan, Auric Ink, Rupture/],
      [2, /Dialyn, Physical, Stun/],
      [3, /Lucia, Ether, Support/],
    ] as const) {
      await user.click(screen.getByRole('button', { name: `Select Agent for slot ${slot}` }))
      await user.click(screen.getByRole('button', { name: agent }))
    }
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    const appliedFooter = screen.getByRole('contentinfo')
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
    expect(appliedFooter).toBe(initialFooter)
    expect(appliedFooter.textContent).toBe(initialCopy)
    expect(window.localStorage).toHaveLength(0)
    expect(window.sessionStorage).toHaveLength(0)
  })

  it('starts in empty Party Edit and prepares the first complete party', async () => {
    const user = userEvent.setup()
    renderEnglishApp()

    expect(screen.getByRole('heading', { name: 'ZZZ Setup Workbench' })).toBeInTheDocument()
    expect(document.querySelector('.masthead img')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Editing party' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Select Agent for slot/ })).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Apply party' })).toBeDisabled()
    expect(screen.queryByRole('heading', { name: 'Current party' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Applied party slots' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()

    const apply = screen.getByRole('button', { name: 'Apply party' })

    for (const [slot, agent] of [
      [1, /Yixuan, Auric Ink, Rupture/],
      [2, /Dialyn, Physical, Stun/],
      [3, /Lucia, Ether, Support/],
    ] as const) {
      await user.click(screen.getByRole('button', { name: `Select Agent for slot ${slot}` }))
      await user.click(screen.getByRole('button', { name: agent }))
      if (slot < 3) expect(apply).toBeDisabled()
    }

    expect(apply).toBeEnabled()
    await user.click(apply)

    const tabs = screen.getAllByRole('tab')
    const yixuan = screen.getByRole('tab', { name: 'View Yixuan setup and Result' })
    const editParty = screen.getByRole('button', { name: 'Edit party' })

    expect(tabs).toHaveLength(3)
    await waitFor(() => expect(editParty).toHaveFocus())
    expect(tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true')).toEqual([yixuan])
    expect(screen.getByRole('region', { name: 'Yixuan setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yixuan Result' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: /Result$/i })).toHaveLength(1)
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', yixuan.id)

    const selectorPortrait = yixuan.querySelector<HTMLImageElement>('.selector-agent-art')!
    const workspacePortrait = document.querySelector<HTMLImageElement>(
      '.workspace-identity .agent-art',
    )!
    expect(selectorPortrait.src).not.toBe(workspacePortrait.src)
    expect(selectorPortrait.src).toContain('/selector-portraits/')
    expect(workspacePortrait.src).toContain('/portraits/')

    await user.click(yixuan)
    expect(yixuan).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('region', { name: 'Yixuan setup' })).toBeInTheDocument()
  })

  it('resolves initial Focus eligibility before the first Apply', async () => {
    const user = userEvent.setup()
    renderEnglishApp()

    for (const [slot, agent] of [
      [1, /Trigger, Electric, Stun/],
      [2, /Dialyn, Physical, Stun/],
      [3, /Lucia, Ether, Support/],
    ] as const) {
      await user.click(screen.getByRole('button', { name: `Select Agent for slot ${slot}` }))
      await user.click(screen.getByRole('button', { name: agent }))
    }

    const applyParty = screen.getByRole('button', { name: 'Apply party' })
    expect(applyParty).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Replace slot 1,/ }))
    await user.click(screen.getByRole('button', { name: /Yixuan, Auric Ink, Rupture/ }))
    expect(applyParty).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /Replace slot 2,/ }))
    await user.click(screen.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ }))
    await user.click(applyParty)

    const focusOptions = screen.getByRole('group', { name: 'Eligible Focus Agents' })
    expect(within(focusOptions).getAllByRole('button')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Editing party' })).toBeInTheDocument()

    await user.click(within(focusOptions).getByRole('button', {
      name: 'Set Anby: Soldier 0 as Focus',
    }))
    await user.click(applyParty)

    expect(screen.queryByRole('heading', { name: 'Editing party' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Anby: Soldier 0 setup and Result' }))
      .toHaveTextContent('Focus')
  })

  it('presents one alphabetical, intersectable Party Edit pool with shared upper-body portrait sources', async () => {
    const user = await renderPreparedFixtureParty()

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: /Replace slot 1,/ }))

    const pool = screen.getByRole('region', { name: 'Agent candidate pool' })
    const cards = within(pool).getAllByRole('button')
    const agentFor = (card: HTMLElement) => ADMITTED_AGENTS.find(
      ({ id }) => id === card.dataset.agent,
    )!
    const names = cards.map((card) => agentDisplayName(agentFor(card)))
    const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
    expect(names).toEqual([...names].sort(collator.compare))

    const occupiedCard = cards.find((card) => card.hasAttribute('disabled'))!
    const occupiedAgent = agentFor(occupiedCard)
    expect(occupiedCard).toHaveAccessibleName(
      expect.stringContaining(`${occupiedAgent.rank} Rank, Slot`),
    )

    const available = cards.find((card) => !card.hasAttribute('disabled'))!
    const availableAgentId = available.dataset.agent as AgentId
    const expectedSource = new URL(AGENT_SELECTOR_PORTRAITS[availableAgentId], window.location.href).href
    expect(available.querySelector<HTMLImageElement>('.party-editor__portrait--pool img')!.src)
      .toBe(expectedSource)
    const draftAgentId = ADMITTED_AGENTS.find(({ id }) => id === 'yixuan')!.id
    const expectedDraftSource = new URL(AGENT_SELECTOR_PORTRAITS[draftAgentId], window.location.href).href
    expect(document.querySelector<HTMLImageElement>('.draft-slot .party-editor__portrait img')!.src)
      .toBe(expectedDraftSource)

    await user.click(screen.getByRole('button', { name: 'Electric Attribute' }))
    const attackFilter = screen.getByRole('button', { name: 'Attack Specialty' })
    await user.click(attackFilter)
    expect(attackFilter).toHaveFocus()
    for (const card of within(pool).getAllByRole('button')) {
      const agent = agentFor(card)
      expect(agent.attribute).toBe('Electric')
      expect(agent.specialty).toBe('Attack')
    }

    const selectedDraftSlot = screen.getByRole('button', { name: /Replace slot 1,/ })
    await user.click(selectedDraftSlot)
    expect(selectedDraftSlot).not.toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('region', { name: 'Agent candidate pool' })).not.toBeInTheDocument()
  })

  it('keeps replacement targeting separate from the compact multi-eligible Focus picker', async () => {
    const user = await renderPreparedFixtureParty()

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    expect(screen.queryByText(/Draft 0[1-3]/)).not.toBeInTheDocument()
    const focusControl = document.querySelector<HTMLButtonElement>('.party-editor__focus-change')!
    expect(screen.getByRole('button', { name: 'Apply party' })).toBeDisabled()
    expect(focusControl).toBeDisabled()
    expect(screen.queryByRole('group', { name: 'Eligible Focus Agents' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Replace slot 2,/ }))
    await user.click(screen.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ }))

    expect(focusControl).toBeEnabled()
    await user.click(focusControl)
    const focusOptions = screen.getByRole('group', { name: 'Eligible Focus Agents' })
    const eligibleFocusOptions = within(focusOptions).getAllByRole('button')
    expect(eligibleFocusOptions).toHaveLength(2)
    expect(focusOptions.closest('.party-editor__focus-popup')).toHaveClass('party-editor__focus-popup--2')
    expect(within(focusOptions).queryByText('Focus eligible')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Replace slot 2,/ })).not.toHaveAttribute('aria-pressed', 'true')

    await user.click(within(focusOptions).getByRole('button', { name: 'Set Anby: Soldier 0 as Focus' }))
    expect(screen.queryByRole('group', { name: 'Eligible Focus Agents' })).not.toBeInTheDocument()
    expect(focusControl).toHaveFocus()
    expect(screen.getByRole('button', { name: /Replace slot 2, Anby: Soldier 0/ }))
      .toHaveClass('is-focus')
    expect(document.querySelector('.draft-slot.is-focus .draft-slot__focus-marker'))
      .toHaveTextContent('Focus')
  })

  it('routes an otherwise valid unresolved draft from Apply party into Focus selection', async () => {
    const user = await renderPreparedFixtureParty()

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: /Replace slot 2,/ }))
    await user.click(screen.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ }))

    const applyParty = screen.getByRole('button', { name: 'Apply party' })
    expect(applyParty).toBeEnabled()

    await user.click(applyParty)

    const focusOptions = screen.getByRole('group', { name: 'Eligible Focus Agents' })
    const eligibleFocusOptions = within(focusOptions).getAllByRole('button')
    expect(eligibleFocusOptions).toHaveLength(2)
    expect(eligibleFocusOptions[0]).toHaveFocus()
    await user.click(applyParty)
    expect(eligibleFocusOptions[0]).toHaveFocus()
    expect(screen.getByRole('heading', { name: 'Editing party' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dialyn applied slot, inactive/ }))
      .toBeInTheDocument()

    await user.click(within(focusOptions).getByRole('button', {
      name: 'Set Anby: Soldier 0 as Focus',
    }))
    await user.click(applyParty)

    expect(screen.queryByRole('heading', { name: 'Editing party' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Anby: Soldier 0 setup and Result' }))
      .toHaveTextContent('Focus')
  })

  it('keeps Apply party unavailable when a changed draft has no eligible Focus', async () => {
    const user = await renderPreparedFixtureParty()

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: /Replace slot 1,/ }))
    await user.click(screen.getByRole('button', { name: /Trigger, Electric, Stun/ }))

    expect(screen.getByRole('button', { name: 'Apply party' })).toBeDisabled()
    expect(screen.queryByRole('group', { name: 'Eligible Focus Agents' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Yixuan applied slot, inactive/ }))
      .toBeInTheDocument()
  })

  it('groups special declared Attributes under their base Party Edit filter families', async () => {
    const user = await renderPreparedFixtureParty()

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: /Replace slot 1,/ }))

    const pool = screen.getByRole('region', { name: 'Agent candidate pool' })
    const families = [
      ['Ether Attribute family, including Auric Ink', ['Auric Ink', 'Ether']],
      ['Ice Attribute family, including Frost', ['Frost', 'Ice']],
      ['Physical Attribute family, including Honed Edge', ['Honed Edge', 'Physical']],
    ] as const

    for (const [filterName, expectedAttributes] of families) {
      await user.click(screen.getByRole('button', { name: filterName }))
      const visibleAttributes = within(pool).getAllByRole('button').map((card) => (
        ADMITTED_AGENTS.find(({ id }) => id === card.dataset.agent)!.attribute
      ))
      expect([...new Set(visibleAttributes)].sort()).toEqual([...expectedAttributes].sort())
    }
  })

  it('changes only the viewed workspace and preserves edited Setup state', async () => {
    const user = await renderPreparedFixtureParty()

    const count = screen.getByRole('textbox', { name: 'CRIT Rate hit count' })
    expect(count).toHaveValue('0')
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    expect(count).toHaveValue('1')

    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    expect(screen.getByRole('region', { name: 'Dialyn setup' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'ZZZ Setup Workbench' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))

    expect(screen.getByRole('textbox', { name: 'CRIT Rate hit count' })).toHaveValue('1')
    expect(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
      .toHaveAttribute('aria-selected', 'true')
  })

  it('recalculates a direct Setup edit and keeps its source connected to Result', async () => {
    const user = await renderPreparedFixtureParty()

    const before = screen.getByRole('row', { name: /CRIT Rate/ }).textContent
    await user.click(screen.getByRole('button', { name: 'Increase CRIT Rate hits' }))
    const after = screen.getByRole('row', { name: /CRIT Rate/ }).textContent
    expect(after).not.toBe(before)

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Branch & Blade Song',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Woodpecker Electro as twoPiece',
    }))
    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))

    const source = within(screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })).getByRole('row', { name: /Woodpecker Electro/ })
    const setupTarget = document.querySelector<HTMLElement>(
      '.disc-selection[data-source-tone="disc-2pc"]',
    )!

    await user.hover(source)
    expect(setupTarget).toHaveClass('is-source-active')
    await user.unhover(source)
    expect(setupTarget).not.toHaveClass('is-source-active')
  })

  it('cancels a changed party draft into the same viewed workspace', async () => {
    const user = await renderPreparedFixtureParty()

    const partyTabs = screen.getByRole('tablist', { name: 'Applied party slots' })
    expect(within(partyTabs).getAllByRole('tab')).toHaveLength(3)
    expect(within(partyTabs).queryByRole('button', { name: 'Edit party' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
    const selectorSource = screen.getByRole('tab', { name: 'View Dialyn setup and Result' })
      .querySelector<HTMLImageElement>('.selector-agent-art')!.src

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    expect(screen.getByRole('heading', { name: 'Editing party' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Current party' })).toBeInTheDocument()
    const partyRail = screen.getByRole('list', { name: 'Applied party slots' })
    expect(within(partyRail).queryAllByRole('tab')).toHaveLength(0)
    const inactiveSlots = within(partyRail).getAllByRole('button', { name: /applied slot, inactive/ })
    expect(inactiveSlots).toHaveLength(3)
    expect(inactiveSlots.every((slot) => slot.hasAttribute('disabled')))
      .toBe(true)
    expect(within(partyRail).queryByRole('button', { name: 'Edit party' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit party' })).toBeDisabled()
    expect(within(partyRail).getByRole('button', { name: /Dialyn applied slot/ })
      .querySelector<HTMLImageElement>('.selector-agent-art')!.src).toBe(selectorSource)
    expect(screen.getByRole('button', { name: 'Replace slot 2, Dialyn' })
      .querySelector<HTMLImageElement>('.party-editor__portrait img')!.src).toBe(selectorSource)
    await user.click(screen.getByRole('button', { name: /Replace slot 1,/ }))
    await user.click(screen.getByRole('button', { name: /Anby: Soldier 0, Electric, Attack/ }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('heading', { name: 'Editing party' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Current party' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))
      .toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('region', { name: 'Dialyn setup' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Anby: Soldier 0 setup' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Yixuan setup and Result' })).toBeInTheDocument()
  })

  it('applies a party draft atomically and prepares every new holder', async () => {
    const user = await renderPreparedFixtureParty()

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }
    await replace(1, /Anby: Soldier 0, Electric, Attack/)
    await replace(2, /Trigger, Electric, Stun/)
    await replace(3, /Astra Yao, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Apply party' }))

    expect(screen.getByRole('region', { name: 'Anby: Soldier 0 setup' }))
      .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Anby: Soldier 0 Result' }))
      .toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Trigger setup and Result' }))
      .toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'View Astra Yao setup and Result' }))
      .toBeInTheDocument()
  })

  it('uses the same compressed equipment package for selected and candidate controls', async () => {
    const user = await renderPreparedFixtureParty()

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: /Replace slot 2,/ }))
    await user.click(screen.getByRole('button', { name: /Seth, Electric, Defense/ }))
    await user.click(screen.getByRole('button', { name: 'Apply party' }))
    await user.click(screen.getByRole('tab', { name: 'View Seth setup and Result' }))

    const selectedPeacekeeper = screen.getByRole('button', {
      name: 'Change W-Engine from Peacekeeper - Specialized',
    })
    const descriptionId = selectedPeacekeeper.getAttribute('aria-describedby')!
    const compressedPackage = document.getElementById(descriptionId)!.textContent!
    expect(compressedPackage).not.toBe('')

    await user.click(selectedPeacekeeper)
    await user.click(screen.getByRole('button', { name: 'Select Spring Embrace W5' }))
    await user.click(screen.getByRole('button', {
      name: 'Change W-Engine from Spring Embrace',
    }))

    expect(screen.getByRole('button', {
      name: 'Select Peacekeeper - Specialized W5',
    })).toHaveAccessibleDescription(compressedPackage)

    const selectedAstral = screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Astral Voice',
    })
    const astralDescriptionId = selectedAstral.getAttribute('aria-describedby')!
    const compressedDiscPackage = document.getElementById(astralDescriptionId)!.textContent!

    await user.click(selectedAstral)
    await user.click(screen.getByRole('button', {
      name: 'Select Freedom Blues as fourPiece',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Freedom Blues',
    }))

    expect(screen.getByRole('button', {
      name: 'Select Astral Voice as fourPiece',
    })).toHaveAccessibleDescription(compressedDiscPackage)

    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    const replace = async (slot: number, agent: RegExp) => {
      await user.click(screen.getByRole('button', { name: new RegExp(`Replace slot ${slot},`) }))
      await user.click(screen.getByRole('button', { name: agent }))
    }
    await replace(1, /Velina, Wind, Anomaly/)
    await replace(2, /Promeia, Ice, Anomaly/)
    await replace(3, /Lucia, Ether, Support/)
    await user.click(screen.getByRole('button', { name: 'Change Focus Agent' }))
    await user.click(screen.getByRole('button', { name: 'Set Velina as Focus' }))
    await user.click(screen.getByRole('button', { name: 'Apply party' }))
    await user.click(screen.getByRole('tab', { name: 'View Velina setup and Result' }))

    const selectedJoyau = screen.getByRole('button', { name: 'Change W-Engine from Joyau Dore' })
    const joyauDescription = document.getElementById(selectedJoyau.getAttribute('aria-describedby')!)!
      .textContent!
    expect(joyauDescription).not.toBe('')
    await user.click(selectedJoyau)
    for (const candidateName of [
      'Select Weeping Gemini W5',
      'Select Kaboom the Cannon W5',
    ]) {
      expect(screen.getByRole('button', { name: candidateName }))
        .toHaveAccessibleDescription(expect.any(String))
      expect(screen.getByRole('button', { name: candidateName }))
        .not.toHaveAccessibleDescription('')
    }
    const boisterousCandidate = screen.getByRole('button', { name: 'Select Boisterous Echoes W5' })
    expect(boisterousCandidate).toHaveAccessibleDescription(expect.any(String))
    expect(boisterousCandidate).not.toHaveAccessibleDescription('')
    await user.click(boisterousCandidate)
    await user.click(screen.getByRole('button', { name: 'Change W-Engine from Boisterous Echoes' }))
    expect(screen.getByRole('button', { name: 'Select Joyau Dore W1' }))
      .toHaveAccessibleDescription(joyauDescription)

    const selectedWuthering = screen.getByRole('button', {
      name: 'Change 4-piece Drive Disc from Wuthering Salon',
    })
    expect(selectedWuthering).toHaveAccessibleDescription(expect.any(String))
    expect(selectedWuthering).not.toHaveAccessibleDescription('')
    await user.click(selectedWuthering)
    const astralCandidate = screen.getByRole('button', {
      name: 'Select Astral Voice as fourPiece',
    })
    expect(astralCandidate).toHaveAccessibleDescription(expect.any(String))
    expect(astralCandidate).not.toHaveAccessibleDescription('')
    await user.click(astralCandidate)
    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Swing Jazz',
    }))
    expect(screen.getByRole('button', { name: 'Select Freedom Blues as twoPiece' }))
      .toHaveAccessibleDescription(expect.any(String))
    expect(screen.getByRole('button', { name: 'Select Wuthering Salon as twoPiece' }))
      .toHaveAccessibleDescription(expect.any(String))
  })

  it('clears a stale source link when direct selection replaces its source identity', async () => {
    const user = await renderPreparedFixtureParty()

    await user.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Branch & Blade Song',
    }))
    await user.click(screen.getByRole('button', {
      name: 'Select Woodpecker Electro as twoPiece',
    }))
    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))

    const source = within(screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })).getByRole('row', { name: /Woodpecker Electro/ })
    fireEvent.mouseEnter(source)
    expect(document.querySelector('.disc-selection[data-source-tone="disc-2pc"]'))
      .toHaveClass('is-source-active')

    fireEvent.click(screen.getByRole('button', {
      name: 'Change 2-piece Drive Disc from Woodpecker Electro',
    }))
    fireEvent.click(screen.getByRole('button', {
      name: 'Select Branch & Blade Song as twoPiece',
    }))

    await waitFor(() => expect(document.querySelector(
      '.disc-selection[data-source-tone="disc-2pc"]',
    )).not.toHaveClass('is-source-active'))
  })

  it('clears a stale source link when the viewed Agent changes', async () => {
    const user = await renderPreparedFixtureParty()

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    const source = within(screen.getByRole('table', {
      name: 'CRIT Rate source contributions',
    })).getAllByRole('row')[1]
    fireEvent.mouseEnter(source)
    expect(document.querySelector('.source-target.is-source-active')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'View Dialyn setup and Result' }))

    await waitFor(() => expect(document.querySelector('.source-target.is-source-active'))
      .not.toBeInTheDocument())
    expect(screen.queryByRole('table', { name: 'CRIT Rate source contributions' }))
      .not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'View Yixuan setup and Result' }))
    expect(screen.queryByRole('table', { name: 'CRIT Rate source contributions' }))
      .not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'CRIT Rate' }))
    expect(screen.getByRole('table', { name: 'CRIT Rate source contributions' }))
      .toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit party' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('table', { name: 'CRIT Rate source contributions' }))
      .not.toBeInTheDocument()
  })
})
