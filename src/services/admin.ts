import {
  collection,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "../constants/types";

const USUARIOS_COLLECTION = "usuarios";

/**
 * Obtiene la lista completa de usuarios/residentes registrados.
 */
export const getUsuarios = async (): Promise<UserProfile[]> => {
  const querySnapshot = await getDocs(collection(db, USUARIOS_COLLECTION));
  return querySnapshot.docs.map((doc) => doc.data() as UserProfile);
};

/**
 * Suscribe a cambios en tiempo real de todos los usuarios.
 */
export const subscribeUsuarios = (
  callback: (usuarios: UserProfile[]) => void
) => {
  return onSnapshot(
    collection(db, USUARIOS_COLLECTION),
    (snapshot) => {
      const list = snapshot.docs.map((doc) => doc.data() as UserProfile);
      callback(list);
    },
    (error) => {
      console.error("Error al escuchar usuarios:", error);
    }
  );
};

/**
 * Aprueba el registro de un usuario cambiando su estado a 'activo'.
 */
export const aprobarUsuario = async (uid: string): Promise<void> => {
  const userRef = doc(db, USUARIOS_COLLECTION, uid);
  await updateDoc(userRef, {
    status: "activo",
    solvencia: "al_dia",
    motivoSuspension: "",
  });
};

/**
 * Suspende la cuenta de un usuario con un motivo específico.
 */
export const suspenderUsuario = async (
  uid: string,
  motivo: string
): Promise<void> => {
  const userRef = doc(db, USUARIOS_COLLECTION, uid);
  await updateDoc(userRef, {
    status: "suspendido",
    solvencia: "pendiente",
    motivoSuspension: motivo.trim() || "Suspensión administrativa por la Junta.",
  });
};

/**
 * Reactiva un usuario previamente suspendido.
 */
export const reactivarUsuario = async (uid: string): Promise<void> => {
  const userRef = doc(db, USUARIOS_COLLECTION, uid);
  await updateDoc(userRef, {
    status: "activo",
    solvencia: "al_dia",
    motivoSuspension: "",
  });
};
