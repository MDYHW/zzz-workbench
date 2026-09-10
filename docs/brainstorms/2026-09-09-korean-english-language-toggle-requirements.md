---
date: 2026-09-09
topic: korean-english-language-toggle
status: confirmed
---

# Korean and English Language Toggle Requirements

## Summary

Add a Korean-default language control that translates the complete current
workbench while preserving the existing English presentation. Switching
language changes presentation only: the current editing point, Setup, and
calculated Result remain intact.

---

## Problem Frame

The workbench is preparing to reach a Korean ZZZ community, but its interactive
client is currently English-only. Translating visible headings alone would
leave equipment, game terms, source detail, feedback states, and assistive copy
mixed across languages. Treating displayed English as identity would also make
ordinary copy changes capable of breaking translation coverage.

The current client already has deliberate distinctions between party and viewed
Agent state, Setup inputs, three Result surfaces, surface-free operations,
source detail, and copied Setup shortcuts. Localization must preserve those
meanings instead of introducing a second product mode or a translated variant
of the calculation.

---

## Actors

- A1. Workbench user: views and edits one current party and switches the
  presentation between Korean and English.
- A2. Content maintainer: verifies official Korean terminology and keeps every
  currently reachable localized identity complete for a release.

---

## Key Flows

- F1. Switch the current presentation
  - **Trigger:** A1 activates the other language in the masthead.
  - **Actors:** A1
  - **Steps:** The selected language changes immediately; visible and assistive
    copy updates; language-specific candidate ordering updates; the current
    control, editor, disclosure, and workbench state remain in place.
  - **Outcome:** The same current Setup and Result are presented in the selected
    language without recalculation or navigation.
  - **Covered by:** R1-R5, R11-R18
- F2. Enter a new session or copied Setup
  - **Trigger:** A1 opens or reloads the workbench, opens it in a new tab, or
    enters through a Setup shortcut.
  - **Actors:** A1
  - **Steps:** The page starts in Korean; a valid shortcut establishes its
    carried Setup under the existing atomic flow; an invalid shortcut follows
    the existing empty initial flow; neither shortcut form reads or carries a
    language preference.
  - **Outcome:** Entry remains deterministic and language-neutral at the
    shortcut boundary.
  - **Covered by:** R3-R6
- F3. Complete a release translation
  - **Trigger:** A2 adds or changes a user-reachable identity or copy key.
  - **Actors:** A2
  - **Steps:** Existing language-neutral identity is reused where available;
    official Korean terminology is verified; both language values are supplied;
    one common completeness check covers the reachable translation set.
  - **Outcome:** A release cannot knowingly ship a newly reachable untranslated
    item, while an unexpected production miss remains readable in English.
  - **Covered by:** R7-R10, R19

---

## Requirements

**Control and session behavior**

- R1. The title masthead ends with one compact current-language trigger that
  opens the `한국어` and `EN` choices. The existing Setup-copy action sits
  immediately to its left. The language control remains a session utility and
  does not compete visually with Party Apply.
- R2. Korean is selected on initial render. The trigger identifies the current
  language visually and accessibly, the open menu identifies the selected
  choice, and activating the already-selected language is a no-op.
- R3. Language preference lives only in the current page session. It is not
  stored in a cookie, local storage, session storage, account, server, or Setup
  shortcut, and it does not create a language-specific URL.
- R4. A reload, new tab, or Setup-shortcut entry starts in Korean. Same-page
  language switching itself performs no reload, address mutation, or
  navigation.
- R5. Switching language preserves the applied or draft party, party order,
  Focus, viewed Agent, every Setup selection and input draft, target Result
  context, active selector or Party Edit target, filters, open choice surfaces,
  expanded Result disclosures, source-link state, scroll position, and keyboard
  editing point wherever the same control remains available.
- R6. Language changes neither candidate membership nor prepared choices,
  completeness, lifecycle behavior, calculated values, source ownership,
  action applicability, Result surfaces, nor the serialized Setup-shortcut
  payload. It does not trigger preparation or calculation as a product action.

**Translation identity, authority, and coverage**

- R7. User-facing translation uses stable language-neutral meaning identities.
  Existing Agent, W-Engine, Drive Disc, stat, action, and other domain
  identities are reused. A missing identity receives one meaningful stable
  identity; displayed English wording is not itself the translation identity,
  and localization does not create duplicate domain entities.
- R8. The official current Korean game/client terminology is authoritative for
  Agent, W-Engine, Drive Disc, stat, action, skill, source, condition, and other
  game-owned names. The verified Nanoka live dataset may be used for efficient
  extraction, with NamuWiki or similar material used only to locate or explain
  discrepancies. Official terminology wins every conflict; an uncertain term
  remains unresolved rather than guessed.
- R9. Translation scope is the complete user-reachable client: Identity, Setup,
  Result, Party Edit, selectors, filters, validation and empty states, Copy
  feedback, source detail, operations, gauges, and accessible names,
  descriptions, status announcements, and constraints. It does not require a
  catalogue of unreachable or future content.
- R10. Each release freezes its verified Korean and English values rather than
  reading an external terminology source at runtime. A generic completeness
  check fails development and release verification when any currently
  reachable meaning identity lacks either language. The check derives coverage
  from the reachable identities and does not enumerate named Agents or items as
  individual assertions. An unexpected missing Korean value in the delivered
  client falls back to English rather than breaking or hiding the control.
- R11. Agent presentation keeps the current concise display-name level in both
  languages rather than expanding every Agent to a full official name. The
  Party Edit candidate pool sorts by Korean displayed name in Korean and by
  English displayed name in English. Applied and draft party order, Setup,
  Result, and Focus never reorder with language.

**Selected Korean presentation**

- R12. Product copy uses concise natural Korean rather than word-for-word
  translation. The selected recurring terms include `Setup` as `세팅`, `Result`
  as `결과`, `Focus` as `주력`, `Operations` as `별도 효과`, `Quantity` as
  `항목`, `Outcome` as `적용 대상`, `Source` as `출처`, and `Common source` as
  `공통 출처`.
- R13. Party Edit follows the selected natural style: `Edit party` is `파티
  편성`, `Change formation` is `편성 변경`, `Editing party` is `파티 편성 중`,
  `Current party` is `현재 파티`, `Apply party` is `편성 적용`, `Cancel` is
  `취소`, and Agent and slot actions use the corresponding concise Korean
  action wording rather than literal English syntax.
- R14. Setup headings follow the selected terminology: `Loadout` is `기본 설정`,
  `Mindscape` is `형상 시네마`, `W-Engine Pool` is `W-엔진 범위`, `Full` is
  `전체`, `Non-limited` is visibly `상시`, `Stat Bank` is `스탯 설정`, `Main
  stats` is `주옵션`, `Effective substats` is `유효 부옵션`, and `Hit count`
  is `유효 횟수`. The `상시` control's accessible description preserves its
  exact product meaning: the candidate subset excluding limited S-Rank
  W-Engines while retaining admitted non-limited S-Rank and A-Rank engines.
- R15. The Korean Result surface headings are `초기`, `전투 입장`, and `최종`
  for the existing Initial, Combat, and Fully Enabled surfaces. Their accessible
  descriptions preserve the owner-defined meanings. In particular, `최종`
  means all mutually compatible Result-changing effects intentionally reachable
  for the current party and setups, not an absolute or theoretical maximum.
- R16. `Current`, `Threshold`, `Cap`, and `Active` remain English structural
  gauge terms in both presentations. Gauge basis stats, outputs, sources,
  constraints, and other descriptive copy use the selected language.
- R17. Mapped game source categories and source-local detail use verified
  official terminology and remain distinct. When both are required, one source
  row presents them together in `category: detail` order. Translation does not
  merge a trigger, affected action, recipient, source owner, or operation.
  `Aftershock` uses the single fixed Korean term `여진 피해` in every
  presentation context rather than varying by action, tag, or effect wording.
- R18. The Copy action is visibly `세팅 복사` in Korean and `Copy setup` in
  English. Its progress, success, failure, and assistive announcements use the
  selected language while preserving the existing disabled, single-in-flight,
  focus, address, and feedback-reset behavior. Copy and the current-language
  trigger use the approved rounded masthead-utility form with explicit icons;
  desktop retains concise labels, while narrow layouts reduce both controls to
  equal circular icon buttons. Language choices open from one current-language
  trigger, and the narrow menu uses the approved reduced width.

**Shared presentation and accessibility**

- R19. The document language and every interactive accessible label reflect the
  selected presentation. The project title remains `ZZZ Setup Workbench` in
  both languages. The existing legal footer remains simultaneously English and
  Korean, with each language identified correctly, regardless of the selected
  control.
- R20. Both languages preserve readable content, visible focus, the established
  ZZZ visual grammar including the approved rounded masthead utilities, and the
  supported desktop and narrow layouts without horizontal page scrolling,
  clipping, overlap, or a smaller type size used only to accommodate one
  translation.
- R21. Localization changes presentation only. Existing source highlighting
  continues to resolve from source identity and locus rather than translated
  words; a source-free or surface-free relationship does not gain a new source
  or surface through translation. In particular, Result operations remain
  surface-free under the existing operation contract.

---

## Testing Delta

- The new behavior is one presentation-state transition spanning multiple
  existing interactive surfaces. Current Party Edit, Setup, Result, shortcut,
  and Copy tests prove those flows independently but do not prove that one
  language transition preserves their live editing point and state.
- Add shared state-preservation examples across an initial/draft flow and a
  complete applied workbench, including an open selector or disclosure and
  keyboard focus. Assert unchanged semantic state and calculated values rather
  than duplicating tests per Agent.
- Derive translation completeness from the current reachable identity types or
  collections. Do not freeze a hand-authored roster, equipment catalogue, or
  one assertion per translated item.
- Existing shortcut tests remain the behavioral owner for serialized Setup
  content. Extend their boundary generically to prove language remains absent
  and entry uses the Korean default rather than adding language-version
  fixtures.
- Visual verification compares Korean and English at desktop and narrow widths,
  including the masthead utilities and representative longest labels. It does
  not require a screenshot for every Agent or item.

---

## Acceptance Examples

- AE1. **Covers R1-R6, R19.** Given a fresh page in Korean, when the user opens
  Party Edit, targets one slot, selects filters, and switches to English, the
  same draft, target, filters, focus state, focused control, and candidate
  availability remain while all applicable copy changes to English.
- AE2. **Covers R5, R6, R15-R18, R21.** Given a complete applied party with a
  Setup selector open, one Result quantity expanded, and a source-owned
  operation visible, when the user switches language, values and selections are
  unchanged, the disclosure and selector remain open, surface headings change
  language, and the operation remains one surface-free row.
- AE3. **Covers R3, R4, R6, R18.** Given the user selects English and copies the
  current Setup, the copied address contains no language preference and the
  current page remains English. Opening that address as a new entry starts in
  Korean, restores the same carried Setup, initially views Focus, and
  recalculates the same Result.
- AE4. **Covers R7-R10.** Given one newly reachable translated identity lacks a
  Korean value, the common completeness gate fails without adding a named-item
  test. If an unexpected missing value nevertheless reaches the delivered
  client, its English value remains readable.
- AE5. **Covers R11.** Given the Party Edit candidate pool is open, switching
  between Korean and English reorders candidates by the selected displayed
  names but does not reorder occupied draft slots, the applied party, or Focus.
- AE6. **Covers R14, R19, R20.** At supported desktop and narrow widths, both
  language presentations keep the masthead utilities, longest current labels,
  Setup inputs, and Result readable without horizontal scrolling; the title and
  bilingual legal footer remain unchanged.

---

## Success Criteria

- A Korean-speaking visitor can understand and operate every current workbench
  surface without unexplained English outside the approved title, gauge terms,
  abbreviations, and game notation.
- A user can switch languages at any editing point without losing work,
  changing a calculated value, or altering a copied Setup.
- A maintainer can add reachable content through stable identities and receives
  one general failure for missing language coverage rather than maintaining a
  translation catalogue test.
- Planning can inventory and implement the localization surface without
  inventing persistence, shortcut, sorting, terminology, fallback, or state-
  preservation behavior.

---

## Scope Boundaries

- Do not add languages beyond Korean and English.
- Do not translate or catalogue unreachable future-version content solely for
  completeness.
- Do not add automatic translation, runtime terminology fetching, or external
  data synchronization.
- Do not add language-specific URLs, browser persistence, accounts, cookies,
  server-held preference, or language in the Setup shortcut.
- Do not change setup directions, candidates, representatives, preparation,
  calculations, Result meaning, source ownership, or operation admission.
- Do not redesign the footer or broader ZZZ visual system. Masthead changes are
  bounded to the approved Copy and current-language utility controls, their
  menu, and the layout work necessary for translated copy.
- Do not combine this feature with GitHub Actions artifact-retention policy or
  current Copy-PR finalization work.

---

## Key Decisions

- Korean is the default because the first announced community audience is
  Korean; English remains a complete selectable presentation.
- Language is page-local and shortcut-neutral so a copied Setup remains one
  immutable setup identity rather than multiplying URLs by presentation.
- Stable meaning identities keep localization independent from editable
  English copy while reusing current domain identity instead of building a
  second catalogue.
- Official game terminology governs game-owned names; concise adaptation
  governs workbench-owned UI language.
- Strict pre-release completeness prevents accidental mixed-language delivery,
  while English fallback prevents one unexpected miss from making the public
  client unusable.
- The Korean Result headings adapt the official recurring `초기` and `최종`
  wording without changing the existing three-surface calculation boundary.

---

## Dependencies / Assumptions

- `GV-005`, `GV-006`, and the rest of the current game vocabulary continue to
  own the meanings being named; localization supplies display values only.
- `SW-013`, `SW-016`, and `SW-022` continue to own Result projection, session
  and shortcut behavior, and the no-persistence boundary.
- `UI-002`, `UI-005`, and `UI-006` continue to own source presentation, viewed-
  Agent continuity, and Party Edit interaction presentation.
- The current English presentation is the English-language baseline. Korean
  terminology research may correct a Korean display value but cannot amend an
  underlying game meaning through this requirement.
