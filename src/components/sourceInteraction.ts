import { useEffect, useRef, useState } from 'react'
import type { AgentId } from '../workbench/content'
import type { AppliedSlot } from '../workbench/state'

export type SourceToneChannel = 'pointer' | 'focus'

export interface SourceLink {
  tone: string
  targetAgentId: AgentId | null
}

export interface SourceInteractionProps {
  activeSourceTone: string | null
  onSourceToneChange: (
    channel: SourceToneChannel,
    tone: string | null,
    targetAgentId?: AgentId,
  ) => void
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
  targetAgentId?: AgentId,
) {
  const activate = (channel: SourceToneChannel) => targetAgentId === undefined
    ? onSourceToneChange(channel, tone)
    : onSourceToneChange(channel, tone, targetAgentId)

  return {
    onMouseEnter: () => activate('pointer'),
    onMouseLeave: () => onSourceToneChange('pointer', null),
    onFocus: () => activate('focus'),
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
