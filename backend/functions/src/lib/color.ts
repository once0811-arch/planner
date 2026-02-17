export function randomColorId(
  paletteSize = 8,
  randomSource: () => number = Math.random
): number {
  if (!Number.isFinite(paletteSize) || paletteSize <= 0) {
    return 0;
  }

  const raw = randomSource();
  const normalized = Math.min(Math.max(raw, 0), 0.999999999);
  return Math.floor(normalized * paletteSize);
}
