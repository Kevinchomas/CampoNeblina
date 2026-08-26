import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { UserProfile } from "../constants/types";
import { styles } from "../screens/HomeScreen.styles";

interface FeedHeaderProps {
  user: UserProfile | null;
  isAdminOrModerator: boolean;
  publishing: boolean;
  onSubmitPost: (texto: string, imageUri: string | null) => Promise<void> | void;
  onSubmitEncuesta: (pregunta: string, opciones: string[]) => Promise<void> | void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  user,
  isAdminOrModerator,
  publishing,
  onSubmitPost,
  onSubmitEncuesta,
}) => {
  const [isEncuestaMode, setIsEncuestaMode] = useState<boolean>(false);
  const [postTexto, setPostTexto] = useState<string>("");
  const [postImageUri, setPostImageUri] = useState<string | null>(null);

  const [preguntaEncuesta, setPreguntaEncuesta] = useState<string>("");
  const [opcion1, setOpcion1] = useState<string>("");
  const [opcion2, setOpcion2] = useState<string>("");
  const [opcion3, setOpcion3] = useState<string>("");

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

  const handlePostSubmit = async () => {
    if (!postTexto.trim() && !postImageUri) {
      Alert.alert("Publicación vacía", "Escribe un mensaje o adjunta una foto para publicar.");
      return;
    }
    await onSubmitPost(postTexto.trim(), postImageUri);
    setPostTexto("");
    setPostImageUri(null);
  };

  const handleEncuestaSubmit = async () => {
    if (!preguntaEncuesta.trim() || !opcion1.trim() || !opcion2.trim()) {
      Alert.alert("Encuesta Incompleta", "Ingresa la pregunta y al menos 2 opciones de respuesta.");
      return;
    }
    const opciones = [opcion1.trim(), opcion2.trim()];
    if (opcion3.trim()) opciones.push(opcion3.trim());

    await onSubmitEncuesta(preguntaEncuesta.trim(), opciones);
    setPreguntaEncuesta("");
    setOpcion1("");
    setOpcion2("");
    setOpcion3("");
    setIsEncuestaMode(false);
  };
  return (
    <View style={styles.createPostCard}>
      {isAdminOrModerator && (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <TouchableOpacity
            style={[
              { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: "#F1F5F9" },
              !isEncuestaMode && { backgroundColor: "#234919" },
            ]}
            onPress={() => setIsEncuestaMode(false)}
          >
            <Text style={{ fontSize: 12, fontWeight: "bold", color: !isEncuestaMode ? "#FFFFFF" : "#64748B" }}>
              Publicación
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: "#F1F5F9" },
              isEncuestaMode && { backgroundColor: "#234919" },
            ]}
            onPress={() => setIsEncuestaMode(true)}
          >
            <Text style={{ fontSize: 12, fontWeight: "bold", color: isEncuestaMode ? "#FFFFFF" : "#64748B" }}>
              Encuesta Fijada
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isEncuestaMode && isAdminOrModerator ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: "bold", color: "#234919" }}>
            Crear Encuesta Comunal (Fijada al inicio)
          </Text>
          <TextInput
            style={{ backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 8, fontSize: 13, color: "#0F172A" }}
            placeholder="Pregunta de la encuesta..."
            placeholderTextColor="#94A3B8"
            value={preguntaEncuesta}
            onChangeText={setPreguntaEncuesta}
          />
          <TextInput
            style={{ backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 8, fontSize: 12, color: "#0F172A" }}
            placeholder="Opción 1"
            placeholderTextColor="#94A3B8"
            value={opcion1}
            onChangeText={setOpcion1}
          />
          <TextInput
            style={{ backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 8, fontSize: 12, color: "#0F172A" }}
            placeholder="Opción 2"
            placeholderTextColor="#94A3B8"
            value={opcion2}
            onChangeText={setOpcion2}
          />
          <TextInput
            style={{ backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 8, fontSize: 12, color: "#0F172A" }}
            placeholder="Opción 3 (Opcional)"
            placeholderTextColor="#94A3B8"
            value={opcion3}
            onChangeText={setOpcion3}
          />

          <TouchableOpacity
            style={[styles.publishBtn, publishing && { opacity: 0.6 }]}
            onPress={handleEncuestaSubmit}
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
              {user?.nombreCompleto ? user.nombreCompleto.charAt(0).toUpperCase() : "U"}
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
            <TouchableOpacity onPress={() => setPostImageUri(null)} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handlePickPostImage} style={{ padding: 4 }}>
              <Ionicons name="image-outline" size={22} color="#234919" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.publishBtn, publishing && { opacity: 0.6 }]}
            onPress={handlePostSubmit}
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
};

