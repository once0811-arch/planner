import { Pressable, StyleSheet, Text, View } from "react-native";
import { TOKENS } from "../../theme/tokens";

interface FilterChipProps {
  label: string;
  active?: boolean;
  dotColor?: string;
  onPress: () => void;
}

export function FilterChip({ label, active = false, dotColor, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active ? styles.active : null, pressed ? styles.pressed : null]}
    >
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    backgroundColor: TOKENS.color.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  active: {
    borderColor: TOKENS.color.accent,
    backgroundColor: "#FFF0EC"
  },
  pressed: {
    opacity: 0.8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99
  },
  label: {
    fontFamily: TOKENS.font.medium,
    fontSize: 12,
    color: TOKENS.color.ink
  }
});
