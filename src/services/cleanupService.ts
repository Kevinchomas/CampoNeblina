import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  collectionGroup,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

const COLLECTIONS_TO_CLEAN = [
  "posts",
  "comunicados",
  "publicaciones",
  "eventos",
  "incidencias",
  "chats",
  "comentarios",
  "reportes_publicaciones",
  "reportes_chats",
];

/**
 * Intenta eliminar un archivo de Firebase Storage a partir de su URL.
 */
const borrarArchivoStorageSeguro = async (url?: string) => {
  if (!url || typeof url !== "string") return;
  try {
    // Si es una URL de Firebase Storage, extraer la referencia o usar ref(storage, url)
    if (url.includes("firebasestorage.googleapis.com")) {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    }
  } catch (err) {
    console.log("Aviso: No se pudo eliminar archivo de storage o ya no existe:", err);
  }
};

/**
 * Limpieza automática: elimina documentos con más de 3 días (72 horas) de antigüedad.
 * Excepción estricta: NO toca la colección 'usuarios'.
 */
export const ejecutarLimpiezaAutomatica = async (): Promise<void> => {
  try {
    const ahora = new Date().getTime();
    const TRES_DIAS_MS = 3 * 24 * 60 * 60 * 1000;

    for (const colName of COLLECTIONS_TO_CLEAN) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const fechaStr = data.fechaCreacion || data.fecha || data.creadoEn;
        
        if (fechaStr) {
          const fechaDoc = new Date(fechaStr).getTime();
          if (!isNaN(fechaDoc) && ahora - fechaDoc > TRES_DIAS_MS) {
            // Borrar archivos adjuntos si existen
            if (data.imagenUrl) await borrarArchivoStorageSeguro(data.imagenUrl);
            if (data.fotos && Array.isArray(data.fotos)) {
              for (const foto of data.fotos) {
                await borrarArchivoStorageSeguro(foto);
              }
            }

            // Si es un chat, eliminar mensajes en subcolección
            if (colName === "chats") {
              try {
                const mensajesSnap = await getDocs(collection(db, "chats", docSnap.id, "mensajes"));
                for (const msgDoc of mensajesSnap.docs) {
                  await deleteDoc(msgDoc.ref);
                }
              } catch (e) {
                console.log("Error limpiando mensajes de chat:", e);
              }
            }

            await deleteDoc(docSnap.ref);
          }
        }
      }
    }
    console.log("Limpieza automática de 3 días completada exitosamente.");
  } catch (error) {
    console.error("Error en limpieza automática:", error);
  }
};

/**
 * Botón de Pánico / Limpieza General: Borra absolutamente TODO el contenido de la app
 * de las colecciones especificadas, incluyendo subcolecciones y archivos en Storage.
 * EXCEPCIÓN ESTRICTA: La colección 'usuarios' NUNCA es tocada ni modificada.
 */
export const limpiarTodaLaApp = async (): Promise<void> => {
  try {
    for (const colName of COLLECTIONS_TO_CLEAN) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Borrar archivos adjuntos si existen en Storage
        if (data.imagenUrl) await borrarArchivoStorageSeguro(data.imagenUrl);
        if (data.fotos && Array.isArray(data.fotos)) {
          for (const foto of data.fotos) {
            await borrarArchivoStorageSeguro(foto);
          }
        }

        // Si es la colección 'chats', eliminar su subcolección 'mensajes'
        if (colName === "chats") {
          try {
            const mensajesSnap = await getDocs(collection(db, "chats", docSnap.id, "mensajes"));
            for (const msgDoc of mensajesSnap.docs) {
              await deleteDoc(msgDoc.ref);
            }
          } catch (e) {
            console.log("Error limpiando subcolección mensajes:", e);
          }
        }

        // Eliminar el documento principal
        await deleteDoc(docSnap.ref);
      }
    }

    // Limpiar también subcolecciones de comentarios enrutadas por entidad si quedaran huérfanas
    try {
      const comentariosSnap = await getDocs(collection(db, "comentarios"));
      for (const comDoc of comentariosSnap.docs) {
        await deleteDoc(comDoc.ref);
      }
    } catch (e) {
      console.log("Error limpiando comentarios globales:", e);
    }

    console.log("¡Limpieza general de pánico ejecutada con éxito! (Colección 'usuarios' intacta).");
  } catch (error: any) {
    console.error("Error al ejecutar limpieza general de pánico:", error);
    throw new Error(error.message || "No se pudo completar la limpieza general.");
  }
};
