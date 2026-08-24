import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, "Profile">;

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<ProfileNavProp>();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const isAdminOrModerator = user?.rol === "superadmin" || user?.rol === "moderador";

  const toggleDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    Alert.alert(
      "Modo Visual",
      `Se ha activado el modo ${value ? "Oscuro (Dark Mode)" : "Claro (Light Mode)"}.`,
    );
  };

  const bgStyle = isDarkMode ? "#1A1D1A" : "#F5F8F4";
  const cardStyle = isDarkMode ? "#262926" : "#FFFFFF";
  const textColor = isDarkMode ? "#FFFFFF" : "#1A1D1A";
  const subtextColor = isDarkMode ? "#9CA3AF" : "#6B7280";
  const borderColor = isDarkMode ? "#374151" : "#E5E7EB";

  return (
    <View style={[styles.container, { backgroundColor: bgStyle }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? "#5CA838" : "#234919" },
            ]}
          >
            Perfil de Residente
          </Text>
          <Text style={[styles.subtitle, { color: subtextColor }]}>
            Información personal y preferencias
          </Text>
        </View>

        <View
          style={[styles.card, { backgroundColor: cardStyle, borderColor }]}
        >
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.nombreCompleto
                  ? user.nombreCompleto.charAt(0).toUpperCase()
                  : "👤"}
              </Text>
            </View>
            <View style={styles.avatarInfo}>
              <Text style={[styles.userName, { color: textColor }]}>
                {user?.nombreCompleto || "Residente"}
              </Text>
              <Text
                style={[
                  styles.userRoleTag,
                  { color: isDarkMode ? "#5CA838" : "#234919" },
                ]}
              >
                {user?.rol === "superadmin"
                  ? "SuperAdministrador"
                  : user?.rol === "moderador"
                    ? "Moderador"
                    : user?.tipoResidente === "inquilino"
                      ? "Inquilino Autorizado"
                      : "Propietario"}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: subtextColor }]}>
              Inmueble:
            </Text>
            <View style={styles.inmuebleTag}>
              <Text style={styles.inmuebleTagText}>
                Torre {user?.inmueble?.torre} - Apto {user?.inmueble?.codigo}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: subtextColor }]}>
              Cédula / DNI:
            </Text>
            <Text style={[styles.infoValue, { color: textColor }]}>
              {user?.cedulaDni || "N/A"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: subtextColor }]}>
              Teléfono:
            </Text>
            <Text style={[styles.infoValue, { color: textColor }]}>
              {user?.telefono || "N/A"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: subtextColor }]}>
              Correo:
            </Text>
            <Text style={[styles.infoValue, { color: textColor }]}>
              {user?.email || "N/A"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: subtextColor }]}>
              Estado de Cuenta:
            </Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>
                {user?.status === "activo" ? "Activo / Solvente" : user?.status}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[styles.card, { backgroundColor: cardStyle, borderColor }]}
        >
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Preferencias de la App
          </Text>

          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: textColor }]}>
                Modo Oscuro (Dark Mode)
              </Text>
              <Text style={[styles.settingSubtext, { color: subtextColor }]}>
                Cambia la apariencia visual de la aplicación
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#D1D5DB", true: "#5CA838" }}
              thumbColor={isDarkMode ? "#FFFFFF" : "#F3F4F6"}
            />
          </View>
        </View>

        {isAdminOrModerator && (
          <TouchableOpacity
            style={styles.adminDashboardBtn}
            onPress={() => navigation.navigate("AdminDashboard")}
          >
            <Text style={styles.adminDashboardBtnText}>🛡️ Panel de Control Administrador</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: theme.spacing.lg, paddingTop: theme.spacing.xl },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 13, marginTop: 2 },
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  avatarRow: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#234919",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  avatarText: { color: "#FFFFFF", fontSize: 24, fontWeight: "bold" },
  avatarInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: "bold" },
  userRoleTag: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  divider: { height: 1, marginVertical: theme.spacing.md },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  infoLabel: { fontSize: 13, fontWeight: "500" },
  infoValue: { fontSize: 13, fontWeight: "bold" },
  inmuebleTag: {
    backgroundColor: "#E5EAE2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inmuebleTagText: { fontSize: 12, fontWeight: "bold", color: "#234919" },
  activeBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: { fontSize: 12, fontWeight: "bold", color: "#065F46" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: { fontSize: 14, fontWeight: "600" },
  settingSubtext: { fontSize: 12, marginTop: 2 },
  adminDashboardBtn: {
    height: 48,
    backgroundColor: "#234919",
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  adminDashboardBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  logoutBtn: {
    height: 48,
    backgroundColor: "#EF4444",
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.md,
  },
  logoutBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
});
