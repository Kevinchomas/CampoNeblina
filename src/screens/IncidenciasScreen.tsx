import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import { theme } from "../constants/theme";
import { Incidencia, IncidenciaCategoria } from "../constants/types";
import { crearIncidencia, subscribeIncidencias } from "../services/incidencias";
import { toggleLikeEntidad } from "../services/comentarios";
import { SocialBar } from "../components/SocialBar";
import { CommentsModal } from "../components/CommentsModal";
import { styles } from "./IncidenciasScreen.styles";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Incidencias">;

const CATEGORIAS: { label: string; value: IncidenciaCategoria; icon: string }[] = [
  { label: "Agua", value: "agua", icon: "💧" },
  { label: "Electricidad", value: "electricidad", icon: "⚡" },
  { label: "Ascensores", value: "ascensores", icon: "🛗" },
  { label: "Ruido", value: "ruido", icon: "🔊" },
  { label: "Mantenimiento", value: "mantenimiento", icon: "🧹" },
  { label: "Otro", value: "otro", icon: "📌" },
];

export const IncidenciasScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<IncidenciaCategoria>("agua");
  const [submitting, setSubmitting] = useState(false);

  // Modal de Comentarios
  const [commentTarget, setCommentTarget] = useState<Incidencia | null>(null);

  const isAdminOrModerator = user?.rol === "superadmin" || user?.rol === "moderador";

  useEffect(() => {
    const unsubscribe = subscribeIncidencias((lista) => {
      // Filtrar las incidencias del usuario si no es admin, o mostrar las suyas
      const mías = lista.filter((i) => i.usuarioUid === user?.uid);
      setIncidencias(mías);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleSubmit = async () => {
    if (!titulo.trim() || !descripcion.trim()) {
      Alert.alert("Campos requeridos", "Ingresa un título y una descripción para el reclamo.");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      await crearIncidencia({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        usuarioUid: user.uid,
        usuarioNombre: user.nombreCompleto,
        usuarioInmueble: user.inmueble,
      });

      Alert.alert("Reclamo Enviado", "Tu reporte ha sido remitido a la Junta de Condominio.");
      setTitulo("");
      setDescripcion("");
    } catch (error: any) {
      Alert.alert("Error", "No se pudo registrar la incidencia.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderIncidenciaItem = ({ item }: { item: Incidencia }) => {
    const isPendiente = item.estado === "pendiente";
    const isEnProceso = item.estado === "en_proceso";
    const isResuelto = item.estado === "resuelto";

    return (
      <View style={styles.incidenciaCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.titulo}</Text>
          <View
            style={[
              styles.statusBadge,
              isPendiente && styles.bgYellow,
              isEnProceso && styles.bgBlue,
              isResuelto && styles.bgGreen,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isPendiente && styles.textYellow,
                isEnProceso && styles.textBlue,
                isResuelto && styles.textGreen,
              ]}
            >
              {isPendiente ? "Pendiente" : isEnProceso ? "En Proceso" : "Resuelto"}
            </Text>
          </View>
        </View>

        <Text style={styles.categoryText}>Categoría: {item.categoria.toUpperCase()}</Text>
        <Text style={styles.cardDesc}>{item.descripcion}</Text>

        {item.respuestaJunta ? (
          <View style={styles.respuestaBox}>
            <Text style={styles.respuestaTitle}>Respuesta de la Junta:</Text>
            <Text style={styles.respuestaText}>{item.respuestaJunta}</Text>
          </View>
        ) : null}

        <SocialBar
          likes={(item as any).likes}
          comentariosCount={(item as any).numComentarios || 0}
          currentUserId={user?.uid}
          onToggleLike={async () => {
            if (!user) return;
            await toggleLikeEntidad(item.id, "incidencias", user.uid, (item as any).likes || []);
          }}
          onOpenComments={() => setCommentTarget(item)}
        />

        <Text style={styles.dateText}>
          {item.fechaCreacion ? new Date(item.fechaCreacion).toLocaleDateString() : ""}
        </Text>
      </View>
    );
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Buzón de Incidencias</Text>
            {isAdminOrModerator && (
              <TouchableOpacity
                style={styles.adminBtn}
                onPress={() => navigation.navigate("AdminIncidencias")}
              >
                <Text style={styles.adminBtnText}>📋 Reclamos Junta</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.subtitle}>Reporta fallas o problemas directamente a la Junta</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Crear Nuevo Reporte</Text>

          <Text style={styles.label}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {CATEGORIAS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.catChip, categoria === c.value && styles.catChipSelected]}
                onPress={() => setCategoria(c.value)}
              >
                <Text style={[styles.catChipText, categoria === c.value && styles.catChipTextSelected]}>
                  {c.icon} {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Título del Problema</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Bote de agua en piso 4 / Ascensor atascado"
            placeholderTextColor="#9CA3AF"
            value={titulo}
            onChangeText={setTitulo}
          />

          <Text style={styles.label}>Descripción Detallada</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Explica la falla y su ubicación exacta..."
            placeholderTextColor="#9CA3AF"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Enviar Reclamo</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Mis Reportes Realizados</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#5CA838" />
          </View>
        ) : (
          <FlatList
            data={incidencias}
            keyExtractor={(item) => item.id}
            renderItem={renderIncidenciaItem}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyTitle}>No has registrado reclamos</Text>
                <Text style={styles.emptySubtitle}>Tus reportes y su estatus aparecerán aquí.</Text>
              </View>
            }
          />
        )}

        <CommentsModal
          visible={!!commentTarget}
          onClose={() => setCommentTarget(null)}
          entidadId={commentTarget?.id || null}
          entidadTipo="incidencias"
          tituloEntidad={commentTarget?.titulo}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};