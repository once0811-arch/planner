import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { TOKENS } from "../../theme/tokens";

interface SurfaceCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SurfaceCard({ children, style }: SurfaceCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: TOKENS.radius.md,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    backgroundColor: TOKENS.color.surface
  }
});
