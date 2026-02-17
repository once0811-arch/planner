import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DoHyeon_400Regular, useFonts as useDisplayFonts } from "@expo-google-fonts/do-hyeon";
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold,
  useFonts as useBodyFonts
} from "@expo-google-fonts/noto-sans-kr";
import { PlannerProvider } from "./src/context/PlannerContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { TOKENS } from "./src/theme/tokens";

export default function App() {
  const [displayFontsLoaded] = useDisplayFonts({
    DoHyeon_400Regular
  });
  const [bodyFontsLoaded] = useBodyFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold
  });

  if (!displayFontsLoaded || !bodyFontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={TOKENS.color.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <PlannerProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </PlannerProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  splash: {
    flex: 1,
    backgroundColor: TOKENS.color.bg,
    alignItems: "center",
    justifyContent: "center"
  }
});
