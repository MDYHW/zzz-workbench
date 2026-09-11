import { useEffect, useRef } from 'react'
import { useLocalization } from './localization'

const copy = {
  ko: {
    label: '장비 가져오기 안내', short: '가져오기', title: 'HoYoLAB 장비 가져오기',
    download: '확장 기능 ZIP 다운로드', platform: 'PC Chrome · Edge / 수동 설치',
    install: '처음 한 번 설치', use: '파티 세팅 가져오기',
    installSteps: [
      'ZIP을 내려받아 압축을 풉니다. 설치 후에도 이 폴더를 보관하세요.',
      '주소창에 chrome://extensions 또는 edge://extensions를 입력하고 개발자 모드를 켭니다.',
      '“압축해제된 확장 프로그램을 로드합니다”를 눌러 manifest.json이 있는 폴더를 선택하고, 확장 기능을 툴바에 고정합니다.',
    ],
    useSteps: [
      '이 사이트에서 파티 3명과 주력을 적용한 뒤 세팅 복사를 누릅니다.',
      '상단 HoYoLAB을 열어 로그인하고, 확장 기능에 복사한 URL을 붙여넣습니다.',
      '파티 3명 장비 읽기를 누르고 기다립니다. 읽는 동안 HoYoLAB 화면을 조작하지 마세요.',
      '제외·대체 내용을 확인한 뒤 Workbench에서 열기를 누릅니다.',
    ],
    limits: '전체 엔진 후보 · 육성 완료 기준으로 비교합니다. 지원하지 않는 장비는 선택이 필요하거나 가져올 수 없습니다. HoYoLAB 화면은 한국어·영어를 지원합니다.',
    privacy: '로그인은 HoYoLAB에서만 합니다. 확장 기능은 로그인 정보를 수집하거나 장비 데이터를 서버로 보내지 않습니다.',
    update: '업데이트: 새 ZIP을 풀어 기존 폴더를 교체한 뒤 확장 프로그램 관리 화면에서 새로고침하세요.',
  },
  en: {
    label: 'Gear import guide', short: 'Import', title: 'Import HoYoLAB equipment',
    download: 'Download extension ZIP', platform: 'Desktop Chrome · Edge / manual install',
    install: 'Install once', use: 'Import your party',
    installSteps: [
      'Download and extract the ZIP. Keep the extracted folder after installation.',
      'Enter chrome://extensions or edge://extensions in the address bar and enable Developer mode.',
      'Choose “Load unpacked”, select the folder containing manifest.json, then pin the extension to your toolbar.',
    ],
    useSteps: [
      'Apply three Agents and Focus on this site, then choose Copy setup.',
      'Open HoYoLAB from the header, sign in there, and paste the copied URL into the extension.',
      'Read the three Agents. Leave the HoYoLAB page untouched while collection runs.',
      'Review exclusions or replacements, then choose Open in Workbench.',
    ],
    limits: 'Uses the full engine pool and completed growth. Unsupported equipment requires a choice or stops the import. Korean and English HoYoLAB pages are supported; the extension controls are in Korean.',
    privacy: 'Sign in only on HoYoLAB. The extension does not collect login information or send equipment data to a server.',
    update: 'Update: extract the new ZIP over your extension folder, then reload the extension on the browser’s extensions page.',
  },
}

export function CompanionHelp() {
  const { locale } = useLocalization()
  const text = copy[locale]
  const details = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const dismiss = (event: PointerEvent | KeyboardEvent) => {
      const element = details.current
      if (!element?.open) return
      if (event instanceof KeyboardEvent) {
        if (event.key !== 'Escape' || !element.contains(document.activeElement)) return
        element.open = false
        element.querySelector('summary')?.focus()
      } else if (event.target instanceof Node && !element.contains(event.target)) element.open = false
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', dismiss)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', dismiss)
    }
  }, [])
  return (
    <details className="companion-help" ref={details}>
      <summary className="masthead-action" aria-label={text.label} title={text.label}>
        <svg className="masthead-utility-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5" />
        </svg>
        <span className="masthead-action__label">{text.short}</span>
      </summary>
      <section className="companion-help__panel" aria-label={text.title}>
        <h2>{text.title}</h2>
        <p className="companion-help__platform">{text.platform}</p>
        <a className="companion-help__download" href="/downloads/zzz-setup-companion.zip" download>{text.download}</a>
        <h3>{text.install}</h3>
        <ol>{text.installSteps.map(step => <li key={step}>{step}</li>)}</ol>
        <h3>{text.use}</h3>
        <ol>{text.useSteps.map(step => <li key={step}>{step}</li>)}</ol>
        <p>{text.limits}</p>
        <p>{text.privacy}</p>
        <p className="companion-help__update">{text.update}</p>
      </section>
    </details>
  )
}
