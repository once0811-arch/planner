import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { TOKENS } from "../../theme/tokens";

type ButtonVariant = "primary" | "secondary" | "warning";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({ label, onPress, variant = "primary", style }: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : null,
        variant === "secondary" ? styles.secondary : null,
        variant === "warning" ? styles.warning : null,
        pressed ? styles.pressed : null,
        style
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "secondary" ? styles.secondaryText : null,
          variant === "warning" ? styles.warningText : null
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 42,
    borderRadius: TOKENS.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  primary: {
    backgroundColor: TOKENS.color.accent,
    borderColor: TOKENS.color.accentDeep,
    shadowColor: TOKENS.color.accentDeep,
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 3
  },
  secondary: {
    backgroundColor: TOKENS.color.surface,
    borderColor: TOKENS.color.lineStrong
  },
  warning: {
    backgroundColor: "#FFEAD9",
    borderColor: "#D59B63"
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92
  },
  text: {
    fontFamily: TOKENS.font.bold,
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 0.2
  },
  secondaryText: {
    color: TOKENS.color.ink
  },
  warningText: {
    color: TOKENS.color.warning
  }
});
