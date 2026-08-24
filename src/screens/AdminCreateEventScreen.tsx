import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { theme } from "../constants/theme";
import { Evento, EventoCategoria } from "../constants/types";
import { crearEvento, actualizarEvento } from "../services/eventos";
import { uploadImageToCloudinary } from "../services/cloudinary";
import { RootStackParamList } from "../navigation/AppNavigator";

type RouteProps = RouteProp<RootStackParamList, "AdminCreateEvent">;

const CATEGORIAS: { label: string; value: EventoCategoria }[] = [
  { label: "Asamblea", value: "asamblea" },
  { label: "Corte Programado", value: "corte_programado" },
  { label: "Mantenimiento", value: "mantenimiento" },
  { label: "Social", value: "social" },
];

export const AdminCreateEventScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();

  const eventoToEdit: Evento | undefined = route.params?.eventoToEdit;

  const [titulo, setTitulo] = useState(eventoToEdit?.titulo || "");
  const [descripcion, setDescripcion] = useState(eventoToEdit?.descripcion || "");
  const [categoria, setCategoria] = useState<EventoCategoria>(eventoToEdit?.categoria || "asamblea");
  const [fecha, setFecha] = useState(eventoToEdit?.fecha || "");
  const [hora, setHora] = useState(eventoToEdit?.hora || "");
  const [ubicacion, setUbicacion] = useState(eventoToEdit?.ubicacion || "");
  const [notaActualizacion, setNotaActualizacion] = useState(eventoToEdit?.notaActualizacion || "");
  const [imageUri, setImageUri] = useState<string | null>(eventoToEdit?.imagenUrl || null);
  const [imageChanged, setImageChanged] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso Denegado", "Se requiere acceso a la galería para adjuntar fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !descripcion.trim() || !fecha.trim() || !hora.trim() || !ubicacion.trim()) {
      Alert.alert("Campos requeridos", "Por favor completa el título, descripción, fecha, hora y ubicación.");
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      let finalImageUrl = imageUri || "";
      if (imageUri && imageChanged && !imageUri.startsWith("http")) {
        finalImageUrl = await uploadImageToCloudinary(imageUri);
      }

      if (eventoToEdit) {
        await actualizarEvento(eventoToEdit.id, {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          categoria,
          fecha: fecha.trim(),
          hora: hora.trim(),
          ubicacion: ubicacion.trim(),
          imagenUrl: finalImageUrl,
          notaActualizacion: notaActualizacion.trim(),
        });

        Alert.alert("Éxito", "El evento ha sido actualizado en la cartelera.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await crearEvento({
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          categoria,
          fecha: fecha.trim(),
          hora: hora.trim(),
          ubicacion: ubicacion.trim(),
          creadorUid: user.uid,
          creadorNombre: user.nombreCompleto,
          imagenUrl: finalImageUrl,
        });

        Alert.alert("Éxito", "El evento ha sido publicado en la cartelera.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo procesar el evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>
            {eventoToEdit ? "Editar Evento" : "Nuevo Evento / Citación"}
          </Text>
          <Text style={styles.subtitle}>
            {eventoToEdit
              ? "Modifica los datos del evento y notifica a los residentes"
              : "Publicación oficial para la cartelera comunal"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.selectorRow}>
            {CATEGORIAS.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[styles.catBtn, categoria === cat.value && styles.catBtnSelected]}
                onPress={() => setCategoria(cat.value)}
              >
                <Text style={[styles.catBtnText, categoria === cat.value && styles.catBtnTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Título del Evento</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Asamblea Extraordinaria de Propietarios"
            placeholderTextColor="#9CA3AF"
            value={titulo}
            onChangeText={setTitulo}
          />

          <Text style={styles.label}>Fecha (Ej. 15 de Septiembre 2026)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 15 de Septiembre 2026"
            placeholderTextColor="#9CA3AF"
            value={fecha}
            onChangeText={setFecha}
          />

          <Text style={styles.label}>Hora</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 10:00 AM"
            placeholderTextColor="#9CA3AF"
            value={hora}
            onChangeText={setHora}
          />

          <Text style={styles.label}>Ubicación / Lugar</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Salón de Fiestas Torre 8"
            placeholderTextColor="#9CA3AF"
            value={ubicacion}
            onChangeText={setUbicacion}
          />

          <Text style={styles.label}>Detalle / Orden del Día</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Puntos a tratar o indicaciones para los vecinos..."
            placeholderTextColor="#9CA3AF"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={4}
          />

          {eventoToEdit && (
            <>
              <Text style={styles.label}>Nota de Actualización (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Se cambió la fecha por lluvia / Nueva ubicación"
                placeholderTextColor="#9CA3AF"
                value={notaActualizacion}
                onChangeText={setNotaActualizacion}
              />
            </>
          )}

          <Text style={styles.label}>Flyer o Imagen Informativa (Opcional)</Text>
          {imageUri ? (
            <View style={styles.imagePreviewBox}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.changeImgBtn} onPress={handlePickImage}>
                <Text style={styles.changeImgText}>Cambiar foto / flyer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickImageBtn} onPress={handlePickImage}>
              <Text style={styles.pickImageText}>📷 Adjuntar flyer de la galería</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {eventoToEdit ? "Guardar Cambios" : "Publicar Evento"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F8F4" },
  scrollContent: { padding: theme.spacing.lg, paddingTop: theme.spacing.xl },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: 22, fontWeight: "bold", color: "#234919" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  card: { backgroundColor: "#FFFFFF", borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: "#E5E7EB" },
  label: { fontSize: 13, fontWeight: "600", color: "#1A1D1A", marginTop: theme.spacing.md, marginBottom: 4 },
  selectorRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: theme.spacing.xs },
  catBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" },
  catBtnSelected: { backgroundColor: "#234919", borderColor: "#234919" },
  catBtnText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },
  catBtnTextSelected: { color: "#FFFFFF" },
  input: { height: 46, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, fontSize: 14, color: "#1A1D1A", backgroundColor: "#FAFAFA" },
  textArea: { height: 90, paddingTop: theme.spacing.sm, textAlignVertical: "top" },
  pickImageBtn: { height: 48, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: "#234919", borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F9FA", marginTop: 4 },
  pickImageText: { fontSize: 13, fontWeight: "600", color: "#234919" },
  imagePreviewBox: { marginTop: 4, alignItems: "center" },
  imagePreview: { width: "100%", height: 160, borderRadius: theme.borderRadius.md },
  changeImgBtn: { marginTop: 6, paddingVertical: 4 },
  changeImgText: { fontSize: 13, color: "#234919", fontWeight: "600" },
  submitBtn: { height: 48, backgroundColor: "#5CA838", borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center", marginTop: theme.spacing.xl },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
});
