import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { MarketplaceScreen } from "../screens/MarketplaceScreen";
import { EventsScreen } from "../screens/EventsScreen";
import { IncidenciasScreen } from "../screens/IncidenciasScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { theme } from "../constants/theme";

export type MainTabParamList = {
  HomeTab: undefined;
  MarketplaceTab: undefined;
  EventsTab: undefined;
  IncidenciasTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.light.primary, // #5CA838
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "MarketplaceTab") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "EventsTab") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "IncidenciasTab") {
            iconName = focused ? "alert-circle" : "alert-circle-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size || 22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: "Inicio" }}
      />
      <Tab.Screen
        name="MarketplaceTab"
        component={MarketplaceScreen}
        options={{ tabBarLabel: "Mercado" }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsScreen}
        options={{ tabBarLabel: "Eventos" }}
      />
      <Tab.Screen
        name="IncidenciasTab"
        component={IncidenciasScreen}
        options={{ tabBarLabel: "Reclamos" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: "Perfil" }}
      />
    </Tab.Navigator>
  );
};
