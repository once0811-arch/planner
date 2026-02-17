export const TOKENS = {
  color: {
    bg: "#F6F2E9",
    bgMuted: "#EEE5D8",
    surface: "#FFFDF8",
    ink: "#1D2127",
    inkSoft: "#545C67",
    line: "#D8CCBC",
    accent: "#E96A4B",
    accentDeep: "#B74D37",
    success: "#2F7A4B",
    warning: "#B66A18",
    palette: [
      "#E89A7D",
      "#A6C6B7",
      "#8FB8D8",
      "#E3C38C",
      "#D2A8C8",
      "#9DC9C3",
      "#B8B1E5",
      "#E2B0A0"
    ]
  },
  space: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 30
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
