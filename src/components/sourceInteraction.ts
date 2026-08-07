import { useEffect, useRef, useState } from 'react'

export type SourceToneChannel = 'pointer' | 'focus'

export interface SourceInteractionProps {
  activeSourceTone: string | null
  onSourceToneChange: (channel: SourceToneChannel, tone: string | null) => void
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
