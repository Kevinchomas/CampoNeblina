import {
  collection,
  addDoc,
  getDocs,
  getDoc,
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
import { Publicacion, ReportePublicacion, Inmueble, PublicacionTipo, Comentario } from "../constants/types";
import { uploadImageToCloudinary } from "./cloudinary";

const PUBLICACIONES_COLLECTION = "publicaciones";
const REPORTES_COLLECTION = "reportes_publicaciones";

/**
 * Sube una imagen local a Cloudinary y retorna la URL pública de descarga (`secure_url`).
 */
export const subirImagenStorage = async (
  uri: string,
  _fileName?: string
): Promise<string> => {
  if (!uri) return "";
  return await uploadImageToCloudinary(uri);
};

export interface CrearPublicacionData {
  titulo: string;
  descripcion: string;
  precio: number;
  tipo: PublicacionTipo;
  imagenUrl?: string;
  vendedorUid: string;
  vendedorNombre: string;
  vendedorTelefono: string;
  vendedorInmueble: Inmueble;
}

/**
 * Registra una nueva publicación de producto o servicio en el Marketplace.
 */
export const crearPublicacion = async (data: CrearPublicacionData): Promise<Publicacion> => {
  const nuevaPublicacion = {
    titulo: data.titulo.trim(),
    descripcion: data.descripcion.trim(),
    precio: Number(data.precio),
    tipo: data.tipo,
    imagenUrl: data.imagenUrl || "",
    vendedorUid: data.vendedorUid,
    vendedorNombre: data.vendedorNombre,
    vendedorTelefono: data.vendedorTelefono,
    vendedorInmueble: data.vendedorInmueble,
    fechaCreacion: new Date().toISOString(),
    reportada: false,
  };

  const docRef = await addDoc(collection(db, PUBLICACIONES_COLLECTION), nuevaPublicacion);
  return { id: docRef.id, ...nuevaPublicacion };
};

/**
 * Escucha la lista de publicaciones del marketplace en tiempo real.
 */
export const subscribePublicaciones = (callback: (lista: Publicacion[]) => void) => {
  const q = query(collection(db, PUBLICACIONES_COLLECTION), orderBy("fechaCreacion", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Publicacion, "id">),
      }));
      callback(list);
    },
    (error) => console.error("Error al escuchar publicaciones:", error)
  );
};

/**
 * Envía un reporte sobre una publicación inapropiada o fraudulenta.
 */
export const reportarPublicacion = async (
  publicacion: Publicacion,
  reportadorUid: string,
  reportadorNombre: string,
  motivo: string
): Promise<void> => {
  const reporte: Omit<ReportePublicacion, "id"> = {
    publicacionId: publicacion.id,
    publicacionTitulo: publicacion.titulo,
    vendedorNombre: publicacion.vendedorNombre,
    reportadorUid,
    reportadorNombre,
    motivo: motivo.trim(),
    fechaReporte: new Date().toISOString(),
  };

  await addDoc(collection(db, REPORTES_COLLECTION), reporte);

  // Marcar la publicación como reportada
  const pubRef = doc(db, PUBLICACIONES_COLLECTION, publicacion.id);
  await updateDoc(pubRef, { reportada: true });
};

/**
 * Elimina una publicación de Firestore (por el autor o administrador).
 */
export const eliminarPublicacion = async (publicacionId: string): Promise<void> => {
  await deleteDoc(doc(db, PUBLICACIONES_COLLECTION, publicacionId));
};

/**
 * Escucha la lista de reportes activos para el Panel de Moderación.
 */
export const subscribeReportes = (callback: (reportes: ReportePublicacion[]) => void) => {
  const q = query(collection(db, REPORTES_COLLECTION), orderBy("fechaReporte", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ReportePublicacion, "id">),
      }));
      callback(list);
    },
    (error) => console.error("Error al escuchar reportes:", error)
  );
};

/**
 * Desestima un reporte y limpia la marca de la publicación.
 */
export const desestimarReporte = async (reporteId: string, publicacionId: string): Promise<void> => {
  await deleteDoc(doc(db, REPORTES_COLLECTION, reporteId));
  const pubRef = doc(db, PUBLICACIONES_COLLECTION, publicacionId);
  await updateDoc(pubRef, { reportada: false });
};

/**
 * Alterna el 'Me Gusta' (Like) de un usuario en una publicación.
 */
export const toggleLikePublicacion = async (
  publicacionId: string,
  userUid: string,
  yaGusta: boolean
): Promise<void> => {
  const pubRef = doc(db, PUBLICACIONES_COLLECTION, publicacionId);
  await updateDoc(pubRef, {
    likes: yaGusta ? arrayRemove(userUid) : arrayUnion(userUid),
  });
};

/**
 * Agrega un nuevo comentario a una publicación.
 */
export const agregarComentarioPublicacion = async (
  publicacionId: string,
  comentario: Comentario
): Promise<void> => {
  const pubRef = doc(db, PUBLICACIONES_COLLECTION, publicacionId);
  await updateDoc(pubRef, {
    comentarios: arrayUnion(comentario),
  });
};

/**
 * Elimina un comentario de una publicación.
 */
export const eliminarComentarioPublicacion = async (
  publicacionId: string,
  comentarioId: string
): Promise<void> => {
  const pubRef = doc(db, PUBLICACIONES_COLLECTION, publicacionId);
  const snap = await getDoc(pubRef);
  if (snap.exists()) {
    const data = snap.data() as Publicacion;
    const nuevosComentarios = (data.comentarios || []).filter((c) => c.id !== comentarioId);
    await updateDoc(pubRef, { comentarios: nuevosComentarios });
  }
};

