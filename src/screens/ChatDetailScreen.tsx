import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import { MensajeChat } from "../constants/types";
import {
  getChatId,
  enviarMensaje,
  subscribeMensajes,
  reportarMensaje,
  marcarChatComoLeido,
} from "../services/chat";
import { styles } from "./ChatDetailScreen.styles";

type Props = NativeStackScreenProps<RootStackParamList, "ChatDetail">;

export const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { user } = useAuth();
  const { destinatarioUid, destinatarioNombre, destinatarioInmueble } = route.params;

  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [nuevoTexto, setNuevoTexto] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);

  // Modal para reportar mensaje
  const [selectedForReport, setSelectedForReport] = useState<MensajeChat | null>(null);
  const [motivoReporte, setMotivoReporte] = useState<string>("");
  const [reportLoading, setReportLoading] = useState<boolean>(false);

  const flatListRef = useRef<FlatList>(null);
  const chatId = user ? getChatId(user.uid, destinatarioUid) : "";

  useEffect(() => {
    if (!chatId || !user) return;
    marcarChatComoLeido(chatId, user.uid);
    const unsubscribe = subscribeMensajes(chatId, (list) => {
      setMensajes(list);
      setLoading(false);
      marcarChatComoLeido(chatId, user.uid);
    });
    return () => unsubscribe();
  }, [chatId, user?.uid]);

  const handleSend = async () => {
    if (!nuevoTexto.trim() || !user || !chatId) return;

    const textoAEnviar = nuevoTexto.trim();
    setNuevoTexto("");
    setSending(true);

    try {
      await enviarMensaje({
        chatId,
        remitenteUid: user.uid,
        remitenteNombre: user.nombreCompleto,
        destinatarioUid,
        texto: textoAEnviar,
      });
    } catch (error: any) {
      Alert.alert("Error", "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const handleConfirmReport = async () => {
    if (!selectedForReport || !user) return;
    if (!motivoReporte.trim()) {
      Alert.alert("Motivo Requerido", "Ingresa una explicación para el reporte.");
      return;
    }

    setReportLoading(true);
    try {
      await reportarMensaje(
        selectedForReport,
        user.uid,
        user.nombreCompleto,
        motivoReporte.trim()
      );
      Alert.alert("Mensaje Reportado", "La Junta de Condominio revisará el caso.");
      setSelectedForReport(null);
      setMotivoReporte("");
    } catch (error: any) {
      Alert.alert("Error", "No se pudo enviar el reporte.");
    } finally {
      setReportLoading(false);
    }
  };

  const renderMensajeItem = ({ item }: { item: MensajeChat }) => {
    const esMio = item.remitenteUid === user?.uid;

    return (
      <View style={[styles.messageBubbleContainer, esMio ? styles.myMessageContainer : styles.theirMessageContainer]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => {
            if (!esMio) setSelectedForReport(item);
          }}
          style={[styles.messageBubble, esMio ? styles.myBubble : styles.theirBubble]}
        >
          <Text style={[styles.messageText, esMio ? styles.myMessageText : styles.theirMessageText]}>
            {item.texto}
          </Text>
          <Text style={[styles.messageTime, esMio ? styles.myMessageTime : styles.theirMessageTime]}>
            {item.fecha ? new Date(item.fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{destinatarioNombre}</Text>
          <Text style={styles.headerSubtitle}>
            Torre {destinatarioInmueble?.torre} - Apto {destinatarioInmueble?.codigo}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#5CA838" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          renderItem={renderMensajeItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Inicia la conversación</Text>
              <Text style={styles.emptySubtitle}>
                Escribe un mensaje para conversar con {destinatarioNombre}.
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#9CA3AF"
          value={nuevoTexto}
          onChangeText={setNuevoTexto}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!nuevoTexto.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!nuevoTexto.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>Enviar</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={!!selectedForReport}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedForReport(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reportar Mensaje</Text>
            <Text style={styles.modalSubtitle}>Remitente: {selectedForReport?.remitenteNombre}</Text>

            <View style={styles.msgPreviewBox}>
              <Text style={styles.msgPreviewText}>"{selectedForReport?.texto}"</Text>
            </View>

            <Text style={styles.modalLabel}>Motivo del Reporte:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Explica brevemente la falta..."
              placeholderTextColor="#9CA3AF"
              value={motivoReporte}
              onChangeText={setMotivoReporte}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedForReport(null)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmReport} disabled={reportLoading}>
                {reportLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.confirmBtnText}>Reportar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};
