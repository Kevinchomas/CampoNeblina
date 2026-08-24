import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { theme } from "../constants/theme";
import { ReportePublicacion } from "../constants/types";
import {
  subscribeReportes,
  desestimarReporte,
  eliminarPublicacion,
} from "../services/marketplace";

export const AdminModerationScreen: React.FC = () => {
  const [reportes, setReportes] = useState<ReportePublicacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeReportes((list) => {
      setReportes(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDesestimar = async (reporte: ReportePublicacion) => {
    try {
      await desestimarReporte(reporte.id, reporte.publicacionId);
      Alert.alert("Éxito", "El reporte ha sido desestimado.");
    } catch (error: any) {
      Alert.alert("Error", "No se pudo desestimar el reporte.");
    }
  };

  const handleEliminar = (reporte: ReportePublicacion) => {
    Alert.alert(
      "Eliminar Publicación",
      `¿Deseas eliminar la publicación "${reporte.publicacionTitulo}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarPublicacion(reporte.publicacionId);
              await desestimarReporte(reporte.id, reporte.publicacionId);
              Alert.alert("Publicación Eliminada", "La publicación ha sido removida.");
            } catch (error: any) {
              Alert.alert("Error", "No se pudo eliminar la publicación.");
            }
          },
        },
      ]
    );
  };

  const renderReportCard = ({ item }: { item: ReportePublicacion }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.pubTitle}>"{item.publicacionTitulo}"</Text>
        <Text style={styles.dateText}>
          {item.fechaReporte ? new Date(item.fechaReporte).toLocaleDateString() : ""}
        </Text>
      </View>

      <Text style={styles.vendedorText}>Vendedor: <Text style={styles.bold}>{item.vendedorNombre}</Text></Text>

      <View style={styles.motivoBox}>
        <Text style={styles.motivoLabel}>Motivo del Reporte (por {item.reportadorNombre}):</Text>
        <Text style={styles.motivoText}>{item.motivo}</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.dismissBtn} onPress={() => handleDesestimar(item)}>
          <Text style={styles.dismissBtnText}>Desestimar Reporte</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleEliminar(item)}>
          <Text style={styles.deleteBtnText}>Eliminar Publicación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Moderación</Text>
        <Text style={styles.subtitle}>Revisiones de publicaciones reportadas por vecinos</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#5CA838" />
        </View>
      ) : (
        <FlatList
          data={reportes}
          keyExtractor={(item) => item.id}
          renderItem={renderReportCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>Sin reportes pendientes</Text>
              <Text style={styles.emptySubtitle}>No hay publicaciones marcadas para revisión.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F8F4" },
  header: { padding: theme.spacing.lg, paddingTop: theme.spacing.xl, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  title: { fontSize: 22, fontWeight: "bold", color: "#234919" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: theme.spacing.lg },
  card: { backgroundColor: "#FFFFFF", borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.md, borderWidth: 1, borderColor: "#E5E7EB" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  pubTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1D1A", flex: 1 },
  dateText: { fontSize: 12, color: "#9CA3AF", marginLeft: 8 },
  vendedorText: { fontSize: 13, color: "#4B5563", marginBottom: theme.spacing.sm },
  bold: { fontWeight: "bold", color: "#1A1D1A" },
  motivoBox: { backgroundColor: "#FEF2F2", padding: theme.spacing.sm, borderRadius: 6, borderWidth: 1, borderColor: "#FCA5A5", marginBottom: theme.spacing.md },
  motivoLabel: { fontSize: 12, fontWeight: "bold", color: "#991B1B", marginBottom: 2 },
  motivoText: { fontSize: 13, color: "#7F1D1D" },
  actionsRow: { flexDirection: "row", gap: 10 },
  dismissBtn: { flex: 1, height: 40, backgroundColor: "#E5E7EB", borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center" },
  dismissBtnText: { fontSize: 12, fontWeight: "bold", color: "#4B5563" },
  deleteBtn: { flex: 1, height: 40, backgroundColor: "#EF4444", borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center" },
  deleteBtnText: { fontSize: 12, fontWeight: "bold", color: "#FFFFFF" },
  emptyBox: { alignItems: "center", paddingVertical: theme.spacing.xl },
  emptyIcon: { fontSize: 44, marginBottom: theme.spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1D1A" },
  emptySubtitle: { fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 4 },
});