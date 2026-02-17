import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
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
import * as ImagePicker from "expo-image-picker";
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

type ProposalState = NonNullable<ChatMessage["proposal"]>["state"];

function proposalStateLabel(state: ProposalState) {
  if (state === "registered") {
    return "등록 완료";
  }
  if (state === "edited") {
    return "수정 반영";
  }
  if (state === "cancelled") {
    return "취소 완료";
  }
  return "승인 대기";
}

function MessageBubble({
  message,
  onProposalDecision,
  onToggleOperation
}: {
  message: ChatMessage;
  onProposalDecision: (messageId: string, decision: "register" | "edit" | "cancel") => void;
  onToggleOperation: (messageId: string, opIndex: number, enabled: boolean) => void;
}) {
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";
  const isUser = message.role === "user";
  const proposalState = message.proposal?.state ?? "pending";
  const proposalPending = proposalState === "pending";

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : null,
          isAssistant ? styles.assistantBubble : null,
          isSystem ? styles.systemBubble : null
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userText : null,
            isSystem ? styles.systemText : null
          ]}
        >
          {message.text}
        </Text>

        {message.imageUris.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.messageImageRow}>
            {message.imageUris.map((uri) => (
              <Image key={`${message.id}-${uri}`} source={{ uri }} style={styles.messageImage} />
            ))}
          </ScrollView>
        ) : null}

        {message.proposal ? (
          <SurfaceCard tone="raised" style={styles.proposalCard}>
            <View style={styles.proposalHeader}>
              <Text style={styles.proposalTitle}>{message.proposal.summary}</Text>
              <Text style={styles.proposalState}>{proposalStateLabel(proposalState)}</Text>
            </View>
            {message.proposal.operations.map((op) => (
              <Text key={op} style={styles.proposalOperation}>
                • {op}
              </Text>
            ))}
            {proposalPending
              ? (message.proposal.operationPayloads ?? []).map((payload, index) => (
                  <View key={`${message.id}-op-${index}`} style={styles.overrideRow}>
                    <Text style={styles.overrideLabel}>
                      {index + 1}. {message.proposal?.operations[index] ?? payload.action}
                    </Text>
                    <TouchableOpacity
                      style={[styles.overrideButton, payload.enabled === false ? styles.overrideButtonOff : null]}
                      onPress={() => onToggleOperation(message.id, index, payload.enabled === false)}
                    >
                      <Text style={styles.overrideButtonText}>{payload.enabled === false ? "제외" : "적용"}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              : null}
            {proposalPending ? (
              <View style={styles.proposalActions}>
                <AppButton
                  label="일괄 등록"
                  onPress={() => onProposalDecision(message.id, "register")}
                  style={styles.miniButton}
                />
                <AppButton
                  label="수정"
                  variant="secondary"
                  onPress={() => onProposalDecision(message.id, "edit")}
                  style={styles.miniButton}
                />
                <AppButton
                  label="취소"
                  variant="secondary"
                  onPress={() => onProposalDecision(message.id, "cancel")}
                  style={styles.miniButton}
                />
              </View>
            ) : null}
          </SurfaceCard>
        ) : null}
      </View>
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
      <SurfaceCard tone="raised" style={styles.planCard}>
        <View style={[styles.planAccent, { backgroundColor: color }]} />
        <View style={styles.planBody}>
          <Text style={styles.planTitle}>{title}</Text>
          <Text style={styles.planMeta}>{destination}</Text>
          <Text style={styles.planMeta}>{period}</Text>
        </View>
        {isForeign ? <Ionicons name="earth-outline" size={16} color={TOKENS.color.inkSoft} /> : null}
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
    decideProposal,
    setProposalOperationEnabled,
    createPlanQuick
  } = usePlanner();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachedImageUris, setAttachedImageUris] = useState<string[]>([]);
  const [planTitleDraft, setPlanTitleDraft] = useState("");
  const [planDestinationDraft, setPlanDestinationDraft] = useState("");
  const [planStartDateDraft, setPlanStartDateDraft] = useState("");
  const [planEndDateDraft, setPlanEndDateDraft] = useState("");
  const [planForeignDraft, setPlanForeignDraft] = useState(false);
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
    appendMessage(activePlan.id, draft, attachedImageUris);
    setDraft("");
    setAttachedImageUris([]);
  };

  const onAttachImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "갤러리 접근을 허용해야 이미지를 첨부할 수 있어요.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7
    });
    if (result.canceled) {
      return;
    }

    const uris = result.assets.map((asset) => asset.uri);
    setAttachedImageUris((current) => [...current, ...uris].slice(0, 6));
  };

  const openCreatePlan = () => {
    setPlanTitleDraft("");
    setPlanDestinationDraft("");
    setPlanStartDateDraft("");
    setPlanEndDateDraft("");
    setPlanForeignDraft(false);
    setCreatePlanModalOpen(true);
  };

  const submitCreatePlan = () => {
    const start = planStartDateDraft.trim();
    const end = planEndDateDraft.trim() || start;
    if (!start.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("입력 확인", "시작일은 YYYY-MM-DD 형식으로 입력해 주세요.");
      return;
    }
    if (!end.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("입력 확인", "종료일은 YYYY-MM-DD 형식으로 입력해 주세요.");
      return;
    }

    const planId = createPlanQuick({
      title: planTitleDraft.trim() || "새 여행 플랜",
      destination: planDestinationDraft.trim() || "목적지 미정",
      startDateLocal: start,
      endDateLocal: end,
      isForeign: planForeignDraft
    });
    setCreatePlanModalOpen(false);
    setSidebarOpen(false);
    setActivePlanId(planId);
  };

  return (
    <AppScreen withOrbs>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight : 0}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.iconButton}>
            <Ionicons name="menu" size={20} color={TOKENS.color.ink} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerKicker}>CHAT BOARD</Text>
            <Text style={styles.headerTitle}>{activePlan ? activePlan.title : "여행 플랜 선택"}</Text>
            <Text style={styles.headerSubTitle}>
              {activePlan
                ? formatPeriod(activePlan.startDateLocal, activePlan.endDateLocal)
                : "사이드바에서 일정을 선택하면 대화 편집이 시작됩니다"}
            </Text>
          </View>

          <TouchableOpacity onPress={() => setActivePlanId(null)} style={styles.iconButton}>
            <Ionicons name="layers-outline" size={19} color={TOKENS.color.inkSoft} />
          </TouchableOpacity>
        </View>

        {!activePlan ? (
          <View style={styles.emptyWrap}>
            <ScreenTitle
              title="빈 채팅 시작"
              subtitle="여행 하나를 선택하면 OCR/대화 제안을 승인형으로 반영할 수 있어요."
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
                paddingBottom: composerBottom + 96,
                gap: TOKENS.space.sm
              }}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  onProposalDecision={(messageId, decision) =>
                    decideProposal(activePlan.id, messageId, decision)
                  }
                  onToggleOperation={(messageId, opIndex, enabled) =>
                    setProposalOperationEnabled(activePlan.id, messageId, opIndex, enabled)
                  }
                />
              )}
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
              <TouchableOpacity style={styles.attachButton} onPress={onAttachImage}>
                <Ionicons name="image-outline" size={18} color={TOKENS.color.ink} />
              </TouchableOpacity>
              <View style={styles.inputWrap}>
                {attachedImageUris.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.attachPreviewRow}
                  >
                    {attachedImageUris.map((uri) => (
                      <View key={uri} style={styles.previewItem}>
                        <Image source={{ uri }} style={styles.previewImage} />
                        <TouchableOpacity
                          style={styles.previewDeleteButton}
                          onPress={() =>
                            setAttachedImageUris((current) => current.filter((item) => item !== uri))
                          }
                        >
                          <Ionicons name="close" size={11} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : null}
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="메시지 입력 또는 이미지 첨부"
                  placeholderTextColor={TOKENS.color.inkSoft}
                  style={styles.input}
                  multiline
                />
              </View>
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
              <Text style={styles.sidebarTitle}>플랜 전환</Text>
              <AppButton
                label="새 일정 만들기"
                onPress={openCreatePlan}
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

      <Modal
        visible={createPlanModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCreatePlanModalOpen(false)}
      >
        <View style={styles.planModalRoot}>
          <View style={styles.planModalCard}>
            <Text style={styles.planModalTitle}>새 일정 만들기</Text>
            <TextInput
              value={planTitleDraft}
              onChangeText={setPlanTitleDraft}
              placeholder="제목"
              placeholderTextColor={TOKENS.color.inkSoft}
              style={styles.planModalInput}
            />
            <TextInput
              value={planDestinationDraft}
              onChangeText={setPlanDestinationDraft}
              placeholder="목적지"
              placeholderTextColor={TOKENS.color.inkSoft}
              style={styles.planModalInput}
            />
            <TextInput
              value={planStartDateDraft}
              onChangeText={setPlanStartDateDraft}
              placeholder="시작일 (YYYY-MM-DD)"
              placeholderTextColor={TOKENS.color.inkSoft}
              style={styles.planModalInput}
            />
            <TextInput
              value={planEndDateDraft}
              onChangeText={setPlanEndDateDraft}
              placeholder="종료일 (YYYY-MM-DD)"
              placeholderTextColor={TOKENS.color.inkSoft}
              style={styles.planModalInput}
            />

            <TouchableOpacity
              style={[styles.foreignToggle, planForeignDraft ? styles.foreignToggleOn : null]}
              onPress={() => setPlanForeignDraft((current) => !current)}
            >
              <Text style={[styles.foreignToggleText, planForeignDraft ? styles.foreignToggleTextOn : null]}>
                해외여행 {planForeignDraft ? "ON" : "OFF"}
              </Text>
            </TouchableOpacity>

            <View style={styles.planModalActions}>
              <AppButton label="생성" onPress={submitCreatePlan} style={styles.flexButton} />
              <AppButton
                label="취소"
                variant="secondary"
                onPress={() => setCreatePlanModalOpen(false)}
                style={styles.flexButton}
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
    paddingTop: TOKENS.space.sm,
    paddingBottom: TOKENS.space.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: TOKENS.space.sm
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: TOKENS.radius.sm,
    backgroundColor: TOKENS.color.surface,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    justifyContent: "center",
    alignItems: "center"
  },
  headerCenter: {
    flex: 1,
    gap: 1
  },
  headerKicker: {
    fontFamily: TOKENS.font.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: TOKENS.color.info
  },
  headerTitle: {
    fontFamily: TOKENS.font.display,
    fontSize: 30,
    color: TOKENS.color.ink
  },
  headerSubTitle: {
    fontFamily: TOKENS.font.body,
    fontSize: 12,
    color: TOKENS.color.inkSoft
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: TOKENS.space.lg,
    gap: TOKENS.space.sm
  },
  planListContainer: {
    gap: TOKENS.space.xs,
    paddingBottom: 130
  },
  planCardWrap: {
    borderRadius: TOKENS.radius.md
  },
  planCard: {
    padding: TOKENS.space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: TOKENS.space.sm
  },
  planAccent: {
    width: 10,
    alignSelf: "stretch",
    borderRadius: TOKENS.radius.sm
  },
  planBody: {
    flex: 1,
    gap: 2
  },
  planTitle: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.ink,
    fontSize: 15
  },
  planMeta: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 12
  },
  messageRow: {
    flexDirection: "row"
  },
  messageRowAssistant: {
    justifyContent: "flex-start"
  },
  messageRowUser: {
    justifyContent: "flex-end"
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: TOKENS.radius.md,
    borderWidth: 1,
    padding: TOKENS.space.sm,
    gap: TOKENS.space.xs
  },
  assistantBubble: {
    backgroundColor: TOKENS.color.surface,
    borderColor: TOKENS.color.line
  },
  systemBubble: {
    backgroundColor: TOKENS.color.bgMuted,
    borderColor: TOKENS.color.lineStrong
  },
  userBubble: {
    backgroundColor: TOKENS.color.bgDeep,
    borderColor: TOKENS.color.bgDeep
  },
  messageText: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.ink,
    fontSize: 13,
    lineHeight: 19
  },
  inputWrap: {
    flex: 1
  },
  attachPreviewRow: {
    gap: TOKENS.space.xs,
    paddingHorizontal: TOKENS.space.xs,
    paddingBottom: 6
  },
  previewItem: {
    width: 52,
    height: 52,
    borderRadius: TOKENS.radius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: TOKENS.color.line
  },
  previewImage: {
    width: "100%",
    height: "100%"
  },
  previewDeleteButton: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: TOKENS.radius.round,
    backgroundColor: "rgba(20, 30, 40, 0.7)",
    alignItems: "center",
    justifyContent: "center"
  },
  userText: {
    color: "#FFFFFF"
  },
  systemText: {
    fontFamily: TOKENS.font.medium
  },
  proposalCard: {
    marginTop: TOKENS.space.xs,
    padding: TOKENS.space.sm,
    gap: 3
  },
  messageImageRow: {
    marginTop: TOKENS.space.xs,
    gap: TOKENS.space.xs
  },
  messageImage: {
    width: 80,
    height: 80,
    borderRadius: TOKENS.radius.sm,
    borderWidth: 1,
    borderColor: TOKENS.color.line
  },
  proposalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: TOKENS.space.xs
  },
  proposalTitle: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.ink,
    fontSize: 13
  },
  proposalState: {
    fontFamily: TOKENS.font.bold,
    color: TOKENS.color.accentDeep,
    fontSize: 10
  },
  proposalOperation: {
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 12
  },
  overrideRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: TOKENS.space.xs
  },
  overrideLabel: {
    flex: 1,
    fontFamily: TOKENS.font.body,
    color: TOKENS.color.inkSoft,
    fontSize: 11
  },
  overrideButton: {
    minWidth: 38,
    borderRadius: TOKENS.radius.round,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: TOKENS.color.success,
    backgroundColor: "#E8F6ED"
  },
  overrideButtonOff: {
    borderColor: TOKENS.color.lineStrong,
    backgroundColor: TOKENS.color.surface
  },
  overrideButtonText: {
    fontFamily: TOKENS.font.bold,
    fontSize: 10,
    color: TOKENS.color.ink
  },
  proposalActions: {
    marginTop: TOKENS.space.xs,
    flexDirection: "row",
    gap: TOKENS.space.xs
  },
  miniButton: {
    flex: 1,
    minHeight: 34,
    paddingVertical: 7
  },
  composerWrap: {
    position: "absolute",
    left: TOKENS.space.lg,
    right: TOKENS.space.lg,
    minHeight: 56,
    borderRadius: TOKENS.radius.md,
    borderWidth: 1,
    borderColor: TOKENS.color.lineStrong,
    backgroundColor: TOKENS.color.surface,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: TOKENS.space.xs,
    paddingVertical: TOKENS.space.xs,
    gap: TOKENS.space.xs,
    shadowColor: "#121A22",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6
    },
    elevation: 4
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: TOKENS.radius.sm,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    justifyContent: "center",
    alignItems: "center"
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 36,
    paddingHorizontal: TOKENS.space.xs,
    paddingTop: 9,
    fontFamily: TOKENS.font.body,
    fontSize: 13,
    color: TOKENS.color.ink,
    textAlignVertical: "top"
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: TOKENS.radius.sm,
    backgroundColor: TOKENS.color.accent,
    borderWidth: 1,
    borderColor: TOKENS.color.accentDeep,
    justifyContent: "center",
    alignItems: "center"
  },
  modalRoot: {
    flex: 1,
    flexDirection: "row"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 15, 20, 0.4)"
  },
  sidebarPanel: {
    width: 308,
    backgroundColor: TOKENS.color.bg,
    borderLeftWidth: 1,
    borderLeftColor: TOKENS.color.line,
    paddingHorizontal: TOKENS.space.md,
    paddingTop: 54,
    paddingBottom: TOKENS.space.lg,
    gap: TOKENS.space.sm
  },
  sidebarTop: {
    gap: TOKENS.space.sm
  },
  sidebarTitle: {
    fontFamily: TOKENS.font.display,
    fontSize: 26,
    color: TOKENS.color.ink
  },
  sidebarPlanList: {
    flex: 1
  },
  sidebarPlanItem: {
    borderRadius: TOKENS.radius.sm,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    backgroundColor: TOKENS.color.surface,
    paddingHorizontal: TOKENS.space.sm,
    paddingVertical: TOKENS.space.sm,
    marginBottom: TOKENS.space.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: TOKENS.space.sm
  },
  sidebarPlanItemActive: {
    borderColor: TOKENS.color.accentDeep,
    backgroundColor: TOKENS.color.accentSoft
  },
  sidebarColorDot: {
    width: 10,
    height: 10,
    borderRadius: TOKENS.radius.round
  },
  sidebarPlanTitle: {
    fontFamily: TOKENS.font.bold,
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
    gap: TOKENS.space.xs
  },
  pressed: {
    opacity: 0.88
  },
  planModalRoot: {
    flex: 1,
    backgroundColor: "rgba(10, 15, 20, 0.46)",
    justifyContent: "center",
    paddingHorizontal: TOKENS.space.lg
  },
  planModalCard: {
    borderRadius: TOKENS.radius.lg,
    borderWidth: 1,
    borderColor: TOKENS.color.lineStrong,
    backgroundColor: TOKENS.color.surface,
    padding: TOKENS.space.md,
    gap: TOKENS.space.xs
  },
  planModalTitle: {
    fontFamily: TOKENS.font.display,
    fontSize: 24,
    color: TOKENS.color.ink,
    marginBottom: TOKENS.space.xs
  },
  planModalInput: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: TOKENS.color.line,
    borderRadius: TOKENS.radius.sm,
    backgroundColor: "#fff",
    paddingHorizontal: TOKENS.space.sm,
    fontFamily: TOKENS.font.body,
    fontSize: 13,
    color: TOKENS.color.ink
  },
  foreignToggle: {
    marginTop: TOKENS.space.xs,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: TOKENS.color.lineStrong,
    borderRadius: TOKENS.radius.round,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: TOKENS.color.surface
  },
  foreignToggleOn: {
    borderColor: TOKENS.color.accentDeep,
    backgroundColor: TOKENS.color.accentSoft
  },
  foreignToggleText: {
    fontFamily: TOKENS.font.bold,
    fontSize: 11,
    color: TOKENS.color.inkSoft
  },
  foreignToggleTextOn: {
    color: TOKENS.color.accentDeep
  },
  planModalActions: {
    marginTop: TOKENS.space.xs,
    flexDirection: "row",
    gap: TOKENS.space.xs
  },
  flexButton: {
    flex: 1
  }
});
