import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { buildCompanion } from '../../scripts/github-app/companion/build.mjs'
import { readCompanionArchive } from '../../scripts/github-app/companion/archive.mjs'

const { JSDOM } = createRequire(path.join(process.cwd(), 'package.json'))('jsdom')
const source = fs.readFileSync(new URL('./collect.js', import.meta.url), 'utf8')
const targets = [
  { workbenchId: 'miyabi', names: ['미야비', 'Miyabi'] },
  { workbenchId: 'seed', names: ['시드', 'Seed'] },
  { workbenchId: 'lucy', names: ['루시', 'Lucy'] },
]

function fixture(mode = 'normal', serializedCollector = null) {
  const window = new JSDOM('<main></main>', {
    url: 'https://act.hoyolab.com/app/zzz-game-record/index.html#/zzz/roles/all?role_id=fixture&server=fixture',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  }).window
  window.Element.prototype.getClientRects = function getClientRects() {
    return this.isConnected && !this.closest('[hidden]') ? [{}] : []
  }
  const document = window.document
  let clicks = 0
  let interrupt
  const add = document.addEventListener.bind(document)
  document.addEventListener = (type, listener, ...rest) => {
    if (type === 'pointerdown') interrupt = () => listener({ isTrusted: true })
    add(type, listener, ...rest)
  }
  function page(route) {
    window.history.replaceState({}, '', `${route}?role_id=fixture&server=fixture`)
    for (const element of document.querySelector('main').children) element.hidden = true
    const current = document.createElement('section')
    document.querySelector('main').append(current)
    return current
  }
  function list() {
    const current = page('#/zzz/roles/all')
    targets.forEach((target, index) => {
      if (mode === 'missing' && index === 1) return
      const card = document.createElement('p')
      card.className = 'gt-card__info-outside'
      card.textContent = index === 1 ? '「시드」' : target.names[0]
      card.onclick = () => detail(target, index)
      current.append(card)
    })
  }
  function detail(target, index) {
    const current = page(`#/zzz/roles/${9_001 + index}/detail`)
    const name = mode === 'wrong-name' && index === 1 ? '다른 에이전트' : target.names[0]
    current.innerHTML = `<button class="backIcon_fixture"></button>
      <div class="role-base-info"><p class="nickname">${name}</p><span class="level">Lv.60</span>
      <div class="rank-list">${Array.from({ length: 6 }, (_, rank) => `<div style="color:${rank < (index === 2 ? 6 : 0) ? 'rgb(255,240,0)' : 'rgba(255,255,255,0.35)'}"><svg><use href=""></use></svg></div>`).join('')}</div></div>
      <div class="weapon-info"><img class="rank" src="images/role-star-5.fixture.png"></div>
      ${Array.from({ length: 6 }, (_, slot) => `<div class="equip-info-${slot + 1}"></div>`).join('')}`
    current.querySelector('button').onclick = list
    if (mode === 'hidden-rank') current.querySelector('.rank-list > div').hidden = true
    window.setTimeout(() => current.querySelectorAll('use').forEach((use, rank) => {
      use.setAttribute('href', `#gti--zzz-game-mindscape-0${rank + 1}fixture`)
    }), 40)
    function gear(slot) {
      clicks += 1
      const popup = document.createElement('div')
      popup.className = slot ? 'role-detail-popup equip-popup' : 'role-detail-popup weapon-popup'
      const displayedSlot = mode === 'wrong-slot' && index === 1 && slot === 3 ? 2 : slot
      popup.innerHTML = `<button class="close-icon"></button><div class="popup-content"><div><div>
        <p class="rarity-icon-S">${slot ? `Synthetic Set[${displayedSlot}]` : 'Synthetic Engine'}</p><p>Lv.${slot ? 15 : 60}</p>
        </div></div><div class="base-attrs"><div><div><span>공격력</span><span>30%</span></div></div></div>
        <div class="upper-attrs"><div>${['치명타 확률', '치명타 피해', 'HP'].map((label) => `<div><span>${label}</span><span>3%</span></div>`).join('')}</div></div></div>`
      current.append(popup)
      if (mode === 'hidden-data' && slot) {
        const hiddenRow = document.createElement('div')
        hiddenRow.hidden = true
        hiddenRow.innerHTML = '<span>HIDDEN_FIXTURE</span><span>321</span>'
        popup.querySelector('.upper-attrs > div').append(hiddenRow)
        const hiddenText = document.createElement('span')
        hiddenText.hidden = true
        hiddenText.textContent = 'HIDDEN_FIXTURE'
        popup.querySelector('.base-attrs span:last-child').append(hiddenText)
      }
      if (mode === 'hidden-cell' && slot) popup.querySelector('.base-attrs span:last-child').hidden = true
      popup.querySelector('button').onclick = () => { popup.hidden = true }
      if (mode === 'interruption' && index === 1 && slot === 2) interrupt()
      if (mode === 'account-change' && index === 1 && slot === 2) {
        window.history.replaceState({}, '', '#/zzz/roles/9002/detail?role_id=changed&server=fixture')
      }
    }
    current.querySelector('.weapon-info').onclick = () => gear(0)
    for (let slot = 1; slot <= 6; slot += 1) {
      current.querySelector(`.equip-info-${slot}`).onclick = () => gear(slot)
    }
  }
  list()
  window.eval(serializedCollector
    ? `globalThis.collectParty = (${serializedCollector})`
    : source.replace('export async function', 'async function'))
  return { window, run: () => window.collectParty(targets), clicks: () => clicks }
}

test('the generated collector remains self-contained when Chrome serializes its exported function', async () => {
  const archive = await buildCompanion()
  const generated = readCompanionArchive(archive).find(({ path: entry }) => entry === 'collect.js')
  assert.ok(generated)
  const moduleUrl = `data:text/javascript;base64,${generated.bytes.toString('base64')}`
  const { collectParty } = await import(moduleUrl)
  const current = fixture('normal', collectParty.toString())
  try {
    const result = await current.run()
    assert.equal(result.ok, true, result.error)
    assert.equal(result.data.format, 'zzz-party-gear-display-v1')
    assert.equal(current.clicks(), 21)
  } finally { current.window.close() }
})

test('collects synthetic visible gear, normalized names, delayed Mindscape SVGs, and existing substats', async () => {
  const current = fixture()
  try {
    const result = await current.run()
    assert.equal(result.ok, true, result.error)
    assert.equal(result.data.format, 'zzz-party-gear-display-v1')
    assert.deepEqual(Array.from(result.data.members, ({ agent }) => agent.workbenchId), ['miyabi', 'seed', 'lucy'])
    assert.deepEqual(Array.from(result.data.members, ({ agent }) => agent.mindscape), [0, 0, 6])
    assert.equal(result.data.members[0].discs[0].substats.length, 3)
    assert.equal(current.clicks(), 21)
  } finally { current.window.close() }
})

test('ignores hidden option rows and hidden descendants inside a visible option value', async () => {
  const current = fixture('hidden-data')
  try {
    const result = await current.run()
    assert.equal(result.ok, true, result.error)
    assert.equal(result.data.members[0].discs[0].substats.length, 3)
    assert.equal(result.data.members[0].discs[0].main.value, '30%')
    assert.doesNotMatch(JSON.stringify(result), /HIDDEN_FIXTURE/)
  } finally { current.window.close() }
})

for (const mode of ['missing', 'wrong-name', 'wrong-slot', 'interruption', 'account-change', 'hidden-cell', 'hidden-rank']) {
  test(`clears the entire collection on ${mode}`, async () => {
    const current = fixture(mode)
    try {
      const result = await current.run()
      assert.equal(result.ok, false)
      assert.equal('data' in result, false)
      assert.ok(current.clicks() < 21)
      assert.equal(current.window.__zzzGearCollectionRunning, false)
    } finally { current.window.close() }
  })
}
