import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CommentsModal } from "../components/CommentsModal";
import { EventCard } from "../components/EventCard";
import { SocialBar } from "../components/SocialBar";
import {
  Comunicado,
  Evento,
  Incidencia,
  Publicacion,
} from "../constants/types";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { uploadImageToCloudinary } from "../services/cloudinary";
import { toggleLikeEntidad } from "../services/comentarios";
import { subscribeComunicados } from "../services/comunicados";
import {
  eliminarEvento,
  subscribeEventos,
  toggleAsistenciaEvento,
} from "../services/eventos";
import { db } from "../services/firebase";
import { subscribeIncidencias } from "../services/incidencias";
import {
  crearPublicacion,
  eliminarPublicacion,
  subirImagenStorage,
  subscribePublicaciones,
  toggleLikePublicacion,
} from "../services/marketplace";
import {
  crearEncuesta,
  crearPost,
  eliminarPost,
  PostDoc,
  subscribePosts,
  votarEncuesta,
} from "../services/posts";
import { styles } from "./HomeScreen.styles";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Home">;

type FilterType =
  | "todos"
  | "comunicados"
  | "posts"
  | "mercado"
  | "servicios"
  | "reclamos";

interface FeedItem {
  id: string;
  itemType:
    | "comunicado"
    | "producto"
    | "servicio"
    | "post"
    | "reclamo"
    | "evento"
    | "encuesta";
  isPinned?: boolean;
  rawDate: string;
  data: Comunicado | Publicacion | Incidencia | Evento | PostDoc;
}

interface AsistenteDetalle {
  uid: string;
  nombreCompleto: string;
  inmuebleTexto: string;
}

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();

  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Estados de datos
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [posts, setPosts] = useState<PostDoc[]>([]);

  // Estado de Creación de Publicación Social
  const [postTexto, setPostTexto] = useState<string>("");
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);

  // Estado de Encuestas (Solo Admins)
  const [isEncuestaMode, setIsEncuestaMode] = useState<boolean>(false);
  const [preguntaEncuesta, setPreguntaEncuesta] = useState<string>("");
  const [opcion1, setOpcion1] = useState<string>("");
  const [opcion2, setOpcion2] = useState<string>("");
  const [opcion3, setOpcion3] = useState<string>("");

  // Estado de Comentarios Modal Global
  const [commentTarget, setCommentTarget] = useState<{
    id: string;
    tipo: "publicaciones" | "eventos" | "incidencias" | "posts";
    titulo?: string;
  } | null>(null);

  // Estado de Asistentes a Eventos (Modal)
  const [selectedEventoAttendees, setSelectedEventoAttendees] =
    useState<Evento | null>(null);
  const [asistentesDetalle, setAsistentesDetalle] = useState<
    AsistenteDetalle[]
  >([]);
  const [asistentesLoading, setAsistentesLoading] = useState<boolean>(false);

  const isAdminOrModerator =
    user?.rol === "superadmin" || user?.rol === "moderador";

  useEffect(() => {
    const unsubComunicados = subscribeComunicados((list) =>
      setComunicados(list),
    );
    const unsubPublicaciones = subscribePublicaciones((list) =>
      setPublicaciones(list),
    );
    const unsubIncidencias = subscribeIncidencias((list) =>
      setIncidencias(list),
    );
    const unsubEventos = subscribeEventos((list) => setEventos(list));
    const unsubPosts = subscribePosts(
      (list) => {
        setPosts(list);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        setLoading(false);
        setRefreshing(false);
      },
    );

    return () => {
      unsubComunicados();
      unsubPublicaciones();
      unsubIncidencias();
      unsubEventos();
      unsubPosts();
    };
  }, []);

  const handleCreatePost = async () => {
    if (!user) return;
    if (user.status === "suspendido" || (user as any).puedePublicar === false) {
      Alert.alert(
        "Acceso Restringido",
        "No tienes permisos para publicar en la comunidad.",
      );
      return;
    }

    if (!postTexto.trim() && !postImageUri) {
      Alert.alert(
        "Publicación vacía",
        "Escribe un mensaje o adjunta una foto para publicar.",
      );
      return;
    }

    setPublishing(true);
    try {
      let finalImgUrl = "";
      if (postImageUri) {
        finalImgUrl = await uploadImageToCloudinary(postImageUri);
      }

      await crearPost(user, postTexto.trim(), finalImgUrl);
      setPostTexto("");
      setPostImageUri(null);
      Alert.alert(
        "Éxito",
        "Tu publicación ha sido compartida con la comunidad.",
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo realizar la publicación.",
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleCreateEncuesta = async () => {
    if (!user) return;
    if (!preguntaEncuesta.trim() || !opcion1.trim() || !opcion2.trim()) {
      Alert.alert(
        "Encuesta Incompleta",
        "Ingresa la pregunta y al menos 2 opciones de respuesta.",
      );
      return;
    }

    setPublishing(true);
    try {
      const opciones = [opcion1.trim(), opcion2.trim()];
      if (opcion3.trim()) opciones.push(opcion3.trim());

      await crearEncuesta(user, preguntaEncuesta.trim(), opciones);

      setPreguntaEncuesta("");
      setOpcion1("");
      setOpcion2("");
      setOpcion3("");
      setIsEncuestaMode(false);
      Alert.alert(
        "Éxito",
        "La encuesta fijada ha sido publicada en la comunidad.",
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo crear la encuesta.");
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishPost = async () => {
    if (!postTexto.trim() && !postImageUri) {
      Alert.alert(
        "Publicación vacía",
        "Escribe un mensaje o adjunta una foto.",
      );
      return;
    }
    if (!user) return;

    setPublishing(true);
    try {
      let finalImageUrl = "";
      if (postImageUri) {
        const fileName = `post_${Date.now()}_${user.uid}.jpg`;
        finalImageUrl = await subirImagenStorage(postImageUri, fileName);
      }

      await crearPublicacion({
        titulo: postTexto.trim().slice(0, 50) || "Publicación de Residente",
        descripcion: postTexto.trim(),
        precio: 0,
        tipo: "post",
        imagenUrl: finalImageUrl,
        vendedorUid: user.uid,
        vendedorNombre: user.nombreCompleto,
        vendedorTelefono: user.telefono,
        vendedorInmueble: user.inmueble,
      });

      setPostTexto("");
      setPostImageUri(null);
      Alert.alert(
        "Publicado",
        "Tu mensaje ha sido compartido en la comunidad.",
      );
    } catch (err: any) {
      Alert.alert("Error", "No se pudo crear la publicación.");
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleLike = async (pub: Publicacion) => {
    if (!user) return;
    const yaGusta = (pub.likes || []).includes(user.uid);
    try {
      await toggleLikePublicacion(pub.id, user.uid, yaGusta);
    } catch (err: any) {
      console.error("Error al dar like:", err);
    }
  };

  const handleDeletePublicacion = (publicacionId: string) => {
    Alert.alert(
      "Eliminar Publicación",
      "¿Deseas eliminar esta publicación del marketplace?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarPublicacion(publicacionId);
            } catch (err) {
              Alert.alert("Error", "No se pudo eliminar la publicación.");
            }
          },
        },
      ],
    );
  };

  const handlePickPostImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso Denegado", "Se requiere acceso a la galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPostImageUri(result.assets[0].uri);
    }
  };

  const handleDeletePostDoc = (postId: string) => {
    Alert.alert(
      "Eliminar Publicación",
      "¿Deseas eliminar esta publicación del feed?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarPost(postId);
            } catch (err) {
              Alert.alert("Error", "No se pudo eliminar.");
            }
          },
        },
      ],
    );
  };

  const renderListHeader = () => (
    <View style={styles.createPostCard}>
      {isAdminOrModerator && (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <TouchableOpacity
            style={[
              {
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor: "#F1F5F9",
              },
              !isEncuestaMode && { backgroundColor: "#234919" },
            ]}
            onPress={() => setIsEncuestaMode(false)}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: !isEncuestaMode ? "#FFFFFF" : "#64748B",
              }}
            >
              Publicación
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              {
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor: "#F1F5F9",
              },
              isEncuestaMode && { backgroundColor: "#234919" },
            ]}
            onPress={() => setIsEncuestaMode(true)}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: isEncuestaMode ? "#FFFFFF" : "#64748B",
              }}
            >
              Encuesta Fijada
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isEncuestaMode ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: "bold", color: "#234919" }}>
            Crear Encuesta Comunal (Fijada al inicio)
          </Text>
          <TextInput
            style={{
              backgroundColor: "#F8F9FA",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 8,
              padding: 8,
              fontSize: 13,
              color: "#0F172A",
            }}
            placeholder="Pregunta de la encuesta..."
            placeholderTextColor="#94A3B8"
            value={preguntaEncuesta}
            onChangeText={setPreguntaEncuesta}
          />
          <TextInput
            style={{
              backgroundColor: "#F8F9FA",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 8,
              padding: 8,
              fontSize: 12,
              color: "#0F172A",
            }}
            placeholder="Opción 1"
            placeholderTextColor="#94A3B8"
            value={opcion1}
            onChangeText={setOpcion1}
          />
          <TextInput
            style={{
              backgroundColor: "#F8F9FA",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 8,
              padding: 8,
              fontSize: 12,
              color: "#0F172A",
            }}
            placeholder="Opción 2"
            placeholderTextColor="#94A3B8"
            value={opcion2}
            onChangeText={setOpcion2}
          />
          <TextInput
            style={{
              backgroundColor: "#F8F9FA",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              borderRadius: 8,
              padding: 8,
              fontSize: 12,
              color: "#0F172A",
            }}
            placeholder="Opción 3 (Opcional)"
            placeholderTextColor="#94A3B8"
            value={opcion3}
            onChangeText={setOpcion3}
          />

          <TouchableOpacity
            style={[styles.publishBtn, publishing && { opacity: 0.6 }]}
            onPress={handleCreateEncuesta}
            disabled={publishing}
          >
            {publishing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.publishBtnText}>
                Publicar Encuesta Fijada
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.createPostHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.nombreCompleto
                ? user.nombreCompleto.charAt(0).toUpperCase()
                : "U"}
            </Text>
          </View>
          <TextInput
            style={styles.createPostInput}
            placeholder="¿Qué quieres compartir hoy con la comunidad?"
            placeholderTextColor="#94A3B8"
            value={postTexto}
            onChangeText={setPostTexto}
            multiline
          />
          {postImageUri ? (
            <TouchableOpacity
              onPress={() => setPostImageUri(null)}
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handlePickPostImage}
              style={{ padding: 4 }}
            >
              <Ionicons name="image-outline" size={22} color="#234919" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.publishBtn, publishing && { opacity: 0.6 }]}
            onPress={handleCreatePost}
            disabled={publishing}
          >
            {publishing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={14} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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

  // Construir feed social unificado con filtro de caducidad (7 días)
  const feedItems: FeedItem[] = [];
  const NOW = new Date().getTime();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // 1. Comunicados (siempre visibles)
  comunicados.forEach((c) => {
    feedItems.push({
      id: `c_${c.id}`,
      itemType: "comunicado",
      isPinned: c.prioridad === "alta",
      rawDate: c.fecha || new Date().toISOString(),
      data: c,
    });
  });

  // 2. Eventos (siempre visibles)
  eventos.forEach((e) => {
    feedItems.push({
      id: `e_${e.id}`,
      itemType: "evento",
      isPinned: e.categoria === "asamblea",
      rawDate:
        e.fechaActualizacion || e.fechaCreacion || new Date().toISOString(),
      data: e,
    });
  });

  // 3. Publicaciones & Mercado (Filtrar > 7 días)
  publicaciones.forEach((p) => {
    const postTime = new Date(p.fechaCreacion || 0).getTime();
    if (NOW - postTime <= SEVEN_DAYS_MS) {
      feedItems.push({
        id: `p_${p.id}`,
        itemType:
          p.tipo === "post"
            ? "post"
            : p.tipo === "servicio"
              ? "servicio"
              : "producto",
        isPinned: false,
        rawDate: p.fechaCreacion || new Date().toISOString(),
        data: p,
      });
    }
  });

  // 4. Incidencias/Reclamos
  incidencias.forEach((inc) => {
    feedItems.push({
      id: `i_${inc.id}`,
      itemType: "reclamo",
      isPinned: false,
      rawDate: inc.fechaCreacion || new Date().toISOString(),
      data: inc,
    });
  });

  // 5. Posts de la comunidad y encuestas
  posts.forEach((p) => {
    feedItems.push({
      id: `post_${p.id}`,
      itemType: p.isEncuesta ? "encuesta" : "post",
      isPinned: !!p.fijada || !!p.isEncuesta,
      rawDate: p.fechaCreacion || new Date().toISOString(),
      data: p,
    });
  });

  feedItems.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
  });

  const filteredItems = feedItems.filter((item) => {
    if (activeFilter === "todos") return true;
    if (activeFilter === "comunicados")
      return (
        item.itemType === "comunicado" ||
        item.itemType === "encuesta" ||
        item.itemType === "evento"
      );
    if (activeFilter === "posts") return item.itemType === "post";
    if (activeFilter === "mercado") return item.itemType === "producto";
    if (activeFilter === "servicios") return item.itemType === "servicio";
    if (activeFilter === "reclamos") return item.itemType === "reclamo";
    return true;
  });

  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    if (item.itemType === "encuesta") {
      const p = item.data as PostDoc;
      const totalVotos = (p.opcionesEncuesta || []).reduce(
        (sum, op) => sum + (op.votos?.length || 0),
        0,
      );

      return (
        <View style={[styles.card, styles.pinnedCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.authorRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="stats-chart" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.authorName}>{p.nombreUsuario}</Text>
                <Text style={styles.authorSubtext}>
                  Encuesta Comunal Fijada
                </Text>
              </View>
            </View>
            {isAdminOrModerator && (
              <TouchableOpacity onPress={() => handleDeletePostDoc(p.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.cardTitle, { fontSize: 15, marginVertical: 6 }]}>
            {p.preguntaEncuesta || p.texto}
          </Text>

          <View style={{ marginVertical: 6, gap: 8 }}>
            {(p.opcionesEncuesta || []).map((op) => {
              const numVotos = op.votos?.length || 0;
              const porcentaje =
                totalVotos > 0 ? Math.round((numVotos / totalVotos) * 100) : 0;
              const votedThis = (op.votos || []).includes(user?.uid || "");

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

          <Text
            style={{
              fontSize: 11,
              color: "#64748B",
              marginTop: 2,
              marginBottom: 4,
            }}
          >
            Total votos: {totalVotos}
          </Text>

          <SocialBar
            likes={p.likes}
            comentariosCount={p.numComentarios || 0}
            currentUserId={user?.uid}
            onToggleLike={() =>
              user && toggleLikeEntidad(p.id, "posts", user.uid, p.likes || [])
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

    if (item.itemType === "post") {
      const p = item.data as PostDoc;
      const isMine = user?.uid === p.usuarioUid;

      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.authorRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {p.nombreUsuario
                    ? p.nombreUsuario.charAt(0).toUpperCase()
                    : "U"}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>{p.nombreUsuario}</Text>
                <Text style={styles.authorSubtext}>Residente</Text>
              </View>
            </View>
            {(isMine || isAdminOrModerator) && (
              <TouchableOpacity onPress={() => handleDeletePostDoc(p.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.cardBody, { marginVertical: 4 }]}>
            {p.texto}
          </Text>

          {!!p.imagenUrl && (
            <Image
              source={{ uri: p.imagenUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}

          <SocialBar
            likes={p.likes}
            comentariosCount={p.numComentarios || 0}
            currentUserId={user?.uid}
            onToggleLike={() =>
              user && toggleLikeEntidad(p.id, "posts", user.uid, p.likes || [])
            }
            onOpenComments={() =>
              setCommentTarget({ id: p.id, tipo: "posts", titulo: p.texto })
            }
          />
        </View>
      );
    }
    if (item.itemType === "evento") {
      const e = item.data as Evento;
      return (
        <EventCard
          item={e}
          currentUserId={user?.uid}
          isAdminOrModerator={isAdminOrModerator}
          onDelete={(id) => eliminarEvento(id)}
          onEdit={(evt) =>
            navigation.navigate("AdminCreateEvent", { eventoToEdit: evt })
          }
          onToggleAttendance={async (evt) => {
            if (!user) return;
            const yaAsiste = (evt.asistentes || []).includes(user.uid);
            await toggleAsistenciaEvento(evt.id, user.uid, yaAsiste);
          }}
          onShowAttendeesList={handleOpenAttendeesModal}
          onToggleLike={() =>
            user &&
            toggleLikeEntidad(e.id, "eventos", user.uid, (e as any).likes || [])
          }
          onOpenComments={() =>
            setCommentTarget({ id: e.id, tipo: "eventos", titulo: e.titulo })
          }
        />
      );
    }

    if (item.itemType === "comunicado") {
      const c = item.data as Comunicado;
      const isAlerta = c.tipo === "alerta_pago";

      return (
        <View style={[styles.card, item.isPinned && styles.pinnedCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.authorRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <View>
                <Text style={styles.authorName}>Junta Directiva</Text>
                <Text style={styles.authorSubtext}>
                  {c.fecha ? new Date(c.fecha).toLocaleDateString() : ""}
                </Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              {item.isPinned && (
                <View style={styles.pinnedTag}>
                  <Text style={styles.pinnedTagText}>DESTACADO</Text>
                </View>
              )}
              <View style={[styles.soberBadge, styles.adminBadge]}>
                <Text style={[styles.soberBadgeText, styles.adminBadgeText]}>
                  ADMIN
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.postTitle}>{c.titulo}</Text>
          <Text style={styles.postBody}>{c.contenido}</Text>

          <View style={styles.cardFooter}>
            <Text style={styles.dateText}>
              {isAlerta ? "Alerta de Cobro Informativa" : "Comunicado Oficial"}
            </Text>
          </View>
        </View>
      );
    }

    if (item.itemType === "producto" || item.itemType === "servicio") {
      const p = item.data as Publicacion;

      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.authorRow}>
              <View
                style={[styles.avatarCircle, { backgroundColor: "#5CA838" }]}
              >
                <Text style={styles.avatarText}>
                  {p.vendedorNombre
                    ? p.vendedorNombre.charAt(0).toUpperCase()
                    : "V"}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>{p.vendedorNombre}</Text>
                <Text style={styles.authorSubtext}>
                  Torre {p.vendedorInmueble?.torre} - Apto{" "}
                  {p.vendedorInmueble?.codigo}
                </Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.soberBadge}>
                <Text style={styles.soberBadgeText}>
                  {p.tipo === "servicio" ? "SERVICIO" : "MERCADO"}
                </Text>
              </View>

              {isAdminOrModerator && (
                <TouchableOpacity onPress={() => handleDeletePublicacion(p.id)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.postTitle}>{p.titulo}</Text>
          <Text style={styles.marketPrice}>${p.precio?.toFixed(2)}</Text>

          <Text style={styles.postBody}>{p.descripcion}</Text>

          {p.imagenUrl ? (
            <Image
              source={{ uri: p.imagenUrl }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : null}

          <SocialBar
            likes={p.likes}
            comentariosCount={
              (p as any).numComentarios || p.comentarios?.length || 0
            }
            currentUserId={user?.uid}
            onToggleLike={() =>
              user &&
              toggleLikeEntidad(p.id, "publicaciones", user.uid, p.likes || [])
            }
            onOpenComments={() =>
              setCommentTarget({
                id: p.id,
                tipo: "publicaciones",
                titulo: p.titulo,
              })
            }
          />

          <View style={{ marginTop: 8, alignItems: "flex-end" }}>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => navigation.navigate("Marketplace")}
            >
              <Text style={styles.outlineBtnText}>Ver oferta</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (item.itemType === "reclamo") {
      const inc = item.data as Incidencia;

      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.authorRow}>
              <View
                style={[styles.avatarCircle, { backgroundColor: "#64748B" }]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#FFFFFF"
                />
              </View>
              <View>
                <Text style={styles.authorName}>Reporte Comunal</Text>
                <Text style={styles.authorSubtext}>
                  Categoría: {inc.categoria.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.soberBadge}>
              <Text style={styles.soberBadgeText}>RECLAMO</Text>
            </View>
          </View>

          <Text style={styles.postTitle}>{inc.titulo}</Text>
          <Text style={styles.postBody} numberOfLines={2}>
            {inc.descripcion}
          </Text>

          <SocialBar
            likes={(inc as any).likes}
            comentariosCount={(inc as any).numComentarios || 0}
            currentUserId={user?.uid}
            onToggleLike={() =>
              user &&
              toggleLikeEntidad(
                inc.id,
                "incidencias",
                user.uid,
                (inc as any).likes || [],
              )
            }
            onOpenComments={() =>
              setCommentTarget({
                id: inc.id,
                tipo: "incidencias",
                titulo: inc.titulo,
              })
            }
          />

          <View style={styles.cardFooter}>
            <Text style={styles.dateText}>
              Estado: {inc.estado.toUpperCase()}
            </Text>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => navigation.navigate("Incidencias")}
            >
              <Text style={styles.outlineBtnText}>Ver detalle</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header Superior Urbano y Profesional */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Campo Neblina</Text>
          <Text style={styles.brandSubtitle}>Comunidad & Gestión Urbana</Text>
        </View>

        <TouchableOpacity
          style={styles.chatIconButton}
          onPress={() => navigation.navigate("ChatList")}
        >
          <Ionicons name="chatbubbles-outline" size={22} color="#234919" />
          <View style={styles.unreadDot} />
        </TouchableOpacity>
      </View>

      {/* Barra de Filtros Sobria (Chips / Pills) */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {[
            { id: "todos", label: "Todos" },
            { id: "comunicados", label: "Comunicados" },
            { id: "posts", label: "Posts" },
            { id: "mercado", label: "Mercado" },
            { id: "servicios", label: "Servicios" },
            { id: "reclamos", label: "Reclamos" },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.id as FilterType)}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed Principal Social */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234919" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderListHeader}
          renderItem={renderFeedItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              colors={["#234919"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>
                No hay publicaciones en esta sección
              </Text>
              <Text style={styles.emptySubtitle}>
                El contenido actualizado aparecerá en este feed.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal de Confirmaciones de Asistencia a Eventos */}
      <Modal
        visible={!!selectedEventoAttendees}
        transparent
        animationType="fade"
        onRequestClose={handleCloseAttendeesModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.attendeesModalContent}>
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
        entidadTipo={commentTarget?.tipo || "posts"}
        tituloEntidad={commentTarget?.titulo}
      />
    </View>
  );
};
