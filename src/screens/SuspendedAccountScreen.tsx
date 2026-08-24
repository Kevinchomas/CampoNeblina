import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { theme } from "../constants/theme";

export const SuspendedAccountScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleContactJunta = () => {
    Alert.alert(
      "Contacto con la Junta",
      "Para solicitar la reactivación de tu cuenta, contáctanos vía correo: junta@camponeblina.com",
      [
        { text: "Enviar Correo", onPress: () => Linking.openURL("mailto:junta@camponeblina.com") },
        { text: "Entendido", style: "cancel" },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Text style={styles.icon}>🚫</Text>
          </View>

          <Text style={styles.title}>Cuenta Suspendida</Text>
          <Text style={styles.subtitle}>
            Tu acceso a la plataforma ha sido restringido por la Junta de Condominio.
          </Text>

          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Motivo de la Suspensión:</Text>
            <Text style={styles.reasonText}>
              {user?.motivoSuspension || "Pendiente de pago de condominio o revisión administrativa."}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Información del Residente:</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{user?.nombreCompleto || "N/A"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cédula/DNI:</Text>
              <Text style={styles.infoValue}>{user?.cedulaDni || "N/A"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Inmueble:</Text>
              <Text style={styles.inmuebleBadge}>
                Torre {user?.inmueble?.torre} - Apto {user?.inmueble?.codigo}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.contactButton} onPress={handleContactJunta}>
            <Text style={styles.contactButtonText}>Contactar a la Junta</Text>
          </TouchableOpacity>

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
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#991B1B",
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  reasonBox: {
    width: "100%",
    backgroundColor: "#FEF2F2",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginBottom: theme.spacing.lg,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#991B1B",
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: "#7F1D1D",
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
    fontSize: 14,
    fontWeight: "bold",
    color: "#1A1D1A",
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 13,
    color: "#1A1D1A",
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
  contactButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#234919",
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
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
    fontSize: 15,
    fontWeight: "bold",
  },
});
