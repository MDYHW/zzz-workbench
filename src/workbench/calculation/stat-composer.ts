import type { SurfaceKey } from '../effects'
import type { PresentationDetail } from '../../presentation'
import type { SelectedSourceInstance } from './source-instance'

export type StatId =
  | 'maxHp'
  | 'atk'
  | 'def'
  | 'impact'
  | 'energyRegen'
  | 'critRate'
  | 'critDmg'
  | 'anomalyProficiency'
  | 'anomalyMastery'
  | 'penRatio'

export type StatRegion = 'base' | 'percentage' | 'flat'

export interface BaseStatAtom {
  statId: StatId
  region: 'base'
  earliestSurface: 'initial'
  value: number
  source: SelectedSourceInstance
  sourceDetail?: PresentationDetail
}

export interface DerivedStatAtom {
  statId: StatId
  region: 'percentage' | 'flat'
  earliestSurface: SurfaceKey
  value: number
  source: SelectedSourceInstance
  sourceDetail?: PresentationDetail
}

export type StatAtom = BaseStatAtom | DerivedStatAtom

export interface StatContribution {
  atom: StatAtom
  rawValue: number
  derivedValue: number
}

export interface ComposedStat {
  values: Record<SurfaceKey, number>
  contributions: Record<SurfaceKey, StatContribution[]>
  disclosedContributions: Record<SurfaceKey, StatContribution[]>
}

export interface AutomaticEnergyRecoveryOperation {
  earliestSurface: SurfaceKey
  value: number
  source: SelectedSourceInstance
  sourceDetail?: PresentationDetail
}

export interface ComposedAutomaticEnergyRecovery {
  values: Record<SurfaceKey, number>
  operations: Record<SurfaceKey, AutomaticEnergyRecoveryOperation[]>
  disclosedOperations: Record<SurfaceKey, AutomaticEnergyRecoveryOperation[]>
}

const surfaces: readonly SurfaceKey[] = ['initial', 'combat', 'fully']

const emptySurfaceRecord = <Value>(value: Value): Record<SurfaceKey, Value> => ({
  initial: value,
  combat: value,
  fully: value,
})

function activeAt(atom: { earliestSurface: SurfaceKey }, surface: SurfaceKey): boolean {
  return surfaces.indexOf(atom.earliestSurface) <= surfaces.indexOf(surface)
}

function validateAtoms(statId: StatId, atoms: readonly StatAtom[]): void {
  for (const atom of atoms) {
    if (atom.statId !== statId) {
      throw new Error(`Cannot compose ${statId} from a ${atom.statId} atom`)
    }
    if (!Number.isFinite(atom.value)) {
      throw new Error(`Stat atom values must be finite (${statId})`)
    }
    if (atom.region === 'base' && atom.earliestSurface !== 'initial') {
      throw new Error('Base stat atoms must be available on the initial surface')
    }
  }
}

const disclosedContributions = (items: readonly StatContribution[]): StatContribution[] =>
  items.filter(({ atom }) => atom.source.definition.visibility === 'visible')

const disclosedOperations = (
  items: readonly AutomaticEnergyRecoveryOperation[],
): AutomaticEnergyRecoveryOperation[] =>
  items.filter(({ source }) => source.definition.visibility === 'visible')

const contribution = (atom: StatAtom, derivedValue: number): StatContribution => ({
  atom,
  rawValue: atom.value,
  derivedValue,
})

/**
 * Composes one stat through the shared base, percentage, and flat regions.
 * Combat and fully enabled percentages always read Initial, never the Combat
 * total. Initial and later flat regions remain additive on their own surface.
 */
export function composeStat(statId: StatId, atoms: readonly StatAtom[]): ComposedStat {
  validateAtoms(statId, atoms)

  const base = atoms
    .filter((atom): atom is BaseStatAtom => atom.region === 'base')
    .reduce((total, atom) => total + atom.value, 0)
  const initialPercentages = atoms
    .filter((atom) => atom.region === 'percentage' && atom.earliestSurface === 'initial')
    .reduce((total, atom) => total + atom.value, 0)
  const initialFlats = atoms
    .filter((atom) => atom.region === 'flat' && atom.earliestSurface === 'initial')
    .reduce((total, atom) => total + atom.value, 0)
  const initial = base * (1 + initialPercentages / 100) + initialFlats
  const valueAt = (surface: SurfaceKey): number => {
    if (surface === 'initial') return initial
    const combatPercentages = atoms
      .filter((atom) => atom.region === 'percentage' && activeAt(atom, surface) && atom.earliestSurface !== 'initial')
      .reduce((total, atom) => total + atom.value, 0)
    const laterFlats = atoms
      .filter((atom) => atom.region === 'flat' && activeAt(atom, surface) && atom.earliestSurface !== 'initial')
      .reduce((total, atom) => total + atom.value, 0)
    return initial * (1 + combatPercentages / 100) + laterFlats
  }

  const values = emptySurfaceRecord(valueAt('initial'))
  const contributions = emptySurfaceRecord<StatContribution[]>([])
  const contributionsAt = (surface: SurfaceKey): StatContribution[] => atoms
    .filter((atom) => atom.earliestSurface === surface)
    .map((atom) => contribution(
      atom,
      atom.region === 'percentage'
        ? (atom.earliestSurface === 'initial' ? base : initial) * atom.value / 100
        : atom.value,
    ))
  const initialContributions = contributionsAt('initial')
  contributions.initial = initialContributions

  for (const surface of ['combat', 'fully'] as const) {
    values[surface] = valueAt(surface)
    contributions[surface] = contributionsAt(surface)
  }

  return {
    values,
    contributions,
    disclosedContributions: {
      initial: disclosedContributions(contributions.initial),
      combat: disclosedContributions(contributions.combat),
      fully: disclosedContributions(contributions.fully),
    },
  }
}

/** Adds fixed automatic Energy recovery after Energy Regen percentage composition. */
export function composeAutomaticEnergyRecovery(
  energyRegen: ComposedStat,
  operations: readonly AutomaticEnergyRecoveryOperation[],
): ComposedAutomaticEnergyRecovery {
  for (const operation of operations) {
    if (!Number.isFinite(operation.value)) {
      throw new Error('Automatic Energy recovery values must be finite')
    }
  }

  const values = emptySurfaceRecord(0)
  const appliedOperations = emptySurfaceRecord<AutomaticEnergyRecoveryOperation[]>([])
  for (const surface of surfaces) {
    const activeOperations = operations.filter((operation) => activeAt(operation, surface))
    appliedOperations[surface] = operations.filter(
      (operation) => operation.earliestSurface === surface,
    )
    values[surface] = energyRegen.values[surface] + activeOperations.reduce(
      (total, operation) => total + operation.value, 0,
    )
  }

  return {
    values,
    operations: appliedOperations,
    disclosedOperations: {
      initial: disclosedOperations(appliedOperations.initial),
      combat: disclosedOperations(appliedOperations.combat),
      fully: disclosedOperations(appliedOperations.fully),
    },
  }
}
