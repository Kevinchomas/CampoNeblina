import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Evento, Inmueble } from "../constants/types";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { PendingApprovalScreen } from "../screens/PendingApprovalScreen";
import { SuspendedAccountScreen } from "../screens/SuspendedAccountScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { AdminUsersScreen } from "../screens/AdminUsersScreen";
import { CreatePublicationScreen } from "../screens/CreatePublicationScreen";
import { AdminModerationScreen } from "../screens/AdminModerationScreen";
import { ChatListScreen } from "../screens/ChatListScreen";
import { ChatDetailScreen } from "../screens/ChatDetailScreen";
import { AdminIncidenciasScreen } from "../screens/AdminIncidenciasScreen";
import { AdminCreateEventScreen } from "../screens/AdminCreateEventScreen";
import { AdminDashboardScreen } from "../screens/AdminDashboardScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MarketplaceScreen } from "../screens/MarketplaceScreen";
import { EventsScreen } from "../screens/EventsScreen";
import { IncidenciasScreen } from "../screens/IncidenciasScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PendingApproval: undefined;
  SuspendedAccount: undefined;
  MainTabs: undefined;
  Home: undefined;
  Marketplace: undefined;
  Events: undefined;
  Incidencias: undefined;
  Profile: undefined;
  AdminUsers: undefined;
  CreatePublication: undefined;
  AdminModeration: undefined;
  ChatList: undefined;
  ChatDetail: {
    destinatarioUid: string;
    destinatarioNombre: string;
    destinatarioInmueble: Inmueble;
  };
  AdminIncidencias: undefined;
  AdminCreateEvent: {
    eventoToEdit?: Evento;
  } | undefined;
  AdminDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5CA838" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#FFFFFF" },
          }}
        >
          {!user ? (
            // Flujo de No Autenticados
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : user.status === "pendiente_aprobacion" ? (
            // Flujo de Usuario Pendiente de Aprobación por la Junta
            <Stack.Screen
              name="PendingApproval"
              component={PendingApprovalScreen}
            />
          ) : user.status === "suspendido" ? (
            // Flujo de Usuario Suspendido por la Junta
            <Stack.Screen
              name="SuspendedAccount"
              component={SuspendedAccountScreen}
            />
          ) : (
            // Flujo de Usuario Activo con Tab Navigator + Stack Secundario
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
              <Stack.Screen name="Events" component={EventsScreen} />
              <Stack.Screen name="Incidencias" component={IncidenciasScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
              <Stack.Screen
                name="CreatePublication"
                component={CreatePublicationScreen}
              />
              <Stack.Screen
                name="AdminModeration"
                component={AdminModerationScreen}
              />
              <Stack.Screen name="ChatList" component={ChatListScreen} />
              <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
              <Stack.Screen
                name="AdminIncidencias"
                component={AdminIncidenciasScreen}
              />
              <Stack.Screen
                name="AdminCreateEvent"
                component={AdminCreateEventScreen}
              />
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F8F4",
  },
});






