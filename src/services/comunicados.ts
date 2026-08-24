import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { Comunicado, ComunicadoTipo } from "../constants/types";

const COMUNICADOS_COLLECTION = "comunicados";

export interface CrearComunicadoData {
  titulo: string;
  contenido: string;
  tipo: ComunicadoTipo;
  autor?: string;
  prioridad?: "alta" | "normal";
}

/**
 * Publica un nuevo comunicado oficial o alerta de cobro/pago en Firestore.
 */
export const publicarComunicado = async (
  data: CrearComunicadoData
): Promise<Comunicado> => {
  const nuevoComunicado = {
    titulo: data.titulo.trim(),
    contenido: data.contenido.trim(),
    tipo: data.tipo,
    autor: data.autor || "Junta de Condominio",
    fecha: new Date().toISOString(),
    prioridad: data.prioridad || "normal",
  };

  const docRef = await addDoc(
    collection(db, COMUNICADOS_COLLECTION),
    nuevoComunicado
  );

  return {
    id: docRef.id,
    ...nuevoComunicado,
  };
};

/**
 * Obtiene la lista de todos los comunicados ordenados por fecha descendente.
 */
export const getComunicados = async (): Promise<Comunicado[]> => {
  const q = query(
    collection(db, COMUNICADOS_COLLECTION),
    orderBy("fecha", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Comunicado, "id">),
  }));
};

/**
 * Escucha cambios en tiempo real en los comunicados.
 */
export const subscribeComunicados = (
  callback: (comunicados: Comunicado[]) => void
) => {
  const q = query(
    collection(db, COMUNICADOS_COLLECTION),
    orderBy("fecha", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Comunicado, "id">),
      }));
      callback(list);
    },
    (error) => {
      console.error("Error al escuchar comunicados:", error);
    }
  );
};
