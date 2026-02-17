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
import { FilterChip } from "../components/common/FilterChip";
import { formatDateLabel } from "../utils/format";
import { buildIndividualStacks, buildMonthGrid, buildOverallStacks } from "../calendar/monthView";

type CalendarMode = "overall" | "individual";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function shiftMonth(dateLocal: string, gap: number) {
  const [yearRaw, monthRaw] = dateLocal.split("-").map(Number);
  const date = new Date(Date.UTC(yearRaw, monthRaw - 1 + gap, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function monthTitle(dateLocal: string) {
  const [year, month] = dateLocal.split("-");
  return `${year}.${month}`;
}

export function CalendarScreen() {
  const { sortedPlans, activePlanId, setActivePlanId, eventsByPlan, dayMemosByPlan } = usePlanner();
  const [mode, setMode] = useState<CalendarMode>("overall");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [anchorDateLocal, setAnchorDateLocal] = useState("2026-04-01");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activePlan = useMemo(
    () => sortedPlans.find((plan) => plan.id === activePlanId) ?? sortedPlans[0] ?? null,
    [sortedPlans, activePlanId]
  );

  useEffect(() => {
    if (activePlan) {
      setAnchorDateLocal(`${activePlan.startDateLocal.slice(0, 7)}-01`);
    }
  }, [activePlan?.id]);

  const monthCells = useMemo(() => buildMonthGrid(anchorDateLocal), [anchorDateLocal]);

  useEffect(() => {
    const inMonthFirst = monthCells.find((cell) => cell.inCurrentMonth)?.dateLocal ?? null;
    setSelectedDate((current) => (current && monthCells.some((cell) => cell.dateLocal === current) ? current : inMonthFirst));
  }, [monthCells]);

  const dailyEvents: TripEvent[] = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    if (mode === "individual") {
      if (!activePlan) {
        return [];
      }
      return (eventsByPlan[activePlan.id] ?? []).filter((event) => event.dateLocal === selectedDate);
    }

    return sortedPlans.flatMap((plan) =>
      (eventsByPlan[plan.id] ?? []).filter((event) => event.dateLocal === selectedDate)
    );
  }, [selectedDate, mode, activePlan, eventsByPlan, sortedPlans]);

  const dailyMemo = useMemo(() => {
    if (!selectedDate) {
      return null;
    }

    if (mode === "individual") {
      if (!activePlan) {
        return null;
      }
      return (dayMemosByPlan[activePlan.id] ?? []).find((memo) => memo.dateLocal === selectedDate)?.memo ?? null;
    }

    const memoChunks = sortedPlans
      .map((plan) => {
        const memo = (dayMemosByPlan[plan.id] ?? []).find((item) => item.dateLocal === selectedDate)?.memo;
        if (!memo) {
          return null;
        }
        return `${plan.title}: ${memo}`;
      })
      .filter((value): value is string => Boolean(value));

    if (memoChunks.length === 0) {
      return null;
    }
    return memoChunks.join("\n");
  }, [selectedDate, mode, activePlan, dayMemosByPlan, sortedPlans]);

  const eventMeta = (event: TripEvent) => {
    if (event.category === "transport" && event.departAtLocal && event.arriveAtLocal) {
      return `${event.departAtLocal.slice(11, 16)} → ${event.arriveAtLocal.slice(11, 16)} · 교통`;
    }
    if (event.startTimeLocal) {
      return `${event.startTimeLocal} · ${event.category ?? "기타"}`;
    }
    return `${event.category ?? "기타"}`;
  };

  return (
    <AppScreen withOrbs>
      <View style={styles.header}>
        <ScreenTitle title="캘린더" subtitle="전체 일정과 개별 이벤트를 월 단위로 한눈에 확인" />

        <View style={styles.modeDropWrap}>
          <TouchableOpacity style={styles.modeButton} onPress={() => setModeMenuOpen((prev) => !prev)}>
            <Text style={styles.modeButtonText}>{mode === "overall" ? "전체일정" : "개별일정"}</Text>
            <Ionicons name={modeMenuOpen ? "chevron-up" : "chevron-down"} size={16} color={TOKENS.color.ink} />
          </TouchableOpacity>

          {modeMenuOpen ? (
            <SurfaceCard tone="raised" style={styles.modeMenu}>
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

      {mode === "individual" ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planFilterRow}>
          {sortedPlans.map((plan) => (
            <FilterChip
              key={plan.id}
              label={plan.title}
              dotColor={colorById(plan.colorId)}
              active={plan.id === (activePlan?.id ?? null)}
              onPress={() => setActivePlanId(plan.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.main}>
        <SurfaceCard tone="raised" style={styles.monthCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity style={styles.navButton} onPress={() => setAnchorDateLocal((prev) => shiftMonth(prev, -1))}>
              <Ionicons name="chevron-back" size={16} color={TOKENS.color.ink} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthTitle(anchorDateLocal)}</Text>
            <TouchableOpacity style={styles.navButton} onPress={() => setAnchorDateLocal((prev) => shiftMonth(prev, 1))}>
              <Ionicons name="chevron-forward" size={16} color={TOKENS.color.ink} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((day) => (
              <Text key={day} style={styles.weekLabel}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {monthCells.map((cell) => {
              const overallStacks = buildOverallStacks(cell.dateLocal, sortedPlans);
              const individualStacks =
                mode === "individual" && activePlan
                  ? buildIndividualStacks(activePlan.id, cell.dateLocal, eventsByPlan)
                  : null;
              const preview =
                mode === "overall"
                  ? overallStacks.slice(0, 3).map((item) => ({
                      key: item.planId,
                      colorId: item.colorId,
                      title: item.title,
                      segment: item.segment
                    }))
                  : (individualStacks?.preview ?? []).slice(0, 3).map((event) => ({
                      key: event.id,
                      colorId: event.colorId,
                      title: event.title,
                      segment: "single"
                    }));
              const extraCount =
                mode === "overall"
                  ? Math.max(overallStacks.length - preview.length, 0)
                  : individualStacks?.extraCount ?? 0;
              const selected = selectedDate === cell.dateLocal;

              return (
                <Pressable
                  key={cell.dateLocal}
                  style={[styles.cellWrap, mode === "overall" ? styles.cellWrapOverall : null]}
                  onPress={() => setSelectedDate(cell.dateLocal)}
                >
                  <View
                    style={[
                      styles.cell,
                      !cell.inCurrentMonth ? styles.cellMuted : null,
                      selected ? styles.cellSelected : null
                    ]}
                  >
                    <Text style={[styles.dayNumber, !cell.inCurrentMonth ? styles.dayNumberMuted : null]}>
                      {cell.dateLocal.slice(-2)}
                    </Text>

                    <View style={styles.stackArea}>
                      {preview.map((item) => (
                        <View
                          key={item.key}
                          style={[
                            styles.stackBar,
                            { backgroundColor: colorById(item.colorId) },
                            mode === "overall" ? styles.overallStackBar : null,
                            mode === "overall" && item.segment === "start" ? styles.segmentStart : null,
                            mode === "overall" && item.segment === "middle" ? styles.segmentMiddle : null,
                            mode === "overall" && item.segment === "end" ? styles.segmentEnd : null,
                            mode === "overall" && item.segment === "single" ? styles.segmentSingle : null
                          ]}
                        >
                          {mode === "overall" && (item.segment === "start" || item.segment === "single") ? (
                            <Text numberOfLines={1} style={styles.stackLabel}>
                              {item.title}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                      {extraCount > 0 ? <Text style={styles.extraLabel}>+{extraCount}</Text> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SurfaceCard>

        <SurfaceCard tone="raised" style={styles.bottomPanel}>
          <Text style={styles.bottomKicker}>DAY DETAIL</Text>
          <Text style={styles.bottomTitle}>{selectedDate ? formatDateLabel(selectedDate) : "날짜 없음"}</Text>

          {dailyEvents.length === 0 ? (
            <EmptyState message="해당 일자에 이벤트가 없습니다." minHeight={86} />
          ) : (
            <View style={styles.bottomEventsWrap}>
              {dailyEvents.map((event) => (
                <View key={event.id} style={styles.bottomEventRow}>
                  <View style={[styles.bottomDot, { backgroundColor: colorById(event.colorId) }]} />
                  <View style={styles.flex}>
                    <Text style={styles.bottomEventTitle}>{event.title}</Text>
                    <Text style={styles.bottomEventMeta}>
                      {eventMeta(event)}
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
    paddingBottom: TOKENS.space.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: TOKENS.space.sm
  },
  modeDropWrap: {
    position: "relative"
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: TOKENS.color.lineStrong,
    borderRadius: TOKENS.radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: TOKENS.color.surface
  },
  modeButtonText: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.ink,
    fontSize: 12
  },
  modeMenu: {
    position: "absolute",
    top: 44,
    right: 0,
    width: 118,
    overflow: "hidden",
    zIndex: 9
  },
  modeMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 10
  },
  modeMenuText: {
    fontFamily: TOKENS.font.medium,
    color: TOKENS.color.ink,
    fontSize: 13
  },
  planFilterRow: {
    gap: TOKENS.space.xs,
    paddingHorizontal: TOKENS.space.lg,
    paddingBottom: TOKENS.space.sm
  },
  main: {
    flex: 1,
    paddingHorizontal: TOKENS.space.lg,
    paddingBottom: TOKENS.space.sm,
    gap: TOKENS.space.sm
  },
  monthCard: {
    padding: TOKENS.space.sm,
    gap: TOKENS.space.xs
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  monthTitle: {
    fontFamily: TOKENS.font.display,
    fontSize: 24,
    color: TOKENS.color.ink
  },
  navButton: {
    width: 30,
    height: 30,
    borderRadius: TOKENS.radius.round,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: TOKENS.color.surface
  },
  weekRow: {
    flexDirection: "row",
    marginTop: TOKENS.space.xs
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.inkSoft,
    fontSize: 11
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  cellWrap: {
    width: `${100 / 7}%`,
    padding: 2
  },
  cellWrapOverall: {
    padding: 0
  },
  cell: {
    minHeight: 66,
    borderRadius: TOKENS.radius.sm,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    backgroundColor: TOKENS.color.surface,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4
  },
  cellMuted: {
    opacity: 0.45
  },
  cellSelected: {
    borderColor: TOKENS.color.accentDeep,
    backgroundColor: TOKENS.color.accentSoft
  },
  dayNumber: {
    fontFamily: TOKENS.font.bold,
    fontSize: 11,
    color: TOKENS.color.ink
  },
  dayNumberMuted: {
    color: TOKENS.color.inkSoft
  },
  stackArea: {
    gap: 3
  },
  stackBar: {
    height: 6,
    borderRadius: TOKENS.radius.round
  },
  overallStackBar: {
    height: 12,
    justifyContent: "center",
    paddingHorizontal: 4
  },
  segmentStart: {
    borderTopLeftRadius: TOKENS.radius.round,
    borderBottomLeftRadius: TOKENS.radius.round,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2
  },
  segmentMiddle: {
    borderRadius: 2
  },
  segmentEnd: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: TOKENS.radius.round,
    borderBottomRightRadius: TOKENS.radius.round
  },
  segmentSingle: {
    borderRadius: TOKENS.radius.round
  },
  stackLabel: {
    fontFamily: TOKENS.font.bold,
    color: "#FFFFFF",
    fontSize: 8
  },
  extraLabel: {
    fontFamily: TOKENS.font.bold,
    fontSize: 10,
    color: TOKENS.color.inkSoft,
    textAlign: "right"
  },
  bottomPanel: {
    flex: 1,
    padding: TOKENS.space.md,
    gap: TOKENS.space.xs
  },
  bottomKicker: {
    fontFamily: TOKENS.font.bold,
    letterSpacing: 1.4,
    fontSize: 10,
    color: TOKENS.color.info
  },
  bottomTitle: {
    fontFamily: TOKENS.font.display,
    fontSize: 24,
    color: TOKENS.color.ink
  },
  bottomEventsWrap: {
    gap: TOKENS.space.xs
  },
  bottomEventRow: {
    flexDirection: "row",
    gap: TOKENS.space.xs,
    alignItems: "center"
  },
  bottomDot: {
    width: 9,
    height: 9,
    borderRadius: TOKENS.radius.round
  },
  bottomEventTitle: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.ink,
    fontSize: 13
  },
  bottomEventMeta: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 11
  },
  memoTitle: {
    marginTop: TOKENS.space.xs,
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.ink,
    fontSize: 12
  },
  memoText: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 12,
    lineHeight: 18
  }
});
