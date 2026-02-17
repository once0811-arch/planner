import { StyleSheet, Text, View } from "react-native";
import { TOKENS } from "../theme/tokens";
import { usePlanner } from "../context/PlannerContext";
import { AppScreen } from "../components/layout/AppScreen";
import { ScreenTitle } from "../components/common/ScreenTitle";
import { SurfaceCard } from "../components/common/SurfaceCard";
import { AppButton } from "../components/common/AppButton";

export function SettingsScreen() {
  const { settings, toggleJournalGenerateWithoutData, setGalleryPermissionState } = usePlanner();

  return (
    <AppScreen withOrbs>
      <View style={styles.header}>
        <ScreenTitle title="설정" subtitle="계정, 권한, 일지 생성 옵션" />
      </View>

      <View style={styles.content}>
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>계정</Text>
          <Text style={styles.rowLabel}>로그인 방식</Text>
          <Text style={styles.rowValue}>Google / Kakao (MVP)</Text>
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
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

        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>권한</Text>
          <Text style={styles.rowLabel}>갤러리 권한 상태</Text>
          <Text style={styles.rowValue}>{settings.galleryPermissionState}</Text>

          <View style={styles.permissionActions}>
            <AppButton label="갤러리 권한 승인하기" onPress={() => setGalleryPermissionState("granted")} />
            <AppButton
              label="권한 거부 상태로 보기"
              variant="secondary"
              onPress={() => setGalleryPermissionState("denied")}
            />
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
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.ink,
    fontSize: 15
  },
  rowLabel: {
    fontFamily: TOKENS.font.medium,
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
    minWidth: 72
  },
  permissionActions: {
    marginTop: TOKENS.space.xs,
    gap: TOKENS.space.xs
  }
});
