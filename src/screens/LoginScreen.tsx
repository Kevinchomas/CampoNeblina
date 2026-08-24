import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import { theme } from "../constants/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Campos requeridos", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (error: any) {
      let errorMessage = "Ocurrió un error al intentar iniciar sesión.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMessage = "Correo electrónico o contraseña incorrectos.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "El formato del correo electrónico no es válido.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert("Error de autenticación", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🏢</Text>
          </View>
          <Text style={styles.title}>Campo Neblina</Text>
          <Text style={styles.subtitle}>Gestión Comunal - Torres 7 y 8</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>

          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.linkText}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8F4",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#234919",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#234919",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1D1A",
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1D1A",
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: 15,
    color: "#1A1D1A",
    backgroundColor: "#FAFAFA",
  },
  button: {
    height: 48,
    backgroundColor: "#5CA838",
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  linkText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#234919",
  },
});

