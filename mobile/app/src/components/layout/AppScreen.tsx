import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TOKENS } from "../../theme/tokens";

interface AppScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  withOrbs?: boolean;
  edges?: Array<"top" | "left" | "right" | "bottom">;
}

export function AppScreen({
  children,
  style,
  withOrbs = false,
  edges = ["top", "left", "right"]
}: AppScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      <View style={[styles.screen, style]}>
        <View style={styles.ribbon} />
        <View style={styles.gridVerticalA} />
        <View style={styles.gridVerticalB} />
        <View style={styles.gridHorizontalA} />
        <View style={styles.gridHorizontalB} />

        {withOrbs ? (
          <>
            <View style={styles.orbTop} />
            <View style={styles.orbBottom} />
            <View style={styles.ticketCut} />
          </>
        ) : null}

        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.color.bg
  },
  screen: {
    flex: 1,
    backgroundColor: TOKENS.color.bg,
    overflow: "hidden"
  },
  ribbon: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: TOKENS.color.bgMuted,
    opacity: 0.55
  },
  gridVerticalA: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 84,
    width: 1,
    backgroundColor: TOKENS.color.line,
    opacity: 0.25
  },
  gridVerticalB: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 74,
    width: 1,
    backgroundColor: TOKENS.color.line,
    opacity: 0.22
  },
  gridHorizontalA: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 186,
    height: 1,
    backgroundColor: TOKENS.color.line,
    opacity: 0.18
  },
  gridHorizontalB: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 162,
    height: 1,
    backgroundColor: TOKENS.color.line,
    opacity: 0.16
  },
  orbTop: {
    position: "absolute",
    top: -118,
    right: -74,
    width: 248,
    height: 248,
    borderRadius: TOKENS.radius.round,
    backgroundColor: TOKENS.color.accentSoft,
    opacity: 0.52
  },
  orbBottom: {
    position: "absolute",
    bottom: -132,
    left: -104,
    width: 290,
    height: 290,
    borderRadius: TOKENS.radius.round,
    backgroundColor: "#D6E6EC",
    opacity: 0.58
  },
  ticketCut: {
    position: "absolute",
    top: 98,
    right: -28,
    width: 112,
    height: 112,
    borderRadius: TOKENS.radius.round,
    backgroundColor: TOKENS.color.bg,
    borderWidth: 2,
    borderColor: TOKENS.color.bgMuted,
    opacity: 0.75
  }
});
