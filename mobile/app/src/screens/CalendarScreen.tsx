import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { TripEvent } from "../types/domain";
import { usePlanner } from "../context/PlannerContext";
import { TOKENS, colorById } from "../theme/tokens";
import { AppScreen } from "../components/layout/AppScreen";
import { ScreenTitle } from "../components/common/ScreenTitle";
import { SurfaceCard } from "../components/common/SurfaceCard";
import { EmptyState } from "../components/common/EmptyState";
import { dateRange, formatDateLabel } from "../utils/format";

type CalendarMode = "overall" | "individual";

export function CalendarScreen() {
  const { sortedPlans, activePlanId, setActivePlanId, eventsByPlan, dayMemosByPlan } = usePlanner();
  const [mode, setMode] = useState<CalendarMode>("overall");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activePlan = useMemo(
    () => sortedPlans.find((plan) => plan.id === activePlanId) ?? sortedPlans[0] ?? null,
    [sortedPlans, activePlanId]
  );

  const individualDates = useMemo(() => {
    if (!activePlan) {
      return [];
    }
    return dateRange(activePlan.startDateLocal, activePlan.endDateLocal);
  }, [activePlan]);

  useEffect(() => {
    if (!individualDates.length) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate((current) => (current && individualDates.includes(current) ? current : individualDates[0]));
  }, [individualDates]);

  const dailyEvents: TripEvent[] = useMemo(() => {
    if (!activePlan || !selectedDate) {
      return [];
    }
    return (eventsByPlan[activePlan.id] ?? []).filter((event) => event.dateLocal === selectedDate);
  }, [activePlan, selectedDate, eventsByPlan]);

  const dailyMemo = useMemo(() => {
    if (!activePlan || !selectedDate) {
      return null;
    }
    return (dayMemosByPlan[activePlan.id] ?? []).find((memo) => memo.dateLocal === selectedDate)?.memo ?? null;
  }, [activePlan, selectedDate, dayMemosByPlan]);

  return (
    <AppScreen>
      <View style={styles.header}>
        <ScreenTitle title="캘린더" />
        <View style={styles.modeDropWrap}>
          <TouchableOpacity style={styles.modeButton} onPress={() => setModeMenuOpen((prev) => !prev)}>
            <Text style={styles.modeButtonText}>{mode === "overall" ? "전체일정" : "개별일정"}</Text>
            <Ionicons name={modeMenuOpen ? "chevron-up" : "chevron-down"} size={16} color={TOKENS.color.ink} />
          </TouchableOpacity>

          {modeMenuOpen ? (
            <SurfaceCard style={styles.modeMenu}>
              <Pressable
                style={styles.modeMenuItem}
                onPress={() => {
                  setMode("overall");
                  setModeMenuOpen(false);
                }}
              >
                <Text style={styles.modeMenuText}>전체일정</Text>
              </Pressable>
              <Pressable
                style={styles.modeMenuItem}
                onPress={() => {
                  setMode("individual");
                  setModeMenuOpen(false);
                }}
              >
                <Text style={styles.modeMenuText}>개별일정</Text>
              </Pressable>
            </SurfaceCard>
          ) : null}
        </View>
      </View>

      <View style={styles.main}>
        <ScrollView contentContainerStyle={styles.content}>
          {mode === "overall" ? (
            <View style={styles.blockSection}>
              {sortedPlans.map((plan) => (
                <Pressable
                  key={plan.id}
                  style={({ pressed }) => [pressed ? styles.pressed : null]}
                  onPress={() => {
                    setActivePlanId(plan.id);
                    setMode("individual");
                  }}
                >
                  <SurfaceCard style={[styles.overallBlock, { borderLeftColor: colorById(plan.colorId) }]}>
                    <Text style={styles.overallTitle}>{plan.title}</Text>
                    <Text style={styles.overallMeta}>{plan.destination}</Text>
                    <Text style={styles.overallMeta}>
                      {formatDateLabel(plan.startDateLocal)} ~ {formatDateLabel(plan.endDateLocal)}
                    </Text>
                  </SurfaceCard>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.blockSection}>
              {activePlan ? (
                individualDates.map((dateLocal) => {
                  const events = (eventsByPlan[activePlan.id] ?? []).filter((event) => event.dateLocal === dateLocal);
                  const previewBlocks = events.slice(0, 3);
                  const extraCount = events.length - previewBlocks.length;

                  return (
                    <Pressable
                      key={dateLocal}
                      style={({ pressed }) => [pressed ? styles.pressed : null]}
                      onPress={() => setSelectedDate(dateLocal)}
                    >
                      <SurfaceCard
                        style={[
                          styles.dayCard,
                          selectedDate === dateLocal ? styles.dayCardSelected : null
                        ]}
                      >
                        <Text style={styles.dayLabel}>{formatDateLabel(dateLocal)}</Text>

                        <View style={styles.stackWrap}>
                          {previewBlocks.length === 0 ? (
                            <View style={styles.emptyStackBlock}>
                              <Text style={styles.emptyStackText}>이벤트 없음</Text>
                            </View>
                          ) : (
                            previewBlocks.map((event) => (
                              <View
                                key={event.id}
                                style={[styles.eventStackBlock, { backgroundColor: colorById(event.colorId) }]}
                              >
                                <Text numberOfLines={1} style={styles.eventStackText}>
                                  {event.title}
                                </Text>
                              </View>
                            ))
                          )}

                          {extraCount > 0 ? <Text style={styles.moreLabel}>+{extraCount}</Text> : null}
                        </View>
                      </SurfaceCard>
                    </Pressable>
                  );
                })
              ) : (
                <EmptyState message="플랜을 먼저 선택해 주세요." minHeight={100} />
              )}
            </View>
          )}
        </ScrollView>

        <SurfaceCard style={styles.bottomPanel}>
          <Text style={styles.bottomTitle}>선택 일자 상세</Text>
          <Text style={styles.bottomDate}>{selectedDate ? formatDateLabel(selectedDate) : "날짜 없음"}</Text>

          {dailyEvents.length === 0 ? (
            <Text style={styles.bottomEmpty}>해당 일자에 이벤트가 없습니다.</Text>
          ) : (
            <View style={styles.bottomEventsWrap}>
              {dailyEvents.map((event) => (
                <View key={event.id} style={styles.bottomEventRow}>
                  <View style={[styles.bottomDot, { backgroundColor: colorById(event.colorId) }]} />
                  <View style={styles.flex}>
                    <Text style={styles.bottomEventTitle}>{event.title}</Text>
                    <Text style={styles.bottomEventMeta}>
                      {event.startTimeLocal ?? "시간 미정"} · {event.category ?? "기타"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.memoTitle}>메모</Text>
          <Text style={styles.memoText}>{dailyMemo ?? "메모 없음"}</Text>
        </SurfaceCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  header: {
    paddingTop: TOKENS.space.sm,
    paddingHorizontal: TOKENS.space.lg,
    paddingBottom: TOKENS.space.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  modeDropWrap: {
    position: "relative"
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    borderRadius: TOKENS.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: TOKENS.color.surface
  },
  modeButtonText: {
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.ink,
    fontSize: 13
  },
  modeMenu: {
    position: "absolute",
    top: 42,
    right: 0,
    width: 116,
    overflow: "hidden",
    zIndex: 9
  },
  modeMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 10
  },
  modeMenuText: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.ink,
    fontSize: 13
  },
  main: {
    flex: 1,
    paddingHorizontal: TOKENS.space.lg,
    paddingBottom: TOKENS.space.sm,
    gap: TOKENS.space.sm
  },
  content: {
    gap: TOKENS.space.sm,
    paddingBottom: TOKENS.space.sm
  },
  blockSection: {
    gap: TOKENS.space.sm
  },
  overallBlock: {
    borderLeftWidth: 8,
    padding: TOKENS.space.md,
    gap: 3
  },
  overallTitle: {
    fontFamily: TOKENS.font.bold,
    fontSize: 16,
    color: TOKENS.color.ink
  },
  overallMeta: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 12
  },
  dayCard: {
    padding: TOKENS.space.md,
    gap: TOKENS.space.sm
  },
  dayCardSelected: {
    borderColor: TOKENS.color.accent
  },
  dayLabel: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.ink,
    fontSize: 14
  },
  stackWrap: {
    gap: TOKENS.space.xs
  },
  emptyStackBlock: {
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: TOKENS.color.line,
    paddingVertical: 8,
    paddingHorizontal: TOKENS.space.sm
  },
  emptyStackText: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 12
  },
  eventStackBlock: {
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: TOKENS.space.sm
  },
  eventStackText: {
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.ink,
    fontSize: 12
  },
  moreLabel: {
    marginTop: 2,
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.accentDeep,
    fontSize: 12
  },
  bottomPanel: {
    padding: TOKENS.space.md,
    maxHeight: 240
  },
  bottomTitle: {
    fontFamily: TOKENS.font.display,
    color: TOKENS.color.ink,
    fontSize: 22
  },
  bottomDate: {
    marginTop: 2,
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.inkSoft,
    fontSize: 12
  },
  bottomEmpty: {
    marginTop: TOKENS.space.sm,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 12
  },
  bottomEventsWrap: {
    marginTop: TOKENS.space.xs,
    gap: TOKENS.space.sm
  },
  bottomEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: TOKENS.space.sm
  },
  bottomDot: {
    width: 10,
    height: 10,
    borderRadius: 99
  },
  bottomEventTitle: {
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.ink,
    fontSize: 13
  },
  bottomEventMeta: {
    marginTop: 1,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 11
  },
  memoTitle: {
    marginTop: TOKENS.space.sm,
    fontFamily: TOKENS.font.bold,
    fontSize: 12,
    color: TOKENS.color.ink
  },
  memoText: {
    marginTop: 2,
    fontFamily: TOKENS.font.body,
    fontSize: 12,
    color: TOKENS.color.inkSoft
  },
  pressed: {
    opacity: 0.82
  }
});
