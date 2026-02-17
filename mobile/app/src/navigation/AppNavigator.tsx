import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { TOKENS } from "../theme/tokens";
import { ChatScreen } from "../screens/ChatScreen";
import { CalendarScreen } from "../screens/CalendarScreen";
import { JournalScreen } from "../screens/JournalScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { TrashScreen } from "../screens/TrashScreen";
import type { MainTabParamList, RootStackParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: TOKENS.color.accentDeep,
        tabBarInactiveTintColor: TOKENS.color.inkSoft,
        tabBarStyle: {
          height: 70,
          backgroundColor: TOKENS.color.surface,
          borderTopColor: TOKENS.color.line,
          borderTopWidth: 1,
          paddingTop: 6
        },
        tabBarLabelStyle: {
          fontFamily: TOKENS.font.medium,
          fontSize: 12,
          marginBottom: 4
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconByRoute: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Chat: focused ? "chatbubble" : "chatbubble-outline",
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
  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: TOKENS.color.surface
          },
          headerTintColor: TOKENS.color.ink,
          headerTitleStyle: {
            fontFamily: TOKENS.font.bold,
            fontSize: 17
          }
        }}
      >
        <RootStack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <RootStack.Screen name="Settings" component={SettingsScreen} options={{ title: "설정" }} />
        <RootStack.Screen name="Trash" component={TrashScreen} options={{ title: "휴지통" }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
