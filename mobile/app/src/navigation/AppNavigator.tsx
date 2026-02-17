import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { TOKENS } from "../theme/tokens";
import { usePlanner } from "../context/PlannerContext";
import { ChatScreen } from "../screens/ChatScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import { JournalScreen } from "../screens/JournalScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { TrashScreen } from "../screens/TrashScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { resolveRootFlow } from "./routePolicy";
import type { MainTabParamList, RootStackParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: TOKENS.color.accent,
        tabBarInactiveTintColor: TOKENS.color.inkSoft,
        tabBarStyle: {
          height: 76,
          backgroundColor: TOKENS.color.surface,
          borderTopColor: TOKENS.color.lineStrong,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8
        },
        tabBarLabelStyle: {
          fontFamily: TOKENS.font.bold,
          fontSize: 11,
          marginBottom: 4,
          letterSpacing: 0.3
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconByRoute: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Chat: focused ? "chatbubbles" : "chatbubbles-outline",
            Calendar: focused ? "calendar" : "calendar-outline",
            Journal: focused ? "book" : "book-outline"
          };
          return <Ionicons name={iconByRoute[route.name]} color={color} size={size} />;
        }
      })}
    >
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: "채팅" }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: "캘린더" }} />
      <Tab.Screen name="Journal" component={JournalScreen} options={{ title: "일지" }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { authSession } = usePlanner();
  const rootFlow = resolveRootFlow(authSession);

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: TOKENS.color.surface
          },
          headerTintColor: TOKENS.color.ink,
          headerShadowVisible: false,
          headerTitleStyle: {
            fontFamily: TOKENS.font.bold,
            fontSize: 17
          }
        }}
      >
        {rootFlow === "auth" ? (
          <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <RootStack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <RootStack.Screen name="Settings" component={SettingsScreen} options={{ title: "설정" }} />
            <RootStack.Screen name="Trash" component={TrashScreen} options={{ title: "휴지통" }} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
