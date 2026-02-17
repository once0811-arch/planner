import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { TOKENS } from "../theme/tokens";
import { usePlanner } from "../context/PlannerContext";
import { AppScreen } from "../components/layout/AppScreen";
import { ScreenTitle } from "../components/common/ScreenTitle";
import { SurfaceCard } from "../components/common/SurfaceCard";
import { AppButton } from "../components/common/AppButton";

export function SettingsScreen() {
  const {
    authSession,
    settings,
    toggleJournalGenerateWithoutData,
    signOutSession
  } = usePlanner();

  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (_error) {
      Alert.alert("설정 이동 실패", "기기 설정에서 직접 권한을 변경해 주세요.");
    }
  };

  const permissionLabelByState: Record<typeof settings.galleryPermissionState, string> = {
    unknown: "확인 필요",
    granted: "허용됨",
    denied: "거부됨",
    limited: "제한 허용"
  };

  return (
    <AppScreen withOrbs>
      <View style={styles.header}>
        <ScreenTitle title="설정" subtitle="계정/권한/자동 생성 정책을 여기서 관리" />
      </View>

      <View style={styles.content}>
        <SurfaceCard tone="raised" style={styles.card}>
          <Text style={styles.sectionTitle}>계정</Text>
          <Text style={styles.rowLabel}>로그인 방식</Text>
          <Text style={styles.rowValue}>
            {authSession.provider ? `${authSession.provider} (MVP)` : "Google / Kakao (MVP)"}
          </Text>
          <View style={styles.actionGroup}>
            <AppButton label="로그아웃" variant="secondary" onPress={signOutSession} />
          </View>
        </SurfaceCard>

        <SurfaceCard tone="raised" style={styles.card}>
          <Text style={styles.sectionTitle}>일지 옵션</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.rowLabel}>데이터가 없어도 생성</Text>
              <Text style={styles.rowHint}>일정 기반으로 자동 생성 시도</Text>
            </View>
            <AppButton
              label={settings.journalGenerateWithoutData ? "ON" : "OFF"}
              onPress={toggleJournalGenerateWithoutData}
              variant={settings.journalGenerateWithoutData ? "primary" : "secondary"}
              style={styles.toggleButton}
            />
          </View>
        </SurfaceCard>

        <SurfaceCard tone="raised" style={styles.card}>
          <Text style={styles.sectionTitle}>권한</Text>
          <Text style={styles.rowLabel}>갤러리 권한 상태</Text>
          <Text style={styles.rowValue}>{permissionLabelByState[settings.galleryPermissionState]}</Text>

          <View style={styles.actionGroup}>
            <AppButton label="갤러리 권한 승인하기" onPress={openAppSettings} />
          </View>
        </SurfaceCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: TOKENS.space.sm,
    paddingHorizontal: TOKENS.space.lg,
    paddingBottom: TOKENS.space.sm
  },
  content: {
    flex: 1,
    paddingHorizontal: TOKENS.space.lg,
    gap: TOKENS.space.sm,
    paddingBottom: TOKENS.space.lg
  },
  card: {
    padding: TOKENS.space.md,
    gap: TOKENS.space.sm
  },
  sectionTitle: {
    fontFamily: TOKENS.font.display,
    color: TOKENS.color.ink,
    fontSize: 24
  },
  rowLabel: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.ink,
    fontSize: 13
  },
  rowValue: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 12
  },
  rowHint: {
    marginTop: 2,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 11
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: TOKENS.space.sm
  },
  toggleTextWrap: {
    flex: 1
  },
  toggleButton: {
    minWidth: 74
  },
  actionGroup: {
    marginTop: TOKENS.space.xs,
    gap: TOKENS.space.xs
  }
});
