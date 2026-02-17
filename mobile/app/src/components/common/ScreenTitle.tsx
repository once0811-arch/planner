import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { TOKENS } from "../../theme/tokens";

interface ScreenTitleProps {
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

export function ScreenTitle({ title, subtitle, style }: ScreenTitleProps) {
  return (
    <View style={style}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: TOKENS.font.display,
    fontSize: 29,
    color: TOKENS.color.ink
  },
  subtitle: {
    marginTop: 2,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 12
  }
});
