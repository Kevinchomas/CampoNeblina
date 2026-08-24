import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./firebase";
import { Incidencia, IncidenciaCategoria, IncidenciaEstado, Inmueble, UserProfile } from "../constants/types";

const INCIDENCIAS_COLLECTION = "incidencias";

export interface CrearIncidenciaData {
  titulo: string;
  descripcion: string;
  categoria: IncidenciaCategoria;
  usuarioUid: string;
  usuarioNombre: string;
  usuarioInmueble: Inmueble;
}

/**
 * Registra una nueva incidencia o reclamo dirigido a la Junta de Condominio.
 */
export const crearIncidencia = async (data: CrearIncidenciaData): Promise<Incidencia> => {
  const nuevaIncidencia = {
    titulo: data.titulo.trim(),
    descripcion: data.descripcion.trim(),
    categoria: data.categoria,
    estado: "pendiente" as IncidenciaEstado,
    usuarioUid: data.usuarioUid,
    usuarioNombre: data.usuarioNombre,
    usuarioInmueble: data.usuarioInmueble,
    fechaCreacion: new Date().toISOString(),
    respuestaJunta: "",
  };

  const docRef = await addDoc(collection(db, INCIDENCIAS_COLLECTION), nuevaIncidencia);
  return { id: docRef.id, ...nuevaIncidencia };
};

/**
 * Escucha la lista de incidencias en tiempo real adaptando la consulta a las reglas de Firestore:
 * - Para residente normal: query filtrada por usuarioUid == user.uid
 * - Para admin/moderador: query completa sobre la colección
 */
export const subscribeIncidencias = (callback: (lista: Incidencia[]) => void) => {
  let unsubscribeSnapshot: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }

    if (!user) {
      console.log("Usuario no autenticado aun");
      callback([]);
      return;
    }

    try {
      // Obtener el perfil para consultar el rol del usuario
      const userDocRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.exists() ? (userSnap.data() as UserProfile) : null;
      const isAdmin = userData?.rol === "superadmin" || userData?.rol === "moderador";

      const q = isAdmin
        ? query(collection(db, INCIDENCIAS_COLLECTION))
        : query(collection(db, INCIDENCIAS_COLLECTION), where("usuarioUid", "==", user.uid));

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Incidencia, "id">),
          }));
          list.sort(
            (a, b) =>
              new Date(b.fechaCreacion || 0).getTime() -
              new Date(a.fechaCreacion || 0).getTime()
          );
          callback(list);
        },
        (error) => console.error("Error al escuchar incidencias:", error)
      );
    } catch (err) {
      console.error("Error al configurar suscripción de incidencias:", err);
      callback([]);
    }
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
};

/**
 * Actualiza el estado y respuesta opcional de una incidencia por parte de la Junta.
 */
export const cambiarEstadoIncidencia = async (
  incidenciaId: string,
  nuevoEstado: IncidenciaEstado,
  respuestaJunta?: string
): Promise<void> => {
  const docRef = doc(db, INCIDENCIAS_COLLECTION, incidenciaId);
  await updateDoc(docRef, {
    estado: nuevoEstado,
    ...(respuestaJunta !== undefined && { respuestaJunta: respuestaJunta.trim() }),
  });
};


