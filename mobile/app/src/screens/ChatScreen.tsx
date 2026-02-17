import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/types";
import { usePlanner } from "../context/PlannerContext";
import { TOKENS, colorById } from "../theme/tokens";
import type { ChatMessage } from "../types/domain";
import { AppScreen } from "../components/layout/AppScreen";
import { ScreenTitle } from "../components/common/ScreenTitle";
import { SurfaceCard } from "../components/common/SurfaceCard";
import { AppButton } from "../components/common/AppButton";
import { formatPeriod } from "../utils/format";

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";
  return (
    <View
      style={[
        styles.messageBubble,
        isAssistant ? styles.assistantBubble : styles.userBubble
      ]}
    >
      <Text style={[styles.messageText, isAssistant ? styles.assistantText : styles.userText]}>
        {message.text}
      </Text>

      {message.proposal ? (
        <SurfaceCard style={styles.proposalCard}>
          <Text style={styles.proposalTitle}>{message.proposal.summary}</Text>
          {message.proposal.operations.map((op) => (
            <Text key={op} style={styles.proposalOperation}>
              • {op}
            </Text>
          ))}
          <View style={styles.proposalActions}>
            <AppButton label="등록" onPress={() => {}} style={styles.miniButton} />
            <AppButton label="수정" variant="secondary" onPress={() => {}} style={styles.miniButton} />
            <AppButton label="취소" variant="secondary" onPress={() => {}} style={styles.miniButton} />
          </View>
        </SurfaceCard>
      ) : null}
    </View>
  );
}

function PlanCard({
  title,
  destination,
  period,
  color,
  isForeign,
  onPress
}: {
  title: string;
  destination: string;
  period: string;
  color: string;
  isForeign: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.planCardWrap, pressed ? styles.pressed : null]}>
      <SurfaceCard style={styles.planCard}>
        <View style={[styles.planAccent, { backgroundColor: color }]} />
        <View style={styles.planBody}>
          <Text style={styles.planTitle}>{title}</Text>
          <Text style={styles.planMeta}>{destination}</Text>
          <Text style={styles.planMeta}>{period}</Text>
        </View>
        {isForeign ? <Ionicons name="earth-outline" size={15} color={TOKENS.color.inkSoft} /> : null}
      </SurfaceCard>
    </Pressable>
  );
}

export function ChatScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {
    sortedPlans,
    activePlanId,
    setActivePlanId,
    messagesByPlan,
    appendMessage,
    createPlanQuick
  } = usePlanner();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const composerBottom = tabBarHeight + TOKENS.space.sm;

  const activePlan = useMemo(
    () => sortedPlans.find((plan) => plan.id === activePlanId) ?? null,
    [sortedPlans, activePlanId]
  );

  const messages = activePlan ? (messagesByPlan[activePlan.id] ?? []) : [];

  const onSend = () => {
    if (!activePlan) {
      return;
    }
    appendMessage(activePlan.id, draft);
    setDraft("");
  };

  return (
    <AppScreen withOrbs>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight : 0}
        style={styles.flex}
      >
        <View style={[styles.header, { paddingTop: TOKENS.space.sm }]}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.iconButton}>
            <Ionicons name="menu" size={22} color={TOKENS.color.ink} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{activePlan ? activePlan.title : "Planner"}</Text>
            <Text style={styles.headerSubTitle}>
              {activePlan
                ? formatPeriod(activePlan.startDateLocal, activePlan.endDateLocal)
                : "여행 플랜 선택"}
            </Text>
          </View>

          <TouchableOpacity onPress={() => setActivePlanId(null)} style={styles.iconButton}>
            <Ionicons name="layers-outline" size={20} color={TOKENS.color.inkSoft} />
          </TouchableOpacity>
        </View>

        {!activePlan ? (
          <View style={styles.emptyWrap}>
            <ScreenTitle
              title="빈 채팅에서 시작"
              subtitle="플랜을 선택하면 채팅으로 수정 제안을 받을 수 있어요."
            />
            <ScrollView contentContainerStyle={styles.planListContainer}>
              {sortedPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  title={plan.title}
                  destination={plan.destination}
                  period={formatPeriod(plan.startDateLocal, plan.endDateLocal)}
                  color={colorById(plan.colorId)}
                  isForeign={plan.isForeign}
                  onPress={() => setActivePlanId(plan.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : (
          <>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingHorizontal: TOKENS.space.lg,
                paddingTop: TOKENS.space.sm,
                paddingBottom: composerBottom + 88,
                gap: TOKENS.space.md
              }}
              renderItem={({ item }) => <MessageBubble message={item} />}
            />

            <View
              style={[
                styles.composerWrap,
                {
                  bottom: composerBottom,
                  marginBottom: insets.bottom > 0 ? 0 : TOKENS.space.xs
                }
              ]}
            >
              <TouchableOpacity style={styles.attachButton}>
                <Ionicons name="image-outline" size={18} color={TOKENS.color.ink} />
              </TouchableOpacity>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="이미지 첨부 또는 메시지 입력"
                placeholderTextColor={TOKENS.color.inkSoft}
                style={styles.input}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={onSend}>
                <Ionicons name="arrow-up" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      <Modal visible={sidebarOpen} transparent animationType="fade" onRequestClose={() => setSidebarOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalOverlay} onPress={() => setSidebarOpen(false)} />
          <View style={styles.sidebarPanel}>
            <View style={styles.sidebarTop}>
              <Text style={styles.sidebarTitle}>플랜 보드</Text>
              <AppButton
                label="새 일정 만들기"
                onPress={() => {
                  const planId = createPlanQuick();
                  setActivePlanId(planId);
                  setSidebarOpen(false);
                }}
              />
            </View>

            <ScrollView style={styles.sidebarPlanList}>
              {sortedPlans.map((plan) => (
                <Pressable
                  key={plan.id}
                  style={({ pressed }) => [
                    styles.sidebarPlanItem,
                    activePlanId === plan.id ? styles.sidebarPlanItemActive : null,
                    pressed ? styles.pressed : null
                  ]}
                  onPress={() => {
                    setActivePlanId(plan.id);
                    setSidebarOpen(false);
                  }}
                >
                  <View style={[styles.sidebarColorDot, { backgroundColor: colorById(plan.colorId) }]} />
                  <View style={styles.flex}>
                    <Text style={styles.sidebarPlanTitle}>{plan.title}</Text>
                    <Text style={styles.sidebarPlanMeta}>
                      {formatPeriod(plan.startDateLocal, plan.endDateLocal)}
                    </Text>
                  </View>
                  {plan.isForeign ? (
                    <Ionicons name="earth-outline" size={14} color={TOKENS.color.inkSoft} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.sidebarBottom}>
              <AppButton
                label="설정"
                variant="secondary"
                onPress={() => {
                  setSidebarOpen(false);
                  navigation.navigate("Settings");
                }}
              />
              <AppButton
                label="휴지통"
                variant="secondary"
                onPress={() => {
                  setSidebarOpen(false);
                  navigation.navigate("Trash");
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  header: {
    paddingHorizontal: TOKENS.space.lg,
    paddingBottom: TOKENS.space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: TOKENS.space.sm
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: TOKENS.color.surface,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    justifyContent: "center",
    alignItems: "center"
  },
  headerCenter: {
    flex: 1
  },
  headerTitle: {
    fontFamily: TOKENS.font.display,
    fontSize: 24,
    color: TOKENS.color.ink
  },
  headerSubTitle: {
    marginTop: 2,
    fontFamily: TOKENS.font.body,
    fontSize: 12,
    color: TOKENS.color.inkSoft
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: TOKENS.space.lg
  },
  planListContainer: {
    paddingTop: TOKENS.space.md,
    paddingBottom: 120,
    gap: TOKENS.space.sm
  },
  planCardWrap: {
    borderRadius: TOKENS.radius.md
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    minHeight: 86,
    paddingRight: TOKENS.space.md
  },
  planAccent: {
    width: 8,
    alignSelf: "stretch"
  },
  planBody: {
    flex: 1,
    paddingHorizontal: TOKENS.space.md,
    paddingVertical: TOKENS.space.sm
  },
  planTitle: {
    fontFamily: TOKENS.font.bold,
    fontSize: 17,
    color: TOKENS.color.ink
  },
  planMeta: {
    marginTop: 2,
    fontFamily: TOKENS.font.body,
    fontSize: 12,
    color: TOKENS.color.inkSoft
  },
  messageBubble: {
    maxWidth: "88%",
    paddingHorizontal: TOKENS.space.md,
    paddingVertical: TOKENS.space.sm,
    borderRadius: TOKENS.radius.md,
    borderWidth: 1
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: TOKENS.color.surface,
    borderColor: TOKENS.color.line
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: TOKENS.color.accent,
    borderColor: TOKENS.color.accentDeep
  },
  messageText: {
    fontFamily: TOKENS.font.body,
    fontSize: 14,
    lineHeight: 20
  },
  assistantText: {
    color: TOKENS.color.ink
  },
  userText: {
    color: "#fff"
  },
  proposalCard: {
    marginTop: TOKENS.space.sm,
    backgroundColor: TOKENS.color.bgMuted,
    padding: TOKENS.space.sm,
    gap: 3
  },
  proposalTitle: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.ink,
    fontSize: 13
  },
  proposalOperation: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 12
  },
  proposalActions: {
    marginTop: TOKENS.space.sm,
    flexDirection: "row",
    gap: TOKENS.space.xs
  },
  miniButton: {
    flex: 1,
    paddingVertical: 7
  },
  composerWrap: {
    position: "absolute",
    left: TOKENS.space.lg,
    right: TOKENS.space.lg,
    minHeight: 60,
    borderRadius: TOKENS.radius.lg,
    backgroundColor: TOKENS.color.surface,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: TOKENS.space.sm,
    gap: TOKENS.space.sm
  },
  attachButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: TOKENS.color.bgMuted,
    justifyContent: "center",
    alignItems: "center"
  },
  input: {
    flex: 1,
    maxHeight: 96,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.ink,
    fontSize: 14,
    paddingVertical: 10
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: TOKENS.color.accent,
    justifyContent: "center",
    alignItems: "center"
  },
  modalRoot: {
    flex: 1,
    flexDirection: "row"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20,20,20,0.35)"
  },
  sidebarPanel: {
    width: "78%",
    backgroundColor: TOKENS.color.surface,
    borderLeftWidth: 1,
    borderLeftColor: TOKENS.color.line,
    paddingTop: 54,
    paddingHorizontal: TOKENS.space.md,
    paddingBottom: TOKENS.space.lg
  },
  sidebarTop: {
    gap: TOKENS.space.sm
  },
  sidebarTitle: {
    fontFamily: TOKENS.font.display,
    fontSize: 24,
    color: TOKENS.color.ink
  },
  sidebarPlanList: {
    marginTop: TOKENS.space.md
  },
  sidebarPlanItem: {
    paddingVertical: 10,
    paddingHorizontal: TOKENS.space.sm,
    borderRadius: TOKENS.radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: TOKENS.space.sm
  },
  sidebarPlanItemActive: {
    backgroundColor: TOKENS.color.bgMuted
  },
  sidebarColorDot: {
    width: 12,
    height: 12,
    borderRadius: 99
  },
  sidebarPlanTitle: {
    fontFamily: TOKENS.font.medium,
    fontSize: 13,
    color: TOKENS.color.ink
  },
  sidebarPlanMeta: {
    marginTop: 2,
    fontFamily: TOKENS.font.body,
    fontSize: 11,
    color: TOKENS.color.inkSoft
  },
  sidebarBottom: {
    marginTop: "auto",
    gap: TOKENS.space.xs
  },
  pressed: {
    opacity: 0.82
  }
});
