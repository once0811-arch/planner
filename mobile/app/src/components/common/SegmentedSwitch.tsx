import { Pressable, StyleSheet, Text, View } from "react-native";
import { TOKENS } from "../../theme/tokens";

interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedSwitchProps<T extends string> {
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (value: T) => void;
}

export function SegmentedSwitch<T extends string>({ value, options, onChange }: SegmentedSwitchProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              active ? styles.segmentActive : null,
              pressed ? styles.segmentPressed : null
            ]}
          >
            <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: TOKENS.space.sm
  },
  segment: {
    flex: 1,
    borderRadius: TOKENS.radius.sm,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    backgroundColor: TOKENS.color.surface,
    paddingVertical: 10,
    alignItems: "center"
  },
  segmentActive: {
    backgroundColor: TOKENS.color.accent,
    borderColor: TOKENS.color.accentDeep
  },
  segmentPressed: {
    opacity: 0.82
  },
  segmentText: {
    fontFamily: TOKENS.font.medium,
    fontSize: 12,
    color: TOKENS.color.ink
  },
  segmentTextActive: {
    color: "#fff"
  }
});
