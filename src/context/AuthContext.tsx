import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { UserProfile } from "../constants/types";
import { signIn, signUp, signOut, SignUpData } from "../services/auth";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (data: SignUpData) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    // Escucha en tiempo real los cambios de estado de autenticación de Firebase
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      // Si existía una suscripción a un documento previo, la cancelamos
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (firebaseUser) {
        // Suscripción en tiempo real al perfil en Firestore para reaccionar inmediatamente
        // a cambios de estado (aprobado/activo/suspendido) o solvencia sin obligar al usuario a re-logearse.
        const userDocRef = doc(db, "usuarios", firebaseUser.uid);
        unsubscribeDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as UserProfile);
            } else {
              console.warn("Documento de usuario no encontrado en Firestore");
              setUser(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error escuchando cambios de perfil del usuario:", error);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Limpieza de suscripciones al desmontar el componente
    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await signIn(email, password);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (data: SignUpData): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await signUp(data);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
