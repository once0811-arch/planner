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
    borderRadius: TOKENS.radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  primary: {
    backgroundColor: TOKENS.color.accent,
    borderWidth: 1,
    borderColor: TOKENS.color.accentDeep
  },
  secondary: {
    backgroundColor: TOKENS.color.surface,
    borderWidth: 1,
    borderColor: TOKENS.color.line
  },
  warning: {
    backgroundColor: "#FEEED9",
    borderWidth: 1,
    borderColor: "#D9A36A"
  },
  pressed: {
    opacity: 0.82
  },
  text: {
    fontFamily: TOKENS.font.medium,
    color: "#fff",
    fontSize: 12
  },
  secondaryText: {
    color: TOKENS.color.ink
  },
  warningText: {
    color: TOKENS.color.warning
  }
});
