import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import { theme } from "../constants/theme";
import { Publicacion, PublicacionTipo } from "../constants/types";
import {
  subscribePublicaciones,
  reportarPublicacion,
  eliminarPublicacion,
} from "../services/marketplace";
import { toggleLikeEntidad } from "../services/comentarios";
import { ProductCard } from "../components/ProductCard";
import { CommentsModal } from "../components/CommentsModal";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Marketplace">;

export const MarketplaceScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<"todos" | PublicacionTipo>("todos");

  const [selectedForReport, setSelectedForReport] = useState<Publicacion | null>(null);
  const [motivoReporte, setMotivoReporte] = useState<string>("");
  const [reportLoading, setReportLoading] = useState<boolean>(false);

  // Modal de Comentarios
  const [commentTarget, setCommentTarget] = useState<Publicacion | null>(null);

  const isAdminOrModerator = user?.rol === "superadmin" || user?.rol === "moderador";

  useEffect(() => {
    const unsubscribe = subscribePublicaciones((lista) => {
      setPublicaciones(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleConfirmReport = async () => {
    if (!selectedForReport || !user) return;
    if (!motivoReporte.trim()) {
      Alert.alert("Motivo Requerido", "Escribe una breve explicación de tu reporte.");
      return;
    }

    setReportLoading(true);
    try {
      await reportarPublicacion(
        selectedForReport,
        user.uid,
        user.nombreCompleto,
        motivoReporte.trim()
      );
      Alert.alert("Reporte Enviado", "Gracias por colaborar. La Junta revisará la publicación.");
      setSelectedForReport(null);
      setMotivoReporte("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo enviar el reporte.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleDelete = (publicacionId: string) => {
    Alert.alert(
      "Eliminar Publicación",
      "¿Estás seguro de que deseas eliminar esta publicación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarPublicacion(publicacionId);
            } catch (err: any) {
              Alert.alert("Error", "No se pudo eliminar la publicación.");
            }
          },
        },
      ]
    );
  };

  const filteredPublicaciones = publicaciones.filter((p) => {
    const matchesSearch =
      p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendedorNombre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "todos" || p.tipo === categoryFilter;

    return matchesSearch && matchesCategory;
  });
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Marketplace Vecinal</Text>
          {isAdminOrModerator && (
            <TouchableOpacity
              style={styles.modBtn}
              onPress={() => navigation.navigate("AdminModeration")}
            >
              <Text style={styles.modBtnText}>🛡️ Moderación</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>Compra y venta entre residentes de Campo Neblina</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto o servicio..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        {[
          { label: "Todos", value: "todos" },
          { label: "Productos", value: "producto" },
          { label: "Servicios", value: "servicio" },
        ].map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.filterChip, categoryFilter === cat.value && styles.filterChipSelected]}
            onPress={() => setCategoryFilter(cat.value as any)}
          >
            <Text style={[styles.filterChipText, categoryFilter === cat.value && styles.filterChipTextSelected]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#5CA838" />
        </View>
      ) : (
        <FlatList
          data={filteredPublicaciones}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              currentUserId={user?.uid}
              onReport={(pub) => {
                setSelectedForReport(pub);
                setMotivoReporte("");
              }}
              onDelete={handleDelete}
              onToggleLike={async () => {
                if (!user) return;
                await toggleLikeEntidad(item.id, "publicaciones", user.uid, item.likes || []);
              }}
              onOpenComments={() => setCommentTarget(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🛍️</Text>
              <Text style={styles.emptyTitle}>No hay publicaciones disponibles</Text>
              <Text style={styles.emptySubtitle}>Sé el primero en ofrecer un producto o servicio.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreatePublication")}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={!!selectedForReport}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedForReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reportar Publicación</Text>
            <Text style={styles.modalSubtitle}>"{selectedForReport?.titulo}"</Text>

            <Text style={styles.modalLabel}>Motivo del Reporte:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Contenido ofensivo o estafa..."
              placeholderTextColor="#9CA3AF"
              value={motivoReporte}
              onChangeText={setMotivoReporte}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedForReport(null)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmReport}
                disabled={reportLoading}
              >
                {reportLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Enviar Reporte</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CommentsModal
        visible={!!commentTarget}
        onClose={() => setCommentTarget(null)}
        entidadId={commentTarget?.id || null}
        entidadTipo="publicaciones"
        tituloEntidad={commentTarget?.titulo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F8F4" },
  header: { padding: theme.spacing.lg, paddingTop: theme.spacing.xl, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#234919" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  modBtn: { backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  modBtnText: { fontSize: 12, fontWeight: "bold", color: "#D97706" },
  searchBox: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
  searchInput: { height: 44, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, fontSize: 14, color: "#1A1D1A" },
  filterRow: { flexDirection: "row", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#E5E7EB" },
  filterChipSelected: { backgroundColor: "#234919" },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },
  filterChipTextSelected: { color: "#FFFFFF" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: theme.spacing.lg, paddingTop: 0 },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#5CA838", alignItems: "center", justifyContent: "center", elevation: 5 },
  fabIcon: { fontSize: 32, color: "#FFFFFF", marginTop: -2 },
  emptyBox: { alignItems: "center", paddingVertical: theme.spacing.xl },
  emptyIcon: { fontSize: 44, marginBottom: theme.spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1D1A" },
  emptySubtitle: { fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: theme.spacing.lg },
  modalContent: { backgroundColor: "#FFFFFF", borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#991B1B" },
  modalSubtitle: { fontSize: 13, color: "#6B7280", marginVertical: 4 },
  modalLabel: { fontSize: 13, fontWeight: "600", color: "#1A1D1A", marginTop: theme.spacing.md, marginBottom: 4 },
  modalInput: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, fontSize: 14, minHeight: 60, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", marginTop: theme.spacing.lg, gap: 10 },
  cancelBtn: { flex: 1, height: 42, backgroundColor: "#E5E7EB", borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center" },
  cancelBtnText: { color: "#4B5563", fontWeight: "bold" },
  confirmBtn: { flex: 1, height: 42, backgroundColor: "#EF4444", borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center" },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "bold" },
});

