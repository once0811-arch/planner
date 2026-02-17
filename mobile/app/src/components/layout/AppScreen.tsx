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
        {withOrbs ? (
          <>
            <View style={styles.orbTop} />
            <View style={styles.orbBottom} />
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
    backgroundColor: TOKENS.color.bg
  },
  orbTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 200,
    backgroundColor: "#F2C9A8",
    opacity: 0.45
  },
  orbBottom: {
    position: "absolute",
    bottom: -120,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 220,
    backgroundColor: "#CCD9E8",
    opacity: 0.5
  }
});
