import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  ComentarioDoc,
  subscribeComentarios,
  crearComentario,
  eliminarComentario,
} from "../services/comentarios";

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  entidadId: string | null;
  entidadTipo: "publicaciones" | "eventos" | "incidencias" | "posts";
  tituloEntidad?: string;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  onClose,
  entidadId,
  entidadTipo,
  tituloEntidad,
}) => {
  const { user } = useAuth();
  const [comentarios, setComentarios] = useState<ComentarioDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [nuevoTexto, setNuevoTexto] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isAdminOrModerator = user?.rol === "superadmin" || user?.rol === "moderador";

  useEffect(() => {
    if (!visible || !entidadId) {
      setComentarios([]);
      setLoading(true);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeComentarios(entidadId, (list) => {
      setComentarios(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [visible, entidadId]);

  const handleSendComment = async () => {
    if (!entidadId || !user || !nuevoTexto.trim()) return;
    setSubmitting(true);
    try {
      await crearComentario(entidadId, entidadTipo, user, nuevoTexto.trim());
      setNuevoTexto("");
    } catch (error: any) {
      Alert.alert("Acceso Restringido", error.message || "No se pudo comentar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (id: string) => {
    if (!entidadId) return;
    Alert.alert("Eliminar Comentario", "¿Deseas borrar este comentario?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => eliminarComentario(id, entidadId, entidadTipo),
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Comentarios</Text>
              {!!tituloEntidad && <Text style={s.subTitle} numberOfLines={1}>"{tituloEntidad}"</Text>}
            </View>
            <TouchableOpacity style={{ padding: 4 }} onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#234919" style={{ marginVertical: 30 }} />
          ) : (
            <FlatList
              data={comentarios}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item }) => {
                const canDelete = user?.uid === item.usuarioUid || isAdminOrModerator;
                return (
                  <View style={s.card}>
                    <View style={s.row}>
                      <View style={s.authorRow}>
                        <View style={s.avatar}>
                          <Text style={s.avatarTxt}>
                            {item.nombreUsuario ? item.nombreUsuario.charAt(0).toUpperCase() : "U"}
                          </Text>
                        </View>
                        <Text style={s.authorName}>{item.nombreUsuario}</Text>
                      </View>
                      {canDelete && (
                        <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={s.bodyTxt}>{item.texto}</Text>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Ionicons name="chatbubbles-outline" size={36} color="#94A3B8" />
                  <Text style={s.emptyTxt}>Sé el primero en comentar esta publicación.</Text>
                </View>
              }
            />
          )}

          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder="Escribe un comentario..."
              placeholderTextColor="#94A3B8"
              value={nuevoTexto}
              onChangeText={setNuevoTexto}
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, (!nuevoTexto.trim() || submitting) && { opacity: 0.5 }]}
              onPress={handleSendComment}
              disabled={!nuevoTexto.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "80%", minHeight: 300, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 24 : 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  title: { fontSize: 18, fontWeight: "bold", color: "#234919" },
  subTitle: { fontSize: 12, color: "#64748B", marginTop: 2 },
  card: { backgroundColor: "#F8FAFC", borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#234919", alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  authorName: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  bodyTxt: { fontSize: 13, color: "#334155", lineHeight: 18, paddingLeft: 36 },
  empty: { alignItems: "center", paddingVertical: 24 },
  emptyTxt: { marginTop: 6, fontSize: 13, color: "#64748B", textAlign: "center" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  input: { flex: 1, backgroundColor: "#F1F5F9", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, color: "#0F172A", maxHeight: 80 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#234919", alignItems: "center", justifyContent: "center" },
});