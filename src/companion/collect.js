// Self-contained for chrome.scripting.executeScript. No network or storage APIs.
export async function collectParty(targets) {
  if (globalThis.__zzzGearCollectionRunning) return { ok: false, error: '이미 수집 중입니다. 잠시 후 다시 실행하세요.' };
  globalThis.__zzzGearCollectionRunning = true;
  const initialUrl = location.href;
  const deadline = Date.now() + 90000;
  let allowedUrls = new Set([initialUrl]);
  let establishingList = null;
  let profileQuery = new URL(initialUrl).hash.includes('?') ? new URL(initialUrl).hash.split('?')[1] : null;
  let interrupted = false;
  let ownedPopup = null;
  const onInput = event => { if (event.isTrusted) interrupted = true; };
  const visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const normalize = name => name.normalize('NFKC').replace(/[「」『』]/g, '').replace(/\s+/g, ' ').trim();
  const one = (scope, selector) => {
    const matches = [...scope.querySelectorAll(selector)].filter(visible);
    if (matches.length !== 1) throw new Error('화면 구조가 예상과 다릅니다. 수집을 중단했습니다.');
    return matches[0];
  };
  const text = el => {
    const value = el.textContent.trim();
    if (!value || value.length > 160) throw new Error('장비 표시값을 확인할 수 없습니다.');
    return value;
  };
  const level = el => {
    const match = text(el).match(/^Lv\.\s*(\d{1,2})$/);
    if (!match) throw new Error('레벨 표시를 확인할 수 없습니다.');
    return Number(match[1]);
  };
  const check = () => {
    if (interrupted || (!allowedUrls.has(location.href) && !establishingList?.())) throw new Error('페이지 조작 또는 이동으로 수집을 중단했습니다. 다시 실행하세요.');
    if (Date.now() >= deadline) throw new Error('수집 시간이 초과되었습니다. 장비 화면을 확인하고 다시 실행하세요.');
  };
  const waitFor = async (predicate, timeoutMessage = '장비 상세가 표시되지 않았습니다. 다시 실행하세요.') => {
    const end = Math.min(Date.now() + 4000, deadline);
    while (Date.now() < end) {
      check();
      const found = predicate();
      if (found) return found;
      await new Promise(resolve => setTimeout(resolve, 80));
    }
    throw new Error(timeoutMessage);
  };
  const close = async () => {
    check();
    const popup = ownedPopup;
    one(popup, '.close-icon').click();
    await waitFor(() => !visible(popup));
    ownedPopup = null;
  };
  const open = async (button, selector) => {
    check();
    button.click();
    ownedPopup = await waitFor(() => {
      const matches = [...document.querySelectorAll(selector)].filter(visible);
      if (matches.length > 1) throw new Error('여러 상세 창이 동시에 열려 있어 수집을 중단했습니다.');
      return matches[0];
    });
    return ownedPopup;
  };
  const stats = (popup, selector, count) => {
    const region = one(popup, selector);
    const rows = [...region.querySelectorAll(':scope > div > div')];
    if (count === 4 ? rows.length > 4 : rows.length !== count) throw new Error('옵션 개수가 예상과 다릅니다.');
    return rows.map(row => {
      const cells = [...row.querySelectorAll(':scope > span')];
      if (cells.length !== 2) throw new Error('옵션 표시를 확인할 수 없습니다.');
      const label = text(cells[0]);
      const value = text(cells[1]);
      if (!/^\d+(?:\.\d+)?%?$/.test(value)) throw new Error('옵션 수치 형식이 예상과 다릅니다.');
      return { label, value };
    });
  };
  const route = () => location.hash.split('?')[0];
  const transition = async (button, paths, ready, enteringAgent = false) => {
    check();
    const previous = new URL(location.href);
    const query = previous.hash.includes('?') ? previous.hash.slice(previous.hash.indexOf('?')) : '';
    allowedUrls = new Set([previous.href, ...paths.map(path => {
      const next = new URL(previous.href);
      next.hash = path + query;
      return next.href;
    })]);
    if (paths.includes('#/zzz')) {
      const main = new URL(previous.href);
      main.hash = '#/zzz';
      allowedUrls.add(main.href);
    }
    // Main does not carry the role query. Only its official All Agents click may establish it.
    const fromMain = route() === '#/zzz';
    if (fromMain || enteringAgent) {
      establishingList = () => {
        const next = new URL(location.href);
        return next.origin === previous.origin && next.pathname === previous.pathname
          && next.search === previous.search && (enteringAgent ? /^#\/zzz\/roles\/[1-9]\d*\/detail$/.test(route()) : route() === '#/zzz/roles/all')
          && (profileQuery === null || next.hash.split('?')[1] === profileQuery);
      };
      try {
        button.click();
        await waitFor(ready);
      } finally { establishingList = null; }
    } else {
      button.click();
      await waitFor(ready);
    }
    allowedUrls = new Set([location.href]);
    if (route() === '#/zzz/roles/all' && profileQuery === null) profileQuery = location.hash.split('?')[1] || '';
  };
  const goToList = async () => {
    if (/^#\/zzz\/roles\/\d+\/detail$/.test(route())) {
      await transition(one(document, '[class^="backIcon_"]'), ['#/zzz/roles/all', '#/zzz'],
        () => ['#/zzz/roles/all', '#/zzz'].includes(route()));
    }
    if (route() === '#/zzz') {
      const allAgents = await waitFor(() => [...document.querySelectorAll('span[class^="rightText_"]')]
        .find(el => visible(el) && ['전체 에이전트', 'All Agents'].includes(el.textContent.trim())));
      await transition(allAgents, ['#/zzz/roles/all'], () => route() === '#/zzz/roles/all');
    }
    if (route() !== '#/zzz/roles/all') throw new Error('전적 메인 또는 전체 에이전트 화면에서 실행하세요.');
    await waitFor(() => [...document.querySelectorAll('.gt-card__info-outside')].some(visible));
  };
  try {
    const url = new URL(initialUrl);
    if (url.origin !== 'https://act.hoyolab.com' || url.pathname !== '/app/zzz-game-record/index.html'
      || !/^#\/zzz(?:\/roles\/(?:all|\d+\/detail))?(?:\?|$)/.test(url.hash)) throw new Error('공식 HoYoLAB 전적 화면에서 실행하세요.');
    if (!Array.isArray(targets) || targets.length !== 3 || new Set(targets.map(x => x.workbenchId)).size !== 3
      || targets.some(x => !/^[a-zA-Z0-9]+$/.test(x.workbenchId) || !Array.isArray(x.names) || x.names.length < 1
        || x.names.some(name => typeof name !== 'string' || !name || name.length > 160))) {
      throw new Error('사이트에서 복사한 파티 세 명이 필요합니다.');
    }
    if ([...document.querySelectorAll('.role-detail-popup')].some(visible)) throw new Error('열려 있는 장비 상세 창을 닫고 실행하세요.');
    if ([...document.querySelectorAll('[role="dialog"]')].some(visible)) throw new Error('열려 있는 안내 창을 닫고 실행하세요.');
    document.addEventListener('pointerdown', onInput, true);
    document.addEventListener('keydown', onInput, true);
    const members = [];
    for (const target of targets) {
    await goToList();
    const cards = [...document.querySelectorAll('.gt-card__info-outside')]
      .filter(el => visible(el) && target.names.includes(normalize(el.textContent)));
    if (cards.length !== 1) throw new Error(`${target.names[0]}를 목록에서 찾지 못했습니다. 보유 여부와 필터를 확인하세요.`);
    await transition(cards[0], [], () =>
      /^#\/zzz\/roles\/[1-9]\d*\/detail$/.test(route()) && [...document.querySelectorAll('.role-base-info .nickname')]
        .some(el => visible(el) && target.names.includes(normalize(el.textContent)))
      && [...document.querySelectorAll('.weapon-info')].some(visible), true);
    const base = one(document, '.role-base-info');
    const name = text(one(base, '.nickname'));
    if (!target.names.includes(normalize(name))) throw new Error('대상 에이전트와 상세 화면이 일치하지 않습니다.');
    // HoYoLAB exposes the name and equipment before the new SVG use hrefs resolve.
    // An empty reference is loading, not evidence of a changed icon or M0.
    const ranks = await waitFor(() => {
      if (!base.isConnected || !visible(base) || text(one(base, '.nickname')) !== name) {
        throw new Error('돌파를 읽는 중 에이전트 화면이 변경되었습니다.');
      }
      const rankIcons = [...one(base, '.rank-list').children];
      if (rankIcons.length < 6) return false;
      if (rankIcons.length !== 6) throw new Error('돌파 표시를 확인할 수 없습니다.');
      const hrefs = rankIcons.map(icon => icon.querySelector('use')?.getAttribute('href') || '');
      if (hrefs.some(href => !href)) return false;
      return rankIcons.map((icon, index) => {
        if (!hrefs[index].startsWith(`#gti--zzz-game-mindscape-0${index + 1}`)) throw new Error('돌파 아이콘이 변경되었습니다.');
        const color = getComputedStyle(icon).color;
        if (color === 'rgb(255, 240, 0)') return true;
        if (color === 'rgba(255, 255, 255, 0.35)') return false;
        throw new Error('돌파 활성 상태를 확인할 수 없습니다.');
      });
    }, `${name}: 돌파 아이콘을 불러오지 못했습니다. 로딩 완료 후 다시 실행하세요.`);
    const mindscape = ranks.filter(Boolean).length;
    if (ranks.some((active, index) => active !== (index < mindscape))) throw new Error('돌파 표시 순서가 예상과 다릅니다.');
    const agent = { id: Number(route().match(/\/roles\/(\d+)\/detail$/)[1]), workbenchId: target.workbenchId, name, level: level(one(base, '.level')), mindscape };
    const engineButton = one(document, '.weapon-info');
    const rankImage = one(engineButton, '.rank').getAttribute('src') || '';
    const refinement = Number(rankImage.match(/(?:^|\/)role-star-([1-5])\./)?.[1]);
    if (!refinement) throw new Error('엔진 재련 표시를 확인할 수 없습니다.');
    // Capture only visible equipment identities to detect changes while collecting.
    const buttons = [engineButton, ...Array.from({ length: 6 }, (_, i) => one(document, `.equip-info-${i + 1}`))];
    const fingerprint = () => buttons.map(button => {
      if (!button.isConnected || !visible(button)) throw new Error('장비 화면이 변경되었습니다.');
      return [...button.querySelectorAll('img')].map(image => image.getAttribute('src')).join('|') + button.textContent;
    }).join('\n');
    const before = fingerprint();

    const enginePopup = await open(engineButton, '.weapon-popup');
    const engineName = one(enginePopup, '.popup-content > div:first-child p[class*="rarity-icon-"]');
    const weapon = {
      name: text(engineName),
      rarity: engineName.className.match(/(?:^|\s)rarity-icon-([SAB])(?:\s|$)/)?.[1],
      level: level(one(enginePopup, '.popup-content > div:first-child p:last-child')),
      refinement,
    };
    if (!weapon.rarity) throw new Error('엔진 등급을 확인할 수 없습니다.');
    await close();
    const discs = [];
    for (let slot = 1; slot <= 6; slot++) {
      const popup = await open(buttons[slot], '.equip-popup');
      const label = one(popup, '.popup-content > div:first-child p[class*="rarity-icon-"]');
      const match = text(label).match(/^(.+?)\s*\[([1-6])\]$/);
      if (!match || Number(match[2]) !== slot) throw new Error('디스크 슬롯이 일치하지 않습니다.');
      const rarity = label.className.match(/(?:^|\s)rarity-icon-([SAB])(?:\s|$)/)?.[1];
      if (rarity !== 'S') throw new Error('S급 디스크만 변환할 수 있습니다.');
      discs.push({ slot, name: match[1], rarity,
        level: level(one(popup, '.popup-content > div:first-child p:last-child')),
        main: stats(popup, '.base-attrs', 1)[0], substats: stats(popup, '.upper-attrs', 4),
      });
      await close();
    }
    check();
    if (before !== fingerprint() || text(one(base, '.nickname')) !== name) throw new Error('수집 중 장비가 변경되었습니다.');
    members.push({ agent, weapon, discs });
    }
    return { ok: true, data: { format: 'zzz-party-gear-display-v1', members } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : '수집하지 못했습니다.' };
  } finally {
    document.removeEventListener('pointerdown', onInput, true);
    document.removeEventListener('keydown', onInput, true);
    if (ownedPopup && !interrupted && allowedUrls.has(location.href) && visible(ownedPopup)) {
      const button = ownedPopup.querySelector('.close-icon');
      if (visible(button)) button.click();
    }
    globalThis.__zzzGearCollectionRunning = false;
  }
}

