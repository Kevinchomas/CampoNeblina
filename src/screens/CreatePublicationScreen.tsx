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
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { theme } from "../constants/theme";
import { PublicacionTipo } from "../constants/types";
import { crearPublicacion, subirImagenStorage } from "../services/marketplace";
import { validarContenido } from "../utils/moderation";

export const CreatePublicationScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState<PublicacionTipo>("producto");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [imageUri, setImageUri] = useState<string | null>(null);
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
    }
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !descripcion.trim() || !precio.trim() || !telefono.trim()) {
      Alert.alert("Campos requeridos", "Por favor completa el título, descripción, precio y teléfono.");
      return;
    }

    const numPrecio = parseFloat(precio);
    if (isNaN(numPrecio) || numPrecio <= 0) {
      Alert.alert("Precio inválido", "Por favor ingresa un precio mayor a 0.");
      return;
    }

    const validacionTitulo = validarContenido(titulo);
    if (!validacionTitulo.esValido) {
      Alert.alert("Contenido no permitido", validacionTitulo.motivo);
      return;
    }

    const validacionDesc = validarContenido(descripcion);
    if (!validacionDesc.esValido) {
      Alert.alert("Contenido no permitido", validacionDesc.motivo);
      return;
    }

    if (!user) {
      Alert.alert("Error", "Debes estar autenticado para publicar.");
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = "";
      if (imageUri) {
        const fileName = `${Date.now()}_${user.uid}.jpg`;
        finalImageUrl = await subirImagenStorage(imageUri, fileName);
      }

      await crearPublicacion({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: numPrecio,
        tipo,
        imagenUrl: finalImageUrl,
        vendedorUid: user.uid,
        vendedorNombre: user.nombreCompleto,
        vendedorTelefono: telefono.trim(),
        vendedorInmueble: user.inmueble,
      });

      Alert.alert("Éxito", "Tu publicación ha sido creada correctamente.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo crear la publicación.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Nueva Publicación</Text>
          <Text style={styles.subtitle}>Ofrece un producto o servicio a la comunidad</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Tipo de Publicación</Text>
          <View style={styles.selectorRow}>
            <TouchableOpacity
              style={[styles.typeBtn, tipo === "producto" && styles.typeBtnSelected]}
              onPress={() => setTipo("producto")}
            >
              <Text style={[styles.typeBtnText, tipo === "producto" && styles.typeBtnTextSelected]}>
                📦 Producto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, tipo === "servicio" && styles.typeBtnSelected]}
              onPress={() => setTipo("servicio")}
            >
              <Text style={[styles.typeBtnText, tipo === "servicio" && styles.typeBtnTextSelected]}>
                🛠️ Servicio
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Torta de Chocolate / Reparación de PCs"
            placeholderTextColor="#9CA3AF"
            value={titulo}
            onChangeText={setTitulo}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe tu producto o servicio en detalle..."
            placeholderTextColor="#9CA3AF"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Precio ($ USD)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. 15.00"
            placeholderTextColor="#9CA3AF"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Teléfono de Contacto (WhatsApp)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. +58 412 1234567"
            placeholderTextColor="#9CA3AF"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Fotografía del Producto/Servicio</Text>
          {imageUri ? (
            <View style={styles.imagePreviewBox}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.changeImgBtn} onPress={handlePickImage}>
                <Text style={styles.changeImgText}>Cambiar foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickImageBtn} onPress={handlePickImage}>
              <Text style={styles.pickImageText}>📷 Adjuntar foto de la galería</Text>
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
              <Text style={styles.submitBtnText}>Publicar</Text>
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
  title: { fontSize: 24, fontWeight: "bold", color: "#234919" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  card: { backgroundColor: "#FFFFFF", borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: "#E5E7EB" },
  label: { fontSize: 13, fontWeight: "600", color: "#1A1D1A", marginTop: theme.spacing.md, marginBottom: 4 },
  input: { height: 46, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, fontSize: 14, color: "#1A1D1A", backgroundColor: "#FAFAFA" },
  textArea: { height: 80, paddingTop: theme.spacing.sm, textAlignVertical: "top" },
  selectorRow: { flexDirection: "row", gap: 10, marginBottom: theme.spacing.xs },
  typeBtn: { flex: 1, height: 44, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" },
  typeBtnSelected: { backgroundColor: "#234919", borderColor: "#234919" },
  typeBtnText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },
  typeBtnTextSelected: { color: "#FFFFFF" },
  pickImageBtn: { height: 48, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: "#234919", borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: "#F8F9FA", marginTop: 4 },
  pickImageText: { fontSize: 14, fontWeight: "600", color: "#234919" },
  imagePreviewBox: { marginTop: 4, alignItems: "center" },
  imagePreview: { width: "100%", height: 160, borderRadius: theme.borderRadius.md },
  changeImgBtn: { marginTop: 6, paddingVertical: 4 },
  changeImgText: { fontSize: 13, color: "#234919", fontWeight: "600" },
  submitBtn: { height: 48, backgroundColor: "#5CA838", borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center", marginTop: theme.spacing.xl },
  btnDisabled: { opacity: 0.7 },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
