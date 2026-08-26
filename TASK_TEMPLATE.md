# [ID-TAREA]: Nombre Corto de la Funcionalidad

## 1. Contexto y Requisitos
- **Objetivo Principal:** ¿Qué problema resuelve o qué vista/función añade?
- **Reglas de Negocio Implicadas:** Lógica de la app a respetar (ej. roles de usuario, estructura de 16 niveles/PB, solvencia).

## 2. Impacto de Código y Archivos
- **Tipos / Constantes:** `src/constants/types.ts`, `inmuebles.ts`
- **Servicios:** `src/services/...`
- **Componentes / UI:** `src/components/...`, `src/screens/...`

## 3. Plan de Implementación
- [ ] Paso 1: Modificar o crear interfaces de TypeScript.
- [ ] Paso 2: Implementar la lógica de negocio/Firebase en la capa de servicios.
- [ ] Paso 3: Construir la UI conectando estados locales y aplicando `theme.ts`.
- [ ] Paso 4: Verificar rendimiento (prevenir re-renders en listas o pérdida de foco).

## 4. Criterios de Aceptación
- [ ] Compilación limpia con `npx tsc --noEmit` (0 errores).
- [ ] Comprobación visual y funcional correcta.
- [ ] Indexación incremental de los cambios en la memoria MCP.
