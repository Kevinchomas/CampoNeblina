import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "./src/context/AuthContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ErrorBoundary } from "./src/components/ErrorBoundary";

// Configurar manejador global de errores síncronos/fatales
// @ts-ignore
if (typeof ErrorUtils !== "undefined" && ErrorUtils.setGlobalHandler) {
  // @ts-ignore
  const defaultGlobalHandler = ErrorUtils.getGlobalHandler();
  // @ts-ignore
  ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    console.error("Global unhandled error caught by ErrorUtils:", error, isFatal);
    if (defaultGlobalHandler) {
      defaultGlobalHandler(error, isFatal);
    }
  });
}

try {
  SplashScreen.preventAutoHideAsync().catch(() => {});
} catch (e) {}

export default function App() {
  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {}
      }
    }
    prepare();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}


