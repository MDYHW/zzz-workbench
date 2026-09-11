import {
  DRIVE_DISCS,
  MAIN_STATS,
  W_ENGINES,
  supportedAgents,
} from './.test/bridge.mjs'

const fixedMains = [
  { label: 'HP', value: '2200' },
  { label: 'ATK', value: '316' },
  { label: 'DEF', value: '184' },
]

function displayMain(id) {
  const stat = MAIN_STATS[id]
  const label = id.endsWith('Dmg') && id !== 'critDmg'
    ? `${stat.label} Bonus`
    : stat.label.replace(/%$/, '')
  return { label, value: `${stat.numericValue}${stat.unit === '' ? '' : '%'}` }
}

export function syntheticGear(state) {
  return {
    format: 'zzz-party-gear-display-v1',
    members: state.slots.map((slot, memberIndex) => ({
      agent: {
        id: 9_001 + memberIndex,
        workbenchId: slot.agentId,
        name: supportedAgents.find(({ workbenchId }) => workbenchId === slot.agentId).names.at(-1),
        level: 60,
        mindscape: slot.setup.mindscape,
      },
      weapon: {
        name: W_ENGINES[slot.setup.engineId].name,
        rarity: W_ENGINES[slot.setup.engineId].rank,
        level: 60,
        refinement: slot.setup.refinement,
      },
      discs: Array.from({ length: 6 }, (_, discIndex) => {
        const discId = discIndex < 4 ? slot.setup.fourPieceId : slot.setup.twoPieceId
        return {
          slot: discIndex + 1,
          name: DRIVE_DISCS[discId].name,
          rarity: 'S',
          level: 15,
          main: discIndex < 3
            ? fixedMains[discIndex]
            : displayMain(slot.setup.mains[`slot${discIndex + 1}`]),
          substats: [],
        }
      }),
    })),
  }
}
