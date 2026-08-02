import type { Dispatch } from 'react'
import {
  DISC_SUMMARIES,
  ENGINE_IDS_BY_POOL,
  SUBSTAT_CHOICES,
  SUBSTAT_KEYS,
  W_ENGINES,
  type EngineId,
} from '../workbench/content'
import type { WorkbenchAction, WorkbenchState } from '../workbench/state'

interface TargetSetupProps {
  state: WorkbenchState
  dispatch: Dispatch<WorkbenchAction>
}

function EquipmentArt({ variant }: { variant: 'engine' | 'disc' }) {
  return (
    <svg className={`equipment-art equipment-art--${variant}`} viewBox="0 0 90 90" role="img" aria-label={`${variant} artwork`}>
      <circle cx="45" cy="45" r="37" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      {variant === 'engine' ? (
        <>
          <path d="M28 69 19 45l15-26h23l14 25-9 25Z" fill="currentColor" opacity="0.16" />
          <path d="m28 69 17-48 17 48M19 45h52M34 19l11 26 12-26" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="45" cy="45" r="8" fill="currentColor" />
        </>
      ) : (
        <>
          <circle cx="45" cy="45" r="24" fill="currentColor" opacity="0.16" />
          <path d="m45 14 10 20 22 3-16 15 4 23-20-11-20 11 4-23-16-15 22-3Z" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="45" cy="45" r="7" fill="currentColor" />
        </>
      )}
    </svg>
  )
}

function EngineCandidate({
  engineId,
  selected,
  onSelect,
}: {
  engineId: EngineId
  selected: boolean
  onSelect: () => void
}) {
  const engine = W_ENGINES[engineId]

  return (
    <button
      type="button"
      className={`engine-candidate ${selected ? 'engine-candidate--selected' : ''}`}
      aria-pressed={selected}
      aria-label={`Select ${engine.name} ${engine.refinement}`}
      onClick={onSelect}
    >
      <div className="engine-candidate__art">
        <EquipmentArt variant="engine" />
        <span className={`rank-chip rank-chip--${engine.rank.toLowerCase()}`}>{engine.rank}</span>
      </div>
      <div className="engine-candidate__body">
        <div className="engine-name-line">
          <strong>{engine.name}</strong>
          <span>{engine.refinement}</span>
        </div>
        <div className="engine-stats">
          <span>Base ATK <b>{engine.baseAtk}</b></span>
          <span>{engine.advancedStat.label} <b>+{engine.advancedStat.value}%</b></span>
        </div>
        <ul>
          {engine.passiveLines.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
      {selected && <span className="selected-tab">CURRENT</span>}
    </button>
  )
}

export function TargetSetup({ state, dispatch }: TargetSetupProps) {
  const engineIds = ENGINE_IDS_BY_POOL[state.pool]

  return (
    <section className="setup-panel" aria-labelledby="setup-heading">
      <header className="panel-heading">
        <div>
          <span className="eyebrow">TARGET // 01</span>
          <h2 id="setup-heading">Yixuan setup</h2>
        </div>
        <span className="edit-state">EDITABLE</span>
      </header>

      <div className="upstream-strip" aria-label="Current upstream setup context">
        <span><small>MINDSCAPE</small><strong>M0</strong></span>
        <span><small>FOCUS</small><strong>Yixuan</strong></span>
        <span><small>PROGRESSION</small><strong>Lv.60 · Core max</strong></span>
      </div>

      <fieldset className="setup-group pool-fieldset">
        <legend><span>01</span> W-Engine pool</legend>
        <div className="segmented-control">
          <button
            type="button"
            className={state.pool === 'full' ? 'is-selected' : ''}
            aria-pressed={state.pool === 'full'}
            onClick={() => dispatch({ type: 'switchPool', pool: 'full' })}
          >
            Full pool
            <small>Limited + standard</small>
          </button>
          <button
            type="button"
            className={state.pool === 'nonLimited' ? 'is-selected' : ''}
            aria-pressed={state.pool === 'nonLimited'}
            onClick={() => dispatch({ type: 'switchPool', pool: 'nonLimited' })}
          >
            Non-limited
            <small>Standard + A-Rank</small>
          </button>
        </div>
      </fieldset>

      <fieldset className="setup-group">
        <legend><span>02</span> W-Engine · Rank default</legend>
        <div className={`engine-grid engine-grid--${engineIds.length}`}>
          {engineIds.map((engineId) => (
            <EngineCandidate
              key={engineId}
              engineId={engineId}
              selected={state.engineId === engineId}
              onSelect={() => dispatch({ type: 'selectEngine', engineId })}
            />
          ))}
        </div>
      </fieldset>

      <section className="setup-group prepared-block" aria-labelledby="disc-heading">
        <h3 id="disc-heading"><span>03</span> Prepared Drive Discs</h3>
        <div className="disc-grid">
          {[DISC_SUMMARIES.yunkui, DISC_SUMMARIES.woodpecker].map((disc, index) => (
            <article className="disc-summary" key={disc.name}>
              <EquipmentArt variant="disc" />
              <div>
                <small>{index === 0 ? '4-PIECE' : '2-PIECE'}</small>
                <strong>{disc.name}</strong>
                <p>{disc.effect}</p>
              </div>
            </article>
          ))}
        </div>
        <dl className="main-stat-grid" aria-label="Prepared main stats">
          {Object.entries(state.equipment?.mains ?? {}).map(([slot, value]) => (
            <div key={slot}>
              <dt>Disc {slot.replace('slot', '')}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <fieldset className="setup-group substat-fieldset">
        <legend><span>04</span> Effective substat hits</legend>
        <p className="field-note">Independent setup inputs · prepared at zero · range 0–36</p>
        <div className="substat-grid">
          {SUBSTAT_KEYS.map((key) => {
            const choice = SUBSTAT_CHOICES[key]
            const count = state.substats[key]
            return (
              <div className="substat-control" key={key}>
                <div className="substat-copy">
                  <strong>{choice.label}</strong>
                  <span>+{choice.perHit}{choice.unit} / hit</span>
                </div>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label={`Decrease ${choice.label} hits`}
                    disabled={count === 0}
                    onClick={() => dispatch({ type: 'adjustSubstat', key, delta: -1 })}
                  >−</button>
                  <output aria-live="polite" aria-label={`${choice.label} hit count`}>{count}</output>
                  <button
                    type="button"
                    aria-label={`Increase ${choice.label} hits`}
                    disabled={count === 36}
                    onClick={() => dispatch({ type: 'adjustSubstat', key, delta: 1 })}
                  >+</button>
                </div>
              </div>
            )
          })}
        </div>
      </fieldset>
    </section>
  )
}
