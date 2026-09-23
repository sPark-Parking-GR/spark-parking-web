export function cssVarsFor(...maps: Array<Record<string, string | number>>): string {
  return maps
    .flatMap((map) => Object.entries(map))
    .map(([key, value]) => `--${key}:${typeof value === 'number' ? `${value}px` : value};`)
    .join('')
}
