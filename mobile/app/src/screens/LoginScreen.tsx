import { StyleSheet, Text, View } from "react-native";
import { AppScreen } from "../components/layout/AppScreen";
import { ScreenTitle } from "../components/common/ScreenTitle";
import { SurfaceCard } from "../components/common/SurfaceCard";
import { AppButton } from "../components/common/AppButton";
import { TOKENS } from "../theme/tokens";
import { usePlanner } from "../context/PlannerContext";

export function LoginScreen() {
  const { signIn } = usePlanner();

  return (
    <AppScreen withOrbs>
      <View style={styles.root}>
        <Text style={styles.kicker}>TRAVEL BOARD</Text>
        <ScreenTitle
          title="Planner"
          subtitle="여행의 모든 예약, 메모, 일정, 기록을 한 화면에서 이어서 관리하세요."
        />

        <SurfaceCard tone="raised" style={styles.loginCard}>
          <View style={styles.ticketCutLeft} />
          <View style={styles.ticketCutRight} />

          <Text style={styles.cardTitle}>로그인</Text>
          <Text style={styles.cardSubtitle}>Google 또는 Kakao 계정으로 시작</Text>

          <View style={styles.actionWrap}>
            <AppButton label="Google로 로그인" onPress={() => signIn("google")} />
            <AppButton label="Kakao로 로그인" variant="secondary" onPress={() => signIn("kakao")} />
          </View>

          <Text style={styles.recoveryText}>
            계정 복구는 각 로그인 제공자 계정 센터에서 진행할 수 있어요.
          </Text>
        </SurfaceCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: TOKENS.space.lg,
    gap: TOKENS.space.md
  },
  kicker: {
    fontFamily: TOKENS.font.bold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: TOKENS.color.info
  },
  loginCard: {
    paddingHorizontal: TOKENS.space.lg,
    paddingVertical: TOKENS.space.xl,
    gap: TOKENS.space.sm,
    overflow: "hidden"
  },
  ticketCutLeft: {
    position: "absolute",
    left: -14,
    top: 76,
    width: 30,
    height: 30,
    borderRadius: TOKENS.radius.round,
    backgroundColor: TOKENS.color.bg
  },
  ticketCutRight: {
    position: "absolute",
    right: -14,
    top: 76,
    width: 30,
    height: 30,
    borderRadius: TOKENS.radius.round,
    backgroundColor: TOKENS.color.bg
  },
  cardTitle: {
    fontFamily: TOKENS.font.display,
    fontSize: 30,
    color: TOKENS.color.ink
  },
  cardSubtitle: {
    marginTop: -6,
    fontFamily: TOKENS.font.body,
    fontSize: 12,
    color: TOKENS.color.inkSoft
  },
  actionWrap: {
    marginTop: TOKENS.space.sm,
    gap: TOKENS.space.xs
  },
  recoveryText: {
    marginTop: TOKENS.space.sm,
    fontFamily: TOKENS.font.body,
    fontSize: 12,
    lineHeight: 18,
    color: TOKENS.color.inkSoft
  }
});
