import { describe, expect, it } from 'vitest'
import { setupPolicyFor, W_ENGINES, type EngineId } from './content'
import { createPreparedState, workbenchReducer, type WorkbenchState } from './state'
import { createSetupShortcutUrl, readSetupShortcut } from './setup-shortcut'

const preparedSetup = () => createPreparedState(
  {},
  ['dialyn', 'anbySoldier0', 'lucia'],
  1,
)

function rewritePayload(
  url: string,
  update: (payload: Record<string, unknown>) => void,
): string {
  const encoded = new URL(url).hash.slice('#setup='.length)
  const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const payload = JSON.parse(atob(padded)) as Record<string, unknown>
  update(payload)
  const next = btoa(JSON.stringify(payload))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
  return `#setup=${next}`
}

describe('Setup shortcuts', () => {
  it('round-trips one complete selected Setup without adding other session state', () => {
    const initial = preparedSetup()
    const substatId = Object.keys(initial.slots[1].setup.substats)[0] as keyof typeof initial.slots[1]['setup']['substats']
    const edited = workbenchReducer(initial, {
      type: 'setSubstat',
      slot: 1,
      key: substatId,
      value: 7,
    })

    const url = createSetupShortcutUrl(edited, 'https://example.test/workbench?temporary=1#old')
    expect(url).not.toContain('temporary=1')
    expect(readSetupShortcut(new URL(url).hash)).toEqual(edited)
  })

  it('rejects the whole shortcut when its version or complete party invariant is invalid', () => {
    const url = createSetupShortcutUrl(preparedSetup(), 'https://example.test/')

    expect(readSetupShortcut(rewritePayload(url, (payload) => {
      payload.v = 2
    }))).toBeNull()
    expect(readSetupShortcut(rewritePayload(url, (payload) => {
      const slots = payload.slots as Array<Record<string, unknown>>
      slots[0].agentId = slots[1].agentId
    }))).toBeNull()
    expect(readSetupShortcut(rewritePayload(url, (payload) => {
      payload.focusSlot = 0
    }))).toBeNull()
    expect(readSetupShortcut(rewritePayload(url, (payload) => {
      const slots = payload.slots as Array<Record<string, unknown>>
      const first = slots[0]
      const invalidEngine = (Object.keys(W_ENGINES) as EngineId[]).find((engineId) => (
        !setupPolicyFor(first.agentId as WorkbenchState['slots'][number]['agentId'])
          .engineIdsByPool[first.pool as WorkbenchState['slots'][number]['setup']['pool']]
          .includes(engineId)
      ))!
      first.engineId = invalidEngine
    }))).toBeNull()
  })

  it('does not create a shortcut that the current parser would reject', () => {
    const state = preparedSetup()
    const slots = state.slots.map((slot) => ({
      ...slot,
      setup: { ...slot.setup },
    })) as WorkbenchState['slots']
    slots[0].setup.engineId = null

    expect(() => createSetupShortcutUrl({ ...state, slots }, 'https://example.test/'))
      .toThrow('A valid complete Setup is required')
  })

  it('rejects malformed, incomplete, and mixed hash input without partial recovery', () => {
    const url = createSetupShortcutUrl(preparedSetup(), 'https://example.test/')
    expect(readSetupShortcut('#setup=not-base64')).toBeNull()
    expect(readSetupShortcut(`${new URL(url).hash}&extra=1`)).toBeNull()
    expect(readSetupShortcut(rewritePayload(url, (payload) => {
      const slots = payload.slots as Array<Record<string, unknown>>
      const firstSubstats = slots[0].substats as Record<string, number>
      delete firstSubstats[Object.keys(firstSubstats)[0]]
    }))).toBeNull()
  })
})
