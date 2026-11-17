/** Picks black or white text so it stays readable on top of a hex background colour. */
export const readableTextColor = (color: string) => {
  const hex = color.replace('#', '')
  if (!/^[\da-f]{6}$/i.test(hex)) return '#ffffff'

  const channel = (index: number) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
  return luminance > 0.179 ? '#20251f' : '#ffffff'
}
