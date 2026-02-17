import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TOKENS } from "../theme/tokens";
import { usePlanner } from "../context/PlannerContext";
import { AppScreen } from "../components/layout/AppScreen";
import { ScreenTitle } from "../components/common/ScreenTitle";
import { SurfaceCard } from "../components/common/SurfaceCard";
import { EmptyState } from "../components/common/EmptyState";
import { AppButton } from "../components/common/AppButton";
import { formatDateFromMs } from "../utils/format";

export function TrashScreen() {
  const { trashItems, restoreTrashItem } = usePlanner();

  const isRestorable = (item: (typeof trashItems)[number]) => {
    if (item.entityType === "journalEntry") {
      return Boolean(item.snapshotJournal);
    }
    if (item.entityType === "event") {
      return Boolean(item.snapshotEvent);
    }
    if (item.entityType === "dayMemo") {
      return Boolean(item.snapshotDayMemo);
    }
    if (item.entityType === "plan") {
      return Boolean(item.snapshotPlan);
    }
    return false;
  };

  return (
    <AppScreen withOrbs>
      <View style={styles.header}>
        <ScreenTitle title="휴지통" subtitle="삭제된 항목은 30일 후 자동으로 정리됩니다" />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {trashItems.length === 0 ? (
          <EmptyState message="휴지통이 비어 있어요." minHeight={140} />
        ) : (
          trashItems.map((item) => (
            <SurfaceCard key={item.id} tone="raised" style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>삭제일 {formatDateFromMs(item.deletedAtMs)}</Text>
              <Text style={styles.itemMeta}>완전삭제 {formatDateFromMs(item.purgeAtMs)}</Text>
              <View style={styles.restoreWrap}>
                <AppButton
                  label={isRestorable(item) ? "복구" : "복구 불가"}
                  variant="secondary"
                  onPress={() => {
                    if (!isRestorable(item)) {
                      return;
                    }
                    restoreTrashItem(item.id);
                  }}
                />
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
  list: {
    paddingHorizontal: TOKENS.space.lg,
    paddingBottom: 44,
    gap: TOKENS.space.sm
  },
  itemCard: {
    padding: TOKENS.space.md,
    gap: 5
  },
  itemTitle: {
    fontFamily: TOKENS.font.bold,
    fontSize: 14,
    color: TOKENS.color.ink
  },
  itemMeta: {
    fontFamily: TOKENS.font.body,
    fontSize: 12,
    color: TOKENS.color.inkSoft
  },
  restoreWrap: {
    marginTop: TOKENS.space.sm,
    alignSelf: "flex-start"
  }
});
