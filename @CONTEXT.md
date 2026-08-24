# DOCUMENTO DE CONTEXTO Y ESPECIFICACIONES: CAMPO NEBLINA APP

## 1. VISIÓN DEL PROYECTO
Desarrollar una aplicación móvil profesional, intuitiva y segura para la gestión comunal de la urbanización "Campo Neblina" (Torres 7 y 8). La app busca centralizar la comunicación, publicaciones oficiales, avisos de pago de condominio, reportes de incidencias, mercado interno (marketplace) e interacción social supervisada entre residentes.

## 2. ESTRUCTURA INMOBILIARIA Y BASE DE DATOS
* Urbanización: Campo Neblina
* Torres: Torre 7 y Torre 8 (2 Torres en total).
* Distribución por Torre:
  - 15 Pisos por torre.
  - Pisos 1, 2 y 4 al 15: 6 apartamentos por piso.
  - Piso 3 (Excepción): 5 apartamentos por piso (1 menos por torre).
  - Total Inmuebles: 89 apartamentos por torre = 178 apartamentos en total.
  - Código de Inmueble: Formato `[Torre]-[Piso]-[Apto]` (Ejemplo: `8-1-3` representa Torre 8, Piso 1, Apartamento 3).
* Estimación de Cuentas: ~350 a 500 usuarios (Propietarios, Copropietarios e Inquilinos autorizados).

## 3. ROLES Y PERMISOS DE USUARIO (RBAC)
1. SuperAdmin / Junta de Condominio:
   - Control total del sistema.
   - Panel de Gestión de Usuarios para Aprobar, Suspender (especificando motivo) o Reactivar usuarios con buscador en tiempo real.
   - Manejo simplificado del estado del usuario ('activo' | 'suspendido') y envío de Alertas de Pago/Cobro informativas.
   - Publicar citaciones y avisos oficiales.
   - Moderar contenidos reportados en Marketplace, Muro Comunal y Reclamos.
   - Acceso al buzón de reportes de chats (mensajes marcados por usuarios).

2. Moderador:
   - Auxiliar de la junta. Gestión de publicaciones, marketplace y eventos.

3. Residente (Propietario / Copropietario / Inquilino):
   - Requiere aprobación previa de la Junta para acceder tras el registro.
   - Acceso a Perfil personal con indicador de estado/solvencia de condominio.
   - Si la cuenta es suspendida, redirección automática a la 'Pantalla de Cuenta Suspendida' (que muestra el motivo fijado por la Junta).
   - Visualización de Tablón Oficial, Eventos y Calendario.
   - Participación en Marketplace vecinal, Reclamos/Sugerencias y Chat Comunitario.
   - Configuración de privacidad de perfil.

## 4. MÓDULOS Y FUNCIONALIDADES PRINCIPALES

### A. Autenticación, Registro y Seguridad
- Registro solicitando: Nombre completo, Cédula/DNI, Teléfono, Rol (Propietario/Inquilino), Torre, Piso y Apartamento.
- Estado inicial: `pendiente_aprobacion`. Requiere validación por parte del Admin.
- Manejo de sesión persistente, token seguro y cifrado de datos.
- Pantalla de Cuenta Suspendida: Si el usuario está en estado `suspendido`, la app restringe el acceso al sistema y muestra en pantalla la información del inmueble y el motivo específico de la suspensión fijado por el Administrador, junto a un botón para Cerrar Sesión.

### B. Tablón Principal y Gestión Simplificada de Solvencia
- Encabezado con tarjeta dinámica: Muestra el inmueble asociado (`Torre 8 - Apto 8-3-2`) e insignia de estado (`Al día / Activo` en verde / `Suspendido` en rojo).
- Feed de Comunicados Oficiales y Alertas de Pago/Cobro informativas (publicadas exclusivamente por la Junta de Condominio).
- Sin comprobantes manuales: Se elimina el módulo de subida y validación manual de comprobantes de pago. La solvencia/estado del residente es administrada de forma directa mediante la gestión de estado de cuenta ('activo' | 'suspendido').

### C. Panel de Gestión de Usuarios (Admin)
- Control de Residentes en tiempo real con buscador dinámico por **Nombre**, **Cédula** o **Apartamento / Código de Inmueble**.
- Acciones rápidas para el Administrador:
  - Aprobar solicitudes pendientes.
  - Suspender usuarios indicando un motivo de suspensión.
  - Reactivar usuarios suspendidos de forma inmediata.

### D. Muro Comunitario y Marketplace (Servicios y Productos)
- Publicación de productos/servicios entre vecinos.
- Filtro de moderación automática: Algoritmo previo que escanea groserías, lenguaje ofensivo o spam antes de publicar.
- Opción de "Reportar publicación" directa al panel de Admin.

### E. Chat y Buzón de Incidencias/Reclamos
- Mensajería directa entre residentes.
- Sistema de privacidad: Admins NO espían chats privados arbitrariamente; reciben mensajes únicamente mediante acción de "Reportar Usuario/Mensaje" por acoso o conducta ofensiva.
- Módulo de Reclamos/Sugerencias: Chat directo y privado Residente <-> Junta de Condominio.

### F. Sistema de Eventos y Calendario
- Cartelera digital con citaciones a asambleas, cortes programados de agua/luz, jornadas de mantenimiento.

## 5. DISEÑO Y SISTEMA DE TEMAS (DESIGN SYSTEM)
- Identidad basada en el logotipo oficial de Campo Neblina.
- Colores Primarios: Verde Bambú (`#5CA838`), Verde Botella Oscuro (`#234919`).
- Colores Neutros: Negro (`#1A1D1A`), Blanco (`#FFFFFF`), Gris Claro (`#F5F8F4`).
- Soporte completo y nativo para Modo Claro (Light Mode) y Modo Oscuro (Dark Mode).
- UI/UX limpia, moderna, responsiva, con tarjetas bordeadas, fácil legibilidad y estética profesional tipo red social premium.

## 6. STACK TÉCNICO Y ARQUITECTURA
- Frontend: React Native con Expo (TypeScript) para generación de APKs e builds de prueba.
- Backend / Base de Datos: Firebase (Firestore, Auth, Storage) en plan gratuito continuo Spark (sin pausado de servidor).
- Arquitectura de Código: Limpia, modular y desacoplada (`src/components`, `src/screens`, `src/services`, `src/context`, `src/constants`).

