import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { theme } from "../constants/theme";

export const PendingApprovalScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Text style={styles.icon}>⏳</Text>
          </View>

          <Text style={styles.title}>Cuenta en Revisión</Text>
          <Text style={styles.description}>
            Tu cuenta está en revisión por la Junta de Condominio de Campo Neblina.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Datos Registrados:</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{user?.nombreCompleto || "N/A"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Correo:</Text>
              <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cédula/DNI:</Text>
              <Text style={styles.infoValue}>{user?.cedulaDni || "N/A"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Inmueble:</Text>
              <Text style={styles.inmuebleBadge}>
                Torre {user?.inmueble?.torre} - Piso {user?.inmueble?.piso} - Apto {user?.inmueble?.apartamento} ({user?.inmueble?.codigo})
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estado:</Text>
              <Text style={styles.statusBadge}>Pendiente de Aprobación</Text>
            </View>
          </View>

          <Text style={styles.note}>
            Una vez validada tu información por la administración, podrás acceder a todas las funcionalidades del condominio de manera automática.
          </Text>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#234919",
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  description: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: theme.spacing.lg,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A1D1A",
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 13,
    color: "#1A1D1A",
    fontWeight: "500",
  },
  inmuebleBadge: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#234919",
    backgroundColor: "#E5EAE2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#D97706",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  note: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 18,
  },
  logoutButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#EF4444",
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
