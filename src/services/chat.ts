import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { MensajeChat, ReporteChat, ChatConversacion } from "../constants/types";

const REPORTES_CHATS_COLLECTION = "reportes_chats";

/**
 * Genera un ID único determinista para el canal de chat privado entre dos usuarios.
 */
export const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join("_");
};

export interface EnviarMensajeData {
  chatId: string;
  remitenteUid: string;
  remitenteNombre: string;
  destinatarioUid: string;
  texto: string;
}

/**
 * Envía un mensaje en un chat privado y actualiza/crea el documento de conversación con noLeidos e ultimoMensaje.
 */
export const enviarMensaje = async (data: EnviarMensajeData): Promise<MensajeChat> => {
  const fechaIso = new Date().toISOString();
  const nuevoMensaje = {
    chatId: data.chatId,
    remitenteUid: data.remitenteUid,
    remitenteNombre: data.remitenteNombre,
    destinatarioUid: data.destinatarioUid,
    texto: data.texto.trim(),
    fecha: fechaIso,
    leido: false,
  };

  const mensajesRef = collection(db, "chats", data.chatId, "mensajes");
  const docRef = await addDoc(mensajesRef, nuevoMensaje);

  // Actualizar o crear documento de conversación en 'chats/{chatId}'
  const chatDocRef = doc(db, "chats", data.chatId);
  const chatSnap = await getDoc(chatDocRef);

  if (!chatSnap.exists()) {
    // Crear la conversación con participantes y contador inicial de no leídos
    const nuevaConversacion: ChatConversacion = {
      id: data.chatId,
      participantes: [data.remitenteUid, data.destinatarioUid],
      noLeidos: {
        [data.destinatarioUid]: 1,
        [data.remitenteUid]: 0,
      },
      ultimoMensaje: data.texto.trim(),
      fechaUltimoMensaje: fechaIso,
    };
    await setDoc(chatDocRef, nuevaConversacion);
  } else {
    // Actualizar conversación existente incrementando el contador del destinatario
    await updateDoc(chatDocRef, {
      [`noLeidos.${data.destinatarioUid}`]: increment(1),
      ultimoMensaje: data.texto.trim(),
      fechaUltimoMensaje: fechaIso,
    });
  }

  return { id: docRef.id, ...nuevoMensaje };
};

/**
 * Suscribe a las conversaciones (chats) en las que participa el usuario actual (participantes array-contains uid).
 */
export const subscribeMisChats = (
  uid: string,
  callback: (chats: ChatConversacion[]) => void
) => {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("participantes", "array-contains", uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ChatConversacion, "id">),
      }));
      // Ordenar por fechaUltimoMensaje descendente en memoria de forma segura
      lista.sort((a, b) => {
        const fechaA = a.fechaUltimoMensaje || "";
        const fechaB = b.fechaUltimoMensaje || "";
        return fechaB.localeCompare(fechaA);
      });
      callback(lista);
    },
    (error) => {
      console.error("Error al escuchar mis chats:", error);
      callback([]);
    }
  );
};

/**
 * Marca como leídos los mensajes del chat para el usuario actual y resetea su contador de noLeidos a 0.
 */
export const marcarChatComoLeido = async (chatId: string, uid: string): Promise<void> => {
  try {
    const chatDocRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatDocRef);

    if (chatSnap.exists()) {
      const data = chatSnap.data() as ChatConversacion;
      const noLeidosMap = data.noLeidos || {};
      if (noLeidosMap[uid] && noLeidosMap[uid] > 0) {
        await updateDoc(chatDocRef, {
          [`noLeidos.${uid}`]: 0,
        });
      }
    }
  } catch (error) {
    console.error("Error marcando chat como leído:", error);
  }
};

/**
 * Escucha la lista de mensajes de un chat en tiempo real.
 */
export const subscribeMensajes = (
  chatId: string,
  callback: (mensajes: MensajeChat[]) => void
) => {
  const mensajesRef = collection(db, "chats", chatId, "mensajes");
  const q = query(mensajesRef, orderBy("fecha", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MensajeChat, "id">),
      }));
      callback(list);
    },
    (error) => console.error("Error al escuchar mensajes:", error)
  );
};

/**
 * Envía un reporte sobre un mensaje de acoso o conducta inapropiada hacia el panel de Admin.
 */
export const reportarMensaje = async (
  mensaje: MensajeChat,
  reportadorUid: string,
  reportadorNombre: string,
  motivo: string
): Promise<void> => {
  const reporte: Omit<ReporteChat, "id"> = {
    chatId: mensaje.chatId,
    mensajeId: mensaje.id,
    mensajeTexto: mensaje.texto,
    remitenteUid: mensaje.remitenteUid,
    remitenteNombre: mensaje.remitenteNombre,
    reportadorUid,
    reportadorNombre,
    motivo: motivo.trim(),
    fechaReporte: new Date().toISOString(),
  };

  await addDoc(collection(db, REPORTES_CHATS_COLLECTION), reporte);
};
