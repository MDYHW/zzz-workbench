export interface EquipmentCopyLine {
  text: string
  values: readonly number[]
}

export function equipmentLine(
  strings: TemplateStringsArray,
  ...values: readonly (EquipmentCopyLine | number | string)[]
): EquipmentCopyLine {
  let text = strings[0] ?? ''
  const captured: number[] = []
  values.forEach((value, index) => {
    if (typeof value === 'number') {
      text += value.toString()
      captured.push(value)
    } else if (typeof value === 'string') {
      text += value
    } else {
      text += value.text
      captured.push(...value.values)
    }
    text += strings[index + 1] ?? ''
  })
  return { text, values: captured }
}
