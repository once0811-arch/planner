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
      <Text style={[styles.label, active ? styles.labelActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: TOKENS.radius.round,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    backgroundColor: TOKENS.color.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  active: {
    borderColor: TOKENS.color.accentDeep,
    backgroundColor: TOKENS.color.accent,
    shadowColor: TOKENS.color.accentDeep,
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3
    },
    elevation: 2
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: TOKENS.radius.round
  },
  label: {
    fontFamily: TOKENS.font.medium,
    fontSize: 12,
    color: TOKENS.color.ink
  },
  labelActive: {
    color: "#FFFFFF",
    fontFamily: TOKENS.font.bold
  }
});
