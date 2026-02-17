export const TOKENS = {
  color: {
    bg: "#F4EFE6",
    bgMuted: "#E8DDCD",
    bgDeep: "#1D2A36",
    surface: "#FFFBF3",
    surfaceRaised: "#FFF5E8",
    ink: "#1E2732",
    inkSoft: "#5B6675",
    line: "#D5C5AE",
    lineStrong: "#B59D7F",
    accent: "#EF6B3B",
    accentDeep: "#C34B27",
    accentSoft: "#FFE4D4",
    info: "#2B758B",
    success: "#2F7A4B",
    warning: "#A86421",
    shadow: "rgba(20, 30, 40, 0.16)",
    palette: [
      "#F08A5D",
      "#60A3A8",
      "#5D8AA8",
      "#E6B566",
      "#78A978",
      "#D27D7D",
      "#8AA7D6",
      "#B9956A"
    ]
  },
  space: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    xxl: 36
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    round: 999
  },
  font: {
    display: "DoHyeon_400Regular",
    body: "NotoSansKR_400Regular",
    medium: "NotoSansKR_500Medium",
    bold: "NotoSansKR_700Bold"
  }
} as const;

export function colorById(colorId: number) {
  const palette = TOKENS.color.palette;
  return palette[((colorId % palette.length) + palette.length) % palette.length];
}
