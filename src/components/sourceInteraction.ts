import { useEffect, useRef, useState } from 'react'
import type { AgentId } from '../workbench/content'
import type { AppliedSlot } from '../workbench/state'

export type SourceToneChannel = 'pointer' | 'focus'

export interface SourceInteractionProps {
  activeSourceTone: string | null
  onSourceToneChange: (channel: SourceToneChannel, tone: string | null) => void
}

const AGENT_SLOT_TONES = [
  'agent-slot-1',
  'agent-slot-2',
  'agent-slot-3',
] as const

export function agentSlotTone(slot: AppliedSlot): string {
  return AGENT_SLOT_TONES[slot]
}

export function agentToneForParty(
  agentId: AgentId,
  partyAgentIds: readonly AgentId[],
): string {
  const slot = partyAgentIds.indexOf(agentId)
  if (slot < 0 || slot > 2) {
    throw new Error(`Result source owner ${agentId} is not in the applied party`)
  }
  return agentSlotTone(slot as AppliedSlot)
}

export function sourceToneEvents(
  tone: string,
  onSourceToneChange: SourceInteractionProps['onSourceToneChange'],
) {
  return {
    onMouseEnter: () => onSourceToneChange('pointer', tone),
    onMouseLeave: () => onSourceToneChange('pointer', null),
    onFocus: () => onSourceToneChange('focus', tone),
    onBlur: () => onSourceToneChange('focus', null),
  }
}

export function useSelectionFocusReturn() {
  const openerRef = useRef<HTMLButtonElement>(null)
  const [shouldReturnFocus, setShouldReturnFocus] = useState(false)

  useEffect(() => {
    if (!shouldReturnFocus) return
    openerRef.current?.focus()
    setShouldReturnFocus(false)
  }, [shouldReturnFocus])

  return { openerRef, requestFocusReturn: () => setShouldReturnFocus(true) }
}
