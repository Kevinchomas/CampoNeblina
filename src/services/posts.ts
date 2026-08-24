import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "../constants/types";

export interface OpcionEncuesta {
  id: string;
  texto: string;
  votos: string[]; // Array de UIDs de usuarios
}

export interface PostDoc {
  id: string;
  usuarioUid: string;
  nombreUsuario: string;
  fotoPerfil?: string;
  texto: string;
  imagenUrl?: string;
  fechaCreacion: string;
  likes?: string[];
  numComentarios?: number;
  isEncuesta?: boolean;
  fijada?: boolean;
  preguntaEncuesta?: string;
  opcionesEncuesta?: OpcionEncuesta[];
}

/**
 * Crea una publicación social estándar de un residente.
 */
export const crearPost = async (
  user: UserProfile,
  texto: string,
  imagenUrl?: string
): Promise<PostDoc> => {
  if (user.status === "suspendido" || (user as any).puedePublicar === false) {
    throw new Error("No tienes permisos para publicar.");
  }

  if (!texto.trim() && !imagenUrl) {
    throw new Error("Ingresa un mensaje o adjunta una foto para publicar.");
  }

  const nuevoPost = {
    usuarioUid: user.uid,
    nombreUsuario: user.nombreCompleto,
    fotoPerfil: (user as any).fotoPerfil || "",
    texto: texto.trim(),
    imagenUrl: imagenUrl || "",
    fechaCreacion: new Date().toISOString(),
    likes: [],
    numComentarios: 0,
    isEncuesta: false,
    fijada: false,
  };

  const docRef = await addDoc(collection(db, "posts"), nuevoPost);
  return { id: docRef.id, ...nuevoPost };
};

/**
 * Crea una encuesta fijada (Exclusivo Administradores).
 */
export const crearEncuesta = async (
  user: UserProfile,
  pregunta: string,
  opcionesTextos: string[]
): Promise<PostDoc> => {
  if (user.rol !== "superadmin" && user.rol !== "moderador") {
    throw new Error("Solo los administradores pueden crear encuestas.");
  }

  if (!pregunta.trim() || opcionesTextos.length < 2) {
    throw new Error("Ingresa la pregunta y al menos 2 opciones de respuesta.");
  }

  const opciones: OpcionEncuesta[] = opcionesTextos.map((txt, index) => ({
    id: `op_${index}_${Date.now()}`,
    texto: txt.trim(),
    votos: [],
  }));

  const nuevaEncuesta = {
    usuarioUid: user.uid,
    nombreUsuario: `${user.nombreCompleto} (Junta de Condominio)`,
    fotoPerfil: (user as any).fotoPerfil || "",
    texto: pregunta.trim(),
    preguntaEncuesta: pregunta.trim(),
    opcionesEncuesta: opciones,
    fechaCreacion: new Date().toISOString(),
    likes: [],
    numComentarios: 0,
    isEncuesta: true,
    fijada: true,
  };

  const docRef = await addDoc(collection(db, "posts"), nuevaEncuesta);
  return { id: docRef.id, ...nuevaEncuesta };
};

/**
 * Permite a un residente votar en una encuesta (1 solo voto por usuario).
 */
export const votarEncuesta = async (
  postId: string,
  opcionId: string,
  userUid: string
): Promise<void> => {
  const docRef = doc(db, "posts", postId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return;

  const data = docSnap.data() as PostDoc;
  const opcionesActuales = data.opcionesEncuesta || [];

  const opcionesActualizadas = opcionesActuales.map((op) => {
    // Remover voto previo del usuario si existía en otra opción
    const votosLimpios = op.votos.filter((id) => id !== userUid);
    // Si esta es la opción seleccionada, agregar el voto
    if (op.id === opcionId) {
      return { ...op, votos: [...votosLimpios, userUid] };
    }
    return { ...op, votos: votosLimpios };
  });

  await updateDoc(docRef, {
    opcionesEncuesta: opcionesActualizadas,
  });
};

/**
 * Escucha en tiempo real la lista de posts y encuestas.
 */
export const subscribePosts = (
  callback: (lista: PostDoc[]) => void,
  onError?: (error: any) => void
) => {
  const q = query(collection(db, "posts"), orderBy("fechaCreacion", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<PostDoc, "id">),
      }));
      callback(lista);
    },
    (error) => {
      console.error("Error al escuchar posts:", error);
      callback([]);
      if (onError) {
        onError(error);
      }
    }
  );
};

/**
 * Elimina una publicación social o encuesta.
 */
export const eliminarPost = async (postId: string): Promise<void> => {
  await deleteDoc(doc(db, "posts", postId));
};
