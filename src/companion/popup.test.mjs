import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import {
  createPreparedState,
  createSetupShortcutUrl,
  convertGear,
  readParty,
} from './.test/bridge.mjs'
import { syntheticGear } from './test-fixtures.mjs'

const { JSDOM } = createRequire(path.join(process.cwd(), 'package.json'))('jsdom')
const inputState = createPreparedState({}, ['pyrois', 'norma', 'astraYao'], 0)
const input = createSetupShortcutUrl(inputState, 'https://zzz-setup-workbench.github.io/')

test('keeps conversion opening explicit and clears stale destinations after edits, failures, and input changes', async () => {
  const window = new JSDOM(fs.readFileSync(new URL('./popup.html', import.meta.url), 'utf8'), {
    runScripts: 'outside-only',
    url: 'https://extension.fixture/',
  }).window
  const query = (selector) => window.document.querySelector(selector)
  let opened = null
  let collectionFailed = false
  let openFailed = false
  let pendingOpen = false
  let rejectPendingOpen = null
  const gear = syntheticGear(inputState)
  for (const disc of gear.members[2].discs.slice(4)) disc.name = 'Swing Jazz'

  window.readParty = readParty
  window.convertGear = convertGear
  window.collectParty = () => {}
  window.chrome = {
    tabs: {
      query: async () => [{
        id: 1,
        url: 'https://act.hoyolab.com/app/zzz-game-record/index.html#/zzz/roles/all',
      }],
      create: async ({ url }) => {
        if (pendingOpen) return new Promise((_resolve, reject) => { rejectPendingOpen = reject })
        if (openFailed) throw new Error('blocked')
        opened = url
      },
    },
    scripting: {
      executeScript: async () => [{
        result: collectionFailed
          ? { ok: false, error: '수집 실패' }
          : { ok: true, data: structuredClone(gear) },
      }],
    },
  }
  const popupSource = fs.readFileSync(new URL('./popup.js', import.meta.url), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
  window.eval(popupSource)
  const settle = () => new Promise((resolve) => setImmediate(resolve))
  const fill = () => {
    query('#shortcut').value = input
    query('#shortcut').dispatchEvent(new window.Event('input'))
  }

  try {
    assert.equal(query('#collect').disabled, true)
    fill()
    assert.equal(query('#collect').disabled, false)
    assert.equal(query('#copy'), null)

    query('#collect').click()
    await settle()
    assert.equal(query('#open').disabled, false)
    assert.equal(query('select'), null)
    assert.equal(opened, null)
    assert.match(query('#members').textContent, /동일 효과로 반영/)
    assert.equal(query('#members details').open, false)
    assert.equal(query('#raw').hidden, true)

    query('#open').click()
    await settle()
    assert.match(opened, /^https:\/\/zzz-setup-workbench\.github\.io\/#setup=/)

    pendingOpen = true
    query('#open').click()
    fill()
    rejectPendingOpen(new Error('late failure'))
    await settle()
    assert.equal(query('#raw').hidden, true)
    assert.equal(query('#output').value, '')
    assert.equal(query('#open').disabled, true)

    pendingOpen = false
    query('#collect').click()
    await settle()
    openFailed = true
    query('#open').click()
    await settle()
    assert.equal(query('#raw').hidden, false)
    assert.equal(query('#raw').open, true)
    assert.equal(window.document.activeElement.id, 'output')
    assert.equal(query('#output').value, opened)

    gear.members[0].discs[3].main = { label: 'DEF', value: '48%' }
    query('#collect').click()
    await settle()
    assert.equal(query('#open').disabled, true)
    assert.equal(query('select').value, '')

    query('select').value = query('select').options[1].value
    query('select').dispatchEvent(new window.Event('change'))
    assert.equal(query('#open').disabled, false)
    query('#members button').click()
    assert.equal(query('#open').disabled, true)
    assert.equal(query('select').value, '')

    collectionFailed = true
    query('#collect').click()
    await settle()
    assert.equal(query('#output').value, '')
    assert.equal(query('#result').hidden, true)
    assert.equal(query('#open').disabled, true)

    fill()
    assert.equal(query('#open').disabled, true)
  } finally { window.close() }
})

test('keeps the minimal extension permission and runtime boundary', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'))
  assert.equal(manifest.name, 'ZZZ Setup Companion')
  assert.deepEqual(manifest.permissions, ['activeTab', 'scripting'])
  for (const field of ['host_permissions', 'background', 'content_scripts', 'web_accessible_resources']) {
    assert.equal(field in manifest, false)
  }
  for (const file of ['collect.js', 'adapter.ts', 'popup.js']) {
    const source = fs.readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|document\.cookie|localStorage|sessionStorage|sendBeacon|WebSocket/)
  }
})
