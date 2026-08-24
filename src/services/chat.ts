import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { MensajeChat, ReporteChat } from "../constants/types";

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
 * Envía un mensaje en un chat privado.
 */
export const enviarMensaje = async (data: EnviarMensajeData): Promise<MensajeChat> => {
  const nuevoMensaje = {
    chatId: data.chatId,
    remitenteUid: data.remitenteUid,
    remitenteNombre: data.remitenteNombre,
    destinatarioUid: data.destinatarioUid,
    texto: data.texto.trim(),
    fecha: new Date().toISOString(),
  };

  const mensajesRef = collection(db, "chats", data.chatId, "mensajes");
  const docRef = await addDoc(mensajesRef, nuevoMensaje);

  return { id: docRef.id, ...nuevoMensaje };
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
