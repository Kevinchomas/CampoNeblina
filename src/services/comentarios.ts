import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "../constants/types";

export interface ComentarioDoc {
  id: string;
  entidadId: string;
  entidadTipo: "publicaciones" | "eventos" | "incidencias" | "posts";
  usuarioUid: string;
  nombreUsuario: string;
  fotoPerfil?: string;
  texto: string;
  fechaCreacion: string; // ISO string
}

/**
 * Crea un comentario en Firestore e incrementa el contador en la entidad objetivo.
 */
export const crearComentario = async (
  entidadId: string,
  entidadTipo: "publicaciones" | "eventos" | "incidencias" | "posts",
  user: UserProfile,
  texto: string
): Promise<void> => {
  if (user.status === "suspendido" || (user as any).puedeComentar === false) {
    throw new Error("No tienes permisos para comentar.");
  }

  if (!texto.trim()) {
    throw new Error("El texto del comentario no puede estar vacío.");
  }

  const nuevoComentario = {
    entidadId,
    entidadTipo,
    usuarioUid: user.uid,
    nombreUsuario: user.nombreCompleto,
    fotoPerfil: (user as any).fotoPerfil || "",
    texto: texto.trim(),
    fechaCreacion: new Date().toISOString(),
  };

  await addDoc(collection(db, "comentarios"), nuevoComentario);

  try {
    const docRef = doc(db, entidadTipo, entidadId);
    await updateDoc(docRef, {
      numComentarios: increment(1),
    });
  } catch (e) {
    console.log("Aviso al incrementar contador de comentarios:", e);
  }
};

/**
 * Escucha comentarios en tiempo real para una entidad.
 */
export const subscribeComentarios = (
  entidadId: string,
  callback: (lista: ComentarioDoc[]) => void
) => {
  const q = query(
    collection(db, "comentarios"),
    where("entidadId", "==", entidadId),
    orderBy("fechaCreacion", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const lista = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ComentarioDoc, "id">),
      }));
      callback(lista);
    },
    (error) => console.error("Error al escuchar comentarios:", error)
  );
};

/**
 * Elimina un comentario y decrementa el contador en la entidad.
 */
export const eliminarComentario = async (
  comentarioId: string,
  entidadId: string,
  entidadTipo: "publicaciones" | "eventos" | "incidencias" | "posts"
): Promise<void> => {
  await deleteDoc(doc(db, "comentarios", comentarioId));

  try {
    const docRef = doc(db, entidadTipo, entidadId);
    await updateDoc(docRef, {
      numComentarios: increment(-1),
    });
  } catch (e) {
    console.log("Aviso al decrementar contador de comentarios:", e);
  }
};

/**
 * Alterna el 'Me Gusta' de un usuario en cualquier entidad.
 */
export const toggleLikeEntidad = async (
  entidadId: string,
  entidadTipo: "publicaciones" | "eventos" | "incidencias" | "posts",
  userUid: string,
  actualLikes: string[] = []
): Promise<void> => {
  const yaDioLike = actualLikes.includes(userUid);
  const docRef = doc(db, entidadTipo, entidadId);

  await updateDoc(docRef, {
    likes: yaDioLike ? arrayRemove(userUid) : arrayUnion(userUid),
  });
};
