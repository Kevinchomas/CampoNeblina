# DOCUMENTO DE CONTEXTO Y ESPECIFICACIONES: CAMPO NEBLINA APP

## 1. VISIÓN DEL PROYECTO

Desarrollar una aplicación móvil profesional, intuitiva y segura para la gestión comunal de la urbanización "Campo Neblina" (Torres 7 y 8). La app busca centralizar la comunicación, publicaciones oficiales, avisos de pago de condominio, reportes de incidencias, mercado interno (marketplace) e interacción social supervisada entre residentes.

## 2. ESTRUCTURA INMOBILIARIA Y BASE DE DATOS

- Urbanización: Campo Neblina
- Torres: Torre 7 y Torre 8 (2 Torres en total).
- Distribución por Torre:
  - 15 Pisos por torre.
  - Pisos 1, 2 y 4 al 15: 6 apartamentos por piso.
  - Piso 3 (Excepción): 5 apartamentos por piso (1 menos por torre).
  - Total Inmuebles: 89 apartamentos por torre = 178 apartamentos en total.
  - Código de Inmueble: Formato `[Torre]-[Piso]-[Apto]` (Ejemplo: `8-1-3` representa Torre 8, Piso 1, Apartamento 3).
- Estimación de Cuentas: ~350 a 500 usuarios (Propietarios, Copropietarios e Inquilinos autorizados).

## 3. ROLES Y PERMISOS DE USUARIO (RBAC)

1. SuperAdmin / Junta de Condominio:
   - Control total del sistema.
   - Aprobar, rechazar, suspender o eliminar usuarios.
   - Publicar citaciones, avisos oficiales y alertas de cobro de condominio.
   - Validar comprobantes de pago para actualizar el estado de solvencia ("Al día" / "Pendiente").
   - Moderar contenidos reportados en Marketplace, Muro Comunal y Reclamos.
   - Acceso al buzón de reportes de chats (mensajes marcados por usuarios).

2. Moderador:
   - Auxiliar de la junta. Gestión de publicaciones, marketplace y eventos.

3. Residente (Propietario / Copropietario / Inquilino):
   - Requiere aprobación previa de la Junta para acceder tras el registro.
   - Acceso a Perfil personal con indicador de solvencia de condominio.
   - Visualización de Tablón Oficial, Eventos y Calendario.
   - Participación en Marketplace vecinal, Reclamos/Sugerencias y Chat Comunitario.
   - Configuración de privacidad de perfil.

## 4. MÓDULOS Y FUNCIONALIDADES PRINCIPALES

### A. Autenticación, Registro y Seguridad

- Registro solicitando: Nombre completo, Cédula/DNI, Teléfono, Rol (Propietario/Inquilino), Torre, Piso y Apartamento.
- Estado inicial: `pendiente_aprobacion`. Pide validación por parte del Admin.
- Manejo de sesión persistente, token seguro y cifrado de datos.

### B. Tablón Principal y Solvencia de Condominio

- Encabezado con tarjeta dinámica: Muestra el inmueble asociado (`Torre 8 - Apto 8-3-2`) e insignia de estado (`Al día` en verde / `Pendiente` en rojo).
- Feed de Comunicados Oficiales (Solo lectura para residentes, publicación exclusiva de la Junta).
- Subida de comprobante de pago para cambio automático de solvencia tras aprobación.

### C. Muro Comunitario y Marketplace (Servicios y Productos)

- Publicación de productos/servicios entre vecinos.
- Filtro de moderación automática: Algoritmo previo que escanea groserías, lenguaje ofensivo o spam antes de publicar.
- Opción de "Reportar publicación" directa al panel de Admin.

### D. Chat y Buzón de Incidencias/Reclamos

- Mensajería directa entre residentes.
- Sistema de privacidad: Admins NO espían chats privados arbitrariamente; reciben mensajes únicamente mediante acción de "Reportar Usuario/Mensaje" por acoso o conducta ofensiva.
- Módulo de Reclamos/Sugerencias: Chat directo y privado Residente <-> Junta de Condominio.

### E. Sistema de Eventos y Calendario

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
