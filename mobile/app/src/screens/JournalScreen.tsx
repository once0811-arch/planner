import { useMemo, useState } from "react";
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import type { JournalEntryType } from "../types/domain";
import { TOKENS, colorById } from "../theme/tokens";
import { usePlanner } from "../context/PlannerContext";
import { AppScreen } from "../components/layout/AppScreen";
import { ScreenTitle } from "../components/common/ScreenTitle";
import { SegmentedSwitch } from "../components/common/SegmentedSwitch";
import { FilterChip } from "../components/common/FilterChip";
import { SurfaceCard } from "../components/common/SurfaceCard";
import { EmptyState } from "../components/common/EmptyState";
import { AppButton } from "../components/common/AppButton";

const JOURNAL_TYPE_LABEL: Record<JournalEntryType, string> = {
  transport: "교통",
  stay: "숙소",
  todo: "즐길거리",
  shopping: "쇼핑",
  food: "음식",
  etc: "기타"
};

const JOURNAL_TYPES: Array<JournalEntryType | "all"> = [
  "all",
  "transport",
  "stay",
  "todo",
  "shopping",
  "food",
  "etc"
];

export function JournalScreen() {
  const {
    plans,
    journals,
    addManualJournal,
    updateJournalText,
    updateJournalImage,
    deleteJournal,
    toggleJournalPlanEnabled,
    settings,
    journalViewMode,
    setJournalViewMode,
    selectedJournalPlanId,
    setSelectedJournalPlanId,
    selectedJournalType,
    setSelectedJournalType
  } = usePlanner();
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");

  const selectedPlan = plans.find((plan) => plan.id === selectedJournalPlanId) ?? null;

  const filteredJournals = useMemo(() => {
    if (journalViewMode === "plan") {
      if (!selectedJournalPlanId) {
        return [];
      }
      return journals.filter((journal) => journal.planId === selectedJournalPlanId);
    }

    if (selectedJournalType === "all") {
      return journals;
    }

    return journals.filter((journal) => journal.type === selectedJournalType);
  }, [journals, journalViewMode, selectedJournalPlanId, selectedJournalType]);

  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (_error) {
      Alert.alert("설정 이동 실패", "기기 설정에서 직접 권한을 변경해 주세요.");
    }
  };

  const pickJournalImage = async (journalId: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "갤러리 접근을 허용해야 사진을 연결할 수 있어요.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.7
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    updateJournalImage(journalId, result.assets[0].uri);
  };

  return (
    <AppScreen withOrbs>
      <View style={styles.header}>
        <ScreenTitle title="일지" subtitle="여행이 끝난 뒤에도 하루 단위 기록을 다시 편집할 수 있어요" />
      </View>

      <View style={styles.modeRow}>
        <SegmentedSwitch
          value={journalViewMode}
          onChange={setJournalViewMode}
          options={[
            { label: "일정별 모아보기", value: "plan" },
            { label: "유형별 모아보기", value: "type" }
          ]}
        />
      </View>

      {settings.galleryPermissionState === "denied" ? (
        <SurfaceCard tone="raised" style={styles.permissionWarning}>
          <Text style={styles.permissionKicker}>GALLERY ACCESS</Text>
          <Text style={styles.permissionText}>갤러리에 접근해야 일지를 만들 수 있어요</Text>
          <View style={styles.permissionActionWrap}>
            <AppButton
              label="갤러리 권한 승인하기"
              variant="warning"
              onPress={openAppSettings}
            />
          </View>
        </SurfaceCard>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        {journalViewMode === "plan" ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {plans.map((plan) => (
              <FilterChip
                key={plan.id}
                label={plan.title}
                dotColor={colorById(plan.colorId)}
                active={selectedJournalPlanId === plan.id}
                onPress={() => setSelectedJournalPlanId(plan.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {JOURNAL_TYPES.map((type) => (
              <FilterChip
                key={type}
                label={type === "all" ? "전체" : JOURNAL_TYPE_LABEL[type]}
                active={selectedJournalType === type}
                onPress={() => setSelectedJournalType(type)}
              />
            ))}
          </ScrollView>
        )}

        {journalViewMode === "plan" && selectedPlan ? (
          <SurfaceCard tone="raised" style={styles.planControlCard}>
            <Text style={styles.planControlTitle}>{selectedPlan.title}</Text>
            <Text style={styles.planControlMeta}>
              {selectedPlan.journalEnabledAtMs === null ? "일지 미등록" : "일지 등록됨"}
            </Text>
            <View style={styles.planControlActions}>
              <AppButton
                label={selectedPlan.journalEnabledAtMs === null ? "이 일정 일지 등록" : "일지 등록 해제"}
                variant={selectedPlan.journalEnabledAtMs === null ? "primary" : "secondary"}
                onPress={() => toggleJournalPlanEnabled(selectedPlan.id)}
                style={styles.actionButton}
              />
              <AppButton
                label="직접 작성"
                variant="secondary"
                onPress={() => {
                  const now = new Date();
                  const dateLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
                    2,
                    "0"
                  )}-${String(now.getDate()).padStart(2, "0")}`;
                  addManualJournal(selectedPlan.id, dateLocal);
                }}
                style={styles.actionButton}
              />
            </View>
          </SurfaceCard>
        ) : null}

        {filteredJournals.length === 0 ? (
          <EmptyState
            message={
              journalViewMode === "plan" && selectedPlan?.journalEnabledAtMs === null
                ? "이 일정을 일지에 등록하면 자동 생성이 시작돼요"
                : "정보가 부족해 일지를 만들지 못 했어요"
            }
          />
        ) : (
          filteredJournals.map((journal) => (
            <SurfaceCard key={journal.id} tone="raised" style={styles.journalCard}>
              <View style={styles.journalImageArea}>
                {journal.imageUri ? (
                  <Image source={{ uri: journal.imageUri }} style={styles.journalImage} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={20} color={TOKENS.color.inkSoft} />
                    <Text style={styles.journalImageText}>사진 없음</Text>
                  </>
                )}
              </View>

              <View style={styles.journalBody}>
                <View style={styles.journalHeaderRow}>
                  <Text style={styles.journalDate}>{journal.dateLocal.replace(/-/g, ".")}</Text>
                  <Text style={styles.journalType}>{JOURNAL_TYPE_LABEL[journal.type]}</Text>
                </View>
                {editingJournalId === journal.id ? (
                  <TextInput
                    value={editingDraft}
                    onChangeText={setEditingDraft}
                    style={styles.editInput}
                    multiline
                  />
                ) : (
                  <Text style={styles.journalText}>{journal.text}</Text>
                )}

                <View style={styles.journalFooterRow}>
                  <Text style={styles.journalTag}>{journal.autoGenerated ? "자동" : "수동"}</Text>
                  {editingJournalId === journal.id ? (
                    <View style={styles.journalActions}>
                      <AppButton
                        label="저장"
                        onPress={() => {
                          updateJournalText(journal.id, editingDraft);
                          setEditingJournalId(null);
                          setEditingDraft("");
                        }}
                        style={styles.actionButton}
                      />
                      <AppButton
                        label="취소"
                        variant="secondary"
                        onPress={() => {
                          setEditingJournalId(null);
                          setEditingDraft("");
                        }}
                        style={styles.actionButton}
                      />
                    </View>
                  ) : (
                    <View style={styles.journalActions}>
                      <AppButton
                        label="사진"
                        variant="secondary"
                        onPress={() => pickJournalImage(journal.id)}
                        style={styles.actionButton}
                      />
                      {journal.imageUri ? (
                        <AppButton
                          label="사진삭제"
                          variant="secondary"
                          onPress={() => updateJournalImage(journal.id, null)}
                          style={styles.actionButton}
                        />
                      ) : null}
                      <AppButton
                        label="수정"
                        variant="secondary"
                        onPress={() => {
                          setEditingJournalId(journal.id);
                          setEditingDraft(journal.text);
                        }}
                        style={styles.actionButton}
                      />
                      <AppButton
                        label="삭제"
                        variant="secondary"
                        onPress={() =>
                          Alert.alert("일지를 삭제할까요?", "삭제된 일지는 휴지통에서 30일 내 복구할 수 있어요.", [
                            { text: "취소", style: "cancel" },
                            {
                              text: "삭제",
                              style: "destructive",
                              onPress: () => deleteJournal(journal.id)
                            }
                          ])
                        }
                        style={styles.actionButton}
                      />
                    </View>
                  )}
                </View>
              </View>
            </SurfaceCard>
          ))
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: TOKENS.space.sm,
    paddingHorizontal: TOKENS.space.lg,
    paddingBottom: TOKENS.space.sm
  },
  modeRow: {
    paddingHorizontal: TOKENS.space.lg
  },
  permissionWarning: {
    marginHorizontal: TOKENS.space.lg,
    marginTop: TOKENS.space.sm,
    borderColor: "#D59B63",
    backgroundColor: "#FFEFD9",
    padding: TOKENS.space.md,
    gap: TOKENS.space.xs
  },
  permissionKicker: {
    fontFamily: TOKENS.font.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: TOKENS.color.warning
  },
  permissionText: {
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.warning,
    fontSize: 13
  },
  permissionActionWrap: {
    alignSelf: "flex-start",
    marginTop: TOKENS.space.xs
  },
  content: {
    paddingVertical: TOKENS.space.md,
    paddingHorizontal: TOKENS.space.lg,
    gap: TOKENS.space.sm,
    paddingBottom: 120
  },
  filterRow: {
    gap: TOKENS.space.xs,
    paddingBottom: TOKENS.space.sm
  },
  planControlCard: {
    padding: TOKENS.space.md,
    gap: TOKENS.space.xs
  },
  planControlTitle: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.ink,
    fontSize: 14
  },
  planControlMeta: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 12
  },
  planControlActions: {
    marginTop: TOKENS.space.xs,
    flexDirection: "row",
    gap: TOKENS.space.xs
  },
  journalCard: {
    overflow: "hidden"
  },
  journalImageArea: {
    height: 94,
    borderBottomColor: TOKENS.color.line,
    borderBottomWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: TOKENS.color.bgMuted
  },
  journalImageText: {
    marginTop: 5,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 11
  },
  journalImage: {
    width: "100%",
    height: "100%"
  },
  journalBody: {
    padding: TOKENS.space.md,
    gap: TOKENS.space.sm
  },
  journalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  journalDate: {
    fontFamily: TOKENS.font.bold,
    fontSize: 13,
    color: TOKENS.color.ink
  },
  journalType: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.info,
    fontSize: 11
  },
  journalText: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.ink,
    fontSize: 13,
    lineHeight: 20
  },
  editInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: TOKENS.color.lineStrong,
    borderRadius: TOKENS.radius.sm,
    backgroundColor: TOKENS.color.surface,
    paddingHorizontal: TOKENS.space.sm,
    paddingVertical: TOKENS.space.xs,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.ink,
    fontSize: 13,
    lineHeight: 20,
    textAlignVertical: "top"
  },
  journalFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: TOKENS.space.sm
  },
  journalTag: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.inkSoft,
    fontSize: 10,
    letterSpacing: 1.1
  },
  journalActions: {
    flexDirection: "row",
    gap: TOKENS.space.xs
  },
  actionButton: {
    paddingVertical: 6,
    minWidth: 58
  }
});
