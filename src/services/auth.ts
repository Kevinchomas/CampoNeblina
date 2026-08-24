import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile, Inmueble, UserRole, TipoResidente } from "../constants/types";

// Datos requeridos para registrar un nuevo usuario
export interface SignUpData {
  email: string;
  password: string;
  nombreCompleto: string;
  cedulaDni: string;
  telefono: string;
  rol: UserRole;
  tipoResidente?: TipoResidente;
  inmueble: Inmueble;
}

/**
 * Registra un nuevo residente/usuario en Firebase Auth y crea su documento de perfil en Firestore.
 * El estado inicial del usuario es obligatoriamente 'pendiente_aprobacion' y solvencia 'pendiente'.
 */
export const signUp = async (data: SignUpData): Promise<UserProfile> => {
  const { email, password, nombreCompleto, cedulaDni, telefono, rol, tipoResidente, inmueble } = data;

  // 1. Crear el usuario en Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // 2. Preparar el perfil de usuario con los estados por defecto de la Fase 1
  const userProfile: UserProfile = {
    uid,
    email: email.trim().toLowerCase(),
    nombreCompleto: nombreCompleto.trim(),
    cedulaDni: cedulaDni.trim(),
    telefono: telefono.trim(),
    rol: rol || "residente",
    tipoResidente: tipoResidente || (rol === "propietario" || rol === "inquilino" ? rol : "propietario"),
    status: "pendiente_aprobacion", // Todo nuevo usuario inicia pendiente de aprobación por el Administrador
    inmueble,
    solvencia: "pendiente", // Inicia con estado pendiente hasta validación de pagos
    fechaRegistro: new Date().toISOString(),
  };

  // 3. Escribir el documento en Firestore
  await setDoc(doc(db, "usuarios", uid), userProfile);

  return userProfile;
};

/**
 * Inicia sesión de un usuario con correo y contraseña.
 * Devuelve el perfil completo del usuario desde Firestore si se autentica correctamente.
 */
export const signIn = async (email: string, password: string): Promise<UserProfile> => {
  // 1. Autenticar con Firebase Authentication
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // 2. Obtener el perfil asociado en Firestore
  const profile = await getUserProfile(uid);
  if (!profile) {
    throw new Error("No se pudo recuperar el perfil del usuario de la base de datos.");
  }

  return profile;
};

/**
 * Cierra la sesión activa en el dispositivo.
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * Recupera el perfil de Firestore de un usuario utilizando su ID de autenticación (uid).
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "usuarios", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

