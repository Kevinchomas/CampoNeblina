import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { Evento, EventoCategoria } from "../constants/types";

const EVENTOS_COLLECTION = "eventos";

export interface CrearEventoData {
  titulo: string;
  descripcion: string;
  categoria: EventoCategoria;
  fecha: string;
  hora: string;
  ubicacion: string;
  creadorUid: string;
  creadorNombre: string;
  imagenUrl?: string;
}

export interface ActualizarEventoData {
  titulo: string;
  descripcion: string;
  categoria: EventoCategoria;
  fecha: string;
  hora: string;
  ubicacion: string;
  imagenUrl?: string;
  notaActualizacion?: string;
}

/**
 * Crea un nuevo evento o citación oficial en la cartelera.
 */
export const crearEvento = async (data: CrearEventoData): Promise<Evento> => {
  const nuevoEvento = {
    titulo: data.titulo.trim(),
    descripcion: data.descripcion.trim(),
    categoria: data.categoria,
    fecha: data.fecha.trim(),
    hora: data.hora.trim(),
    ubicacion: data.ubicacion.trim(),
    creadorUid: data.creadorUid,
    creadorNombre: data.creadorNombre,
    fechaCreacion: new Date().toISOString(),
    asistentes: [],
    imagenUrl: data.imagenUrl || "",
    editado: false,
  };

  const docRef = await addDoc(collection(db, EVENTOS_COLLECTION), nuevoEvento);
  return { id: docRef.id, ...nuevoEvento };
};

/**
 * Actualiza los datos de un evento existente.
 */
export const actualizarEvento = async (
  eventoId: string,
  data: ActualizarEventoData
): Promise<void> => {
  const docRef = doc(db, EVENTOS_COLLECTION, eventoId);
  const ahoraIso = new Date().toISOString();
  await updateDoc(docRef, {
    titulo: data.titulo.trim(),
    descripcion: data.descripcion.trim(),
    categoria: data.categoria,
    fecha: data.fecha.trim(),
    hora: data.hora.trim(),
    ubicacion: data.ubicacion.trim(),
    imagenUrl: data.imagenUrl || "",
    editado: true,
    fechaActualizacion: ahoraIso,
    notaActualizacion: data.notaActualizacion ? data.notaActualizacion.trim() : "",
  });
};

/**
 * Alterna la confirmación de asistencia ("Asistiré") de un usuario en un evento.
 */
export const toggleAsistenciaEvento = async (
  eventoId: string,
  userUid: string,
  yaAsiste: boolean
): Promise<void> => {
  const docRef = doc(db, EVENTOS_COLLECTION, eventoId);
  await updateDoc(docRef, {
    asistentes: yaAsiste ? arrayRemove(userUid) : arrayUnion(userUid),
  });
};

/**
 * Escucha en tiempo real la lista de eventos.
 */
export const subscribeEventos = (callback: (lista: Evento[]) => void) => {
  const q = query(collection(db, EVENTOS_COLLECTION), orderBy("fecha", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Evento, "id">),
      }));
      callback(list);
    },
    (error) => console.error("Error al escuchar eventos:", error)
  );
};

/**
 * Elimina un evento de la cartelera.
 */
export const eliminarEvento = async (eventoId: string): Promise<void> => {
  await deleteDoc(doc(db, EVENTOS_COLLECTION, eventoId));
};

