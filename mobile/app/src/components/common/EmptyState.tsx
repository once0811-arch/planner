import { StyleSheet, Text, View } from "react-native";
import { TOKENS } from "../../theme/tokens";
import { SurfaceCard } from "./SurfaceCard";

interface EmptyStateProps {
  message: string;
  dashed?: boolean;
  minHeight?: number;
}

export function EmptyState({ message, dashed = true, minHeight = 120 }: EmptyStateProps) {
  return (
    <SurfaceCard
      style={[
        styles.card,
        dashed ? styles.dashed : null,
        {
          minHeight
        }
      ]}
    >
      <View style={styles.center}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden"
  },
  dashed: {
    borderStyle: "dashed"
  },
  center: {
    flex: 1,
    minHeight: 90,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: TOKENS.space.md
  },
  text: {
    fontFamily: TOKENS.font.body,
    fontSize: 13,
    color: TOKENS.color.inkSoft,
    textAlign: "center"
  }
});
