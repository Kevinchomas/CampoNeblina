import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CommentsModal } from "../components/CommentsModal";
import { EventCard } from "../components/EventCard";
import { HeaderActions } from "../components/HeaderActions";
import { SocialBar } from "../components/SocialBar";
import { theme } from "../constants/theme";
import { Evento, EventoCategoria } from "../constants/types";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { toggleLikeEntidad } from "../services/comentarios";
import {
  eliminarEvento,
  subscribeEventos,
  toggleAsistenciaEvento,
} from "../services/eventos";
import { db } from "../services/firebase";
import { PostDoc, subscribePosts, votarEncuesta } from "../services/posts";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Events">;

interface AsistenteDetalle {
  uid: string;
  nombreCompleto: string;
  inmuebleTexto: string;
  tipoResidente?: string;
}

export const EventsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [encuestas, setEncuestas] = useState<PostDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"todos" | "encuestas" | EventoCategoria>(
    "todos",
  );

  const [selectedEventoAttendees, setSelectedEventoAttendees] =
    useState<Evento | null>(null);
  const [asistentesDetalle, setAsistentesDetalle] = useState<
    AsistenteDetalle[]
  >([]);
  const [asistentesLoading, setAsistentesLoading] = useState<boolean>(false);

  // Modal de Comentarios
  const [commentTarget, setCommentTarget] = useState<{
    id: string;
    tipo: "eventos" | "posts";
    titulo?: string;
  } | null>(null);

  const isAdminOrModerator =
    user?.rol === "superadmin" || user?.rol === "moderador";

  useEffect(() => {
    const unsubEventos = subscribeEventos((list) => {
      setEventos(list);
      setLoading(false);
    });
    const unsubPosts = subscribePosts((list) => {
      setEncuestas(list.filter((p) => p.isEncuesta));
    });
    return () => {
      unsubEventos();
      unsubPosts();
    };
  }, []);

  const handleToggleAttendance = async (evento: Evento) => {
    if (!user) return;
    const yaAsiste = (evento.asistentes || []).includes(user.uid);
    try {
      await toggleAsistenciaEvento(evento.id, user.uid, yaAsiste);
    } catch (err: any) {
      Alert.alert("Error", "No se pudo actualizar tu confirmación.");
    }
  };

  const handleOpenAttendeesModal = async (evento: Evento) => {
    setSelectedEventoAttendees(evento);
    setAsistentesDetalle([]);
    const uids = evento.asistentes || [];

    if (uids.length === 0) {
      setAsistentesLoading(false);
      return;
    }

    setAsistentesLoading(true);
    try {
      const docsPromises = uids.map((uid) => getDoc(doc(db, "usuarios", uid)));
      const snapshots = await Promise.all(docsPromises);

      const detalles: AsistenteDetalle[] = snapshots.map((docSnap, idx) => {
        if (!docSnap.exists()) {
          return {
            uid: uids[idx],
            nombreCompleto: "Residente",
            inmuebleTexto: "Sin inmueble asociado",
          };
        }
        const data = docSnap.data();
        const nombreCompleto =
          data.nombreCompleto || data.nombre || "Residente";
        let inmuebleTexto = "";

        if (data.inmueble) {
          if (data.inmueble.torre && data.inmueble.apartamento) {
            inmuebleTexto = `Torre ${data.inmueble.torre}, Apto ${data.inmueble.apartamento}`;
          } else if (data.inmueble.codigo) {
            inmuebleTexto = `Torre ${data.inmueble.torre || ""}, Apt ${data.inmueble.codigo}`;
          } else if (data.inmueble.torre) {
            inmuebleTexto = `Torre ${data.inmueble.torre}`;
          }
        }
        if (!inmuebleTexto) {
          inmuebleTexto = data.email || "Sin inmueble asociado";
        }

        return {
          uid: docSnap.id,
          nombreCompleto,
          inmuebleTexto,
        };
      });

      setAsistentesDetalle(detalles);
    } catch (err) {
      console.error("Error al consultar asistentes:", err);
    } finally {
      setAsistentesLoading(false);
    }
  };

  const handleCloseAttendeesModal = () => {
    setSelectedEventoAttendees(null);
    setAsistentesDetalle([]);
    setAsistentesLoading(false);
  };

  const handleEdit = (evento: Evento) => {
    navigation.navigate("AdminCreateEvent", { eventoToEdit: evento });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar Evento",
      "¿Deseas eliminar este evento de la cartelera?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarEvento(id);
              Alert.alert("Éxito", "Evento eliminado.");
            } catch (err: any) {
              Alert.alert("Error", "No se pudo eliminar el evento.");
            }
          },
        },
      ],
    );
  };

  const combinedItems = React.useMemo(() => {
    if (filter === "encuestas") {
      return encuestas.map((e) => ({
        type: "encuesta" as const,
        data: e,
        date: e.fechaCreacion || "",
      }));
    }
    if (filter === "todos") {
      const evs = eventos.map((e) => ({
        type: "evento" as const,
        data: e,
        date: e.fechaActualizacion || e.fechaCreacion || "",
      }));
      const encs = encuestas.map((e) => ({
        type: "encuesta" as const,
        data: e,
        date: e.fechaCreacion || "",
      }));
      return [...evs, ...encs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }
    return eventos
      .filter((e) => e.categoria === filter)
      .map((e) => ({
        type: "evento" as const,
        data: e,
        date: e.fechaActualizacion || e.fechaCreacion || "",
      }));
  }, [eventos, encuestas, filter]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Cartelera de Eventos y Encuestas</Text>
            <Text style={styles.subtitle}>Asambleas, Cortes y Encuestas</Text>
          </View>
          <HeaderActions />
        </View>
      </View>

      <View style={styles.filterRow}>
        {[
          { label: "Todos", value: "todos" },
          { label: "Asambleas", value: "asamblea" },
          { label: "Cortes", value: "corte_programado" },
          { label: "Mantenimiento", value: "mantenimiento" },
          { label: "Social", value: "social" },
          { label: "Encuestas", value: "encuestas" },
        ].map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              filter === f.value && styles.filterChipSelected,
            ]}
            onPress={() => setFilter(f.value as any)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === f.value && styles.filterChipTextSelected,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#234919" />
        </View>
      ) : (
        <FlatList
          data={combinedItems}
          keyExtractor={(item) => item.data.id}
          renderItem={({ item }) => {
            if (item.type === "evento") {
              const e = item.data as Evento;
              return (
                <EventCard
                  item={e}
                  currentUserId={user?.uid}
                  isAdminOrModerator={isAdminOrModerator}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onToggleAttendance={handleToggleAttendance}
                  onShowAttendeesList={handleOpenAttendeesModal}
                  onToggleLike={async () => {
                    if (!user) return;
                    await toggleLikeEntidad(
                      e.id,
                      "eventos",
                      user.uid,
                      (e as any).likes || [],
                    );
                  }}
                  onOpenComments={() =>
                    setCommentTarget({
                      id: e.id,
                      tipo: "eventos",
                      titulo: e.titulo,
                    })
                  }
                />
              );
            } else {
              const p = item.data as PostDoc;
              const totalVotos = (p.opcionesEncuesta || []).reduce(
                (acc, curr) => acc + (curr.votos?.length || 0),
                0,
              );

              return (
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.md,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#D1FAE5",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "bold",
                          color: "#065F46",
                        }}
                      >
                        ENCUESTA COMUNAL
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#1A1D1A",
                      marginVertical: 6,
                    }}
                  >
                    {p.preguntaEncuesta || p.texto}
                  </Text>

                  <View style={{ marginVertical: 6, gap: 8 }}>
                    {(p.opcionesEncuesta || []).map((op) => {
                      const numVotos = op.votos?.length || 0;
                      const porcentaje =
                        totalVotos > 0
                          ? Math.round((numVotos / totalVotos) * 100)
                          : 0;
                      const votedThis = (op.votos || []).includes(
                        user?.uid || "",
                      );

                      return (
                        <TouchableOpacity
                          key={op.id}
                          style={{
                            backgroundColor: votedThis ? "#DCFCE7" : "#F8FAFC",
                            borderRadius: 8,
                            padding: 10,
                            borderWidth: votedThis ? 1.5 : 1,
                            borderColor: votedThis ? "#234919" : "#E2E8F0",
                          }}
                          onPress={() => {
                            if (user) votarEncuesta(p.id, op.id, user.uid);
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              marginBottom: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "600",
                                color: "#0F172A",
                              }}
                            >
                              {votedThis ? "✓ " : ""}
                              {op.texto}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "bold",
                                color: "#234919",
                              }}
                            >
                              {porcentaje}% ({numVotos})
                            </Text>
                          </View>
                          <View
                            style={{
                              height: 6,
                              backgroundColor: "#E2E8F0",
                              borderRadius: 3,
                              overflow: "hidden",
                            }}
                          >
                            <View
                              style={{
                                width: `${porcentaje}%`,
                                height: "100%",
                                backgroundColor: "#234919",
                              }}
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <SocialBar
                    likes={p.likes}
                    comentariosCount={p.numComentarios || 0}
                    currentUserId={user?.uid}
                    onToggleLike={() =>
                      user &&
                      toggleLikeEntidad(p.id, "posts", user.uid, p.likes || [])
                    }
                    onOpenComments={() =>
                      setCommentTarget({
                        id: p.id,
                        tipo: "posts",
                        titulo: p.preguntaEncuesta || p.texto,
                      })
                    }
                  />
                </View>
              );
            }
          }}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>
                No hay elementos en esta sección
              </Text>
              <Text style={styles.emptySubtitle}>
                Los eventos y encuestas oficiales aparecerán aquí.
              </Text>
            </View>
          }
        />
      )}

      {isAdminOrModerator && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("AdminCreateEvent")}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <Modal
        visible={!!selectedEventoAttendees}
        transparent
        animationType="fade"
        onRequestClose={handleCloseAttendeesModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmaciones de Asistencia</Text>
            <Text style={styles.modalSubtitle} numberOfLines={1}>
              "{selectedEventoAttendees?.titulo}"
            </Text>

            <View style={styles.badgeCountContainer}>
              <Text style={styles.attendeesTotalText}>
                Total confirmados:{" "}
                {(selectedEventoAttendees?.asistentes || []).length}{" "}
                residente(s)
              </Text>
            </View>

            {asistentesLoading ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="large" color="#234919" />
                <Text style={styles.modalLoadingText}>
                  Consultando residentes...
                </Text>
              </View>
            ) : asistentesDetalle.length === 0 ? (
              <View style={styles.modalEmptyBox}>
                <Ionicons name="people-outline" size={38} color="#94A3B8" />
                <Text style={styles.modalEmptyText}>
                  Aún no hay residentes confirmados para este evento.
                </Text>
              </View>
            ) : (
              <FlatList
                data={asistentesDetalle}
                keyExtractor={(item) => item.uid}
                style={styles.attendeesList}
                contentContainerStyle={{ paddingVertical: 4 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.attendeeCard}>
                    <View style={styles.attendeeIconBox}>
                      <Ionicons name="person" size={16} color="#234919" />
                    </View>
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeName}>
                        {item.nombreCompleto}
                      </Text>
                      <Text style={styles.attendeeInmueble}>
                        {item.inmuebleTexto}
                      </Text>
                    </View>
                    {item.tipoResidente && (
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                          {item.tipoResidente}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleCloseAttendeesModal}
            >
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CommentsModal
        visible={!!commentTarget}
        onClose={() => setCommentTarget(null)}
        entidadId={commentTarget?.id || null}
        entidadTipo={commentTarget?.tipo || "eventos"}
        tituloEntidad={commentTarget?.titulo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#234919" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: 6,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  filterChipSelected: { backgroundColor: "#234919" },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  filterChipTextSelected: { color: "#FFFFFF" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: theme.spacing.lg, paddingTop: 0 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#234919",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  emptyBox: { alignItems: "center", paddingVertical: theme.spacing.xl },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#234919" },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    marginBottom: 8,
  },
  badgeCountContainer: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  attendeesTotalText: { fontSize: 12, fontWeight: "600", color: "#234919" },

  modalLoadingBox: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  modalLoadingText: { marginTop: 8, fontSize: 13, color: "#64748B" },

  modalEmptyBox: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  modalEmptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },

  attendeesList: { maxHeight: 280, marginVertical: 4 },
  attendeeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  attendeeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  attendeeInfo: { flex: 1 },
  attendeeName: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  attendeeInmueble: { fontSize: 12, color: "#64748B", marginTop: 2 },
  roleBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#334155",
    textTransform: "capitalize",
  },

  closeBtn: {
    height: 44,
    backgroundColor: "#234919",
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  closeBtnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
});
