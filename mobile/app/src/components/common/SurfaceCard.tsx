import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { TOKENS } from "../../theme/tokens";

type SurfaceTone = "default" | "raised" | "muted";

interface SurfaceCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: SurfaceTone;
}

export function SurfaceCard({ children, style, tone = "default" }: SurfaceCardProps) {
  return (
    <View
      style={[
        styles.card,
        tone === "raised" ? styles.raised : null,
        tone === "muted" ? styles.muted : null,
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: TOKENS.radius.md,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    backgroundColor: TOKENS.color.surface,
    shadowColor: "#121A22",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 3
  },
  raised: {
    backgroundColor: TOKENS.color.surfaceRaised,
    borderColor: TOKENS.color.lineStrong,
    shadowOpacity: 0.14,
    elevation: 5
  },
  muted: {
    backgroundColor: TOKENS.color.bgMuted,
    borderStyle: "dashed"
  }
});
