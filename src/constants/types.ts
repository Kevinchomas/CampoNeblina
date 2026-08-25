export type UserRole = "superadmin" | "moderador" | "residente" | "propietario" | "inquilino";

export type TipoResidente = "propietario" | "inquilino";

export type UserStatus = "pendiente_aprobacion" | "activo" | "suspendido";

export type SolvenciaStatus = "al_dia" | "pendiente";

export interface Inmueble {
  torre: 7 | 8;
  piso: number;
  apartamento: number;
  codigo: string; // Formato "[Torre]-[Piso]-[Apto]" (Ejemplo: "8-1-3")
}

export interface UserProfile {
  uid: string;
  email: string;
  nombreCompleto: string;
  cedulaDni: string;
  telefono: string;
  rol: UserRole;
  tipoResidente?: TipoResidente;
  status: UserStatus;
  motivoSuspension?: string;
  inmueble: Inmueble;
  solvencia: SolvenciaStatus;
  fechaRegistro: string; // ISO string
  createdAt?: any; // Firestore timestamp fallback
}

export interface Comentario {
  id: string;
  uid: string;
  nombre: string;
  texto: string;
  fecha: string;
}

export type ComunicadoTipo = "comunicado" | "alerta_pago";

export interface Comunicado {
  id: string;
  titulo: string;
  contenido: string;
  tipo: ComunicadoTipo;
  autor: string;
  fecha: string; // ISO string
  prioridad?: "alta" | "normal";
  likes?: string[];
  comentarios?: Comentario[];
}

export type PublicacionTipo = "producto" | "servicio" | "post";

export interface Publicacion {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  tipo: PublicacionTipo;
  imagenUrl?: string;
  vendedorUid: string;
  vendedorNombre: string;
  vendedorTelefono: string;
  vendedorInmueble: Inmueble;
  fechaCreacion: string; // ISO string
  reportada?: boolean;
  likes?: string[];
  comentarios?: Comentario[];
}

export interface ReportePublicacion {
  id: string;
  publicacionId: string;
  publicacionTitulo: string;
  vendedorNombre: string;
  reportadorUid: string;
  reportadorNombre: string;
  motivo: string;
  fechaReporte: string; // ISO string
}

export interface MensajeChat {
  id: string;
  chatId: string;
  remitenteUid: string;
  remitenteNombre: string;
  destinatarioUid: string;
  texto: string;
  fecha: string; // ISO string
  leido?: boolean;
}

export interface ChatConversacion {
  id: string; // chatId
  participantes: string[]; // [uid1, uid2]
  noLeidos: { [uid: string]: number }; // Mapa de no leídos por UID
  ultimoMensaje: string;
  fechaUltimoMensaje: string; // ISO string
}

export interface ReporteChat {
  id: string;
  chatId: string;
  mensajeId: string;
  mensajeTexto: string;
  remitenteUid: string;
  remitenteNombre: string;
  reportadorUid: string;
  reportadorNombre: string;
  motivo: string;
  fechaReporte: string; // ISO string
}

export type IncidenciaCategoria =
  | "agua"
  | "electricidad"
  | "ascensores"
  | "ruido"
  | "mantenimiento"
  | "otro";

export type IncidenciaEstado = "pendiente" | "en_proceso" | "resuelto";

export interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: IncidenciaCategoria;
  estado: IncidenciaEstado;
  usuarioUid: string;
  usuarioNombre: string;
  usuarioInmueble: Inmueble;
  fechaCreacion: string; // ISO string
  respuestaJunta?: string;
}


export type EventoCategoria = "asamblea" | "corte_programado" | "mantenimiento" | "social";

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: EventoCategoria;
  fecha: string;
  hora: string;
  ubicacion: string;
  creadorUid: string;
  creadorNombre: string;
  fechaCreacion: string;
  asistentes?: string[];
  imagenUrl?: string;
  editado?: boolean;
  fechaActualizacion?: string;
  notaActualizacion?: string;
}




