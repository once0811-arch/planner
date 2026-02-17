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

  return (
    <AppScreen>
      <View style={styles.header}>
        <ScreenTitle title="휴지통" subtitle="30일 보관 후 자동 삭제" />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {trashItems.length === 0 ? (
          <EmptyState message="휴지통이 비어 있어요." minHeight={140} />
        ) : (
          trashItems.map((item) => (
            <SurfaceCard key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>삭제일 {formatDateFromMs(item.deletedAtMs)}</Text>
              <Text style={styles.itemMeta}>완전삭제 {formatDateFromMs(item.purgeAtMs)}</Text>
              <View style={styles.restoreWrap}>
                <AppButton label="복구" variant="secondary" onPress={() => restoreTrashItem(item.id)} />
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
    gap: 4
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
