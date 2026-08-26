# TASK-001: Gestión de Áreas Seguras (Safe Areas) en Toda la Aplicación

## 1. Contexto y Requisitos
- **Objetivo Principal:** Resolver las colisiones críticas de la interfaz de usuario (UI) con el Sistema Operativo (Android/iOS) tanto en la parte superior (barra de estado, notches y cabeceras de pantallas) como en la parte inferior (menú de navegación inferior que colisiona con la barra de gestos de iOS/Android y los botones de navegación tradicionales de Android).
- **Reglas de Negocio Implicadas:** 
  - Respetar el tema de la aplicación (`src/constants/theme.ts`).
  - Utilizar `react-native-safe-area-context` (`SafeAreaProvider`, `useSafeAreaInsets`, `SafeAreaView`) ya presente en las dependencias.
  - Asegurar que todas las pantallas principales y modales manejen adecuadamente los insets superior, inferior, izquierdo y derecho sin dejar contenido oculto u obsoleto debajo de los system bars.

## 2. Impacto de Código y Archivos
- **Navegación / Proveedor Global:** `src/navigation/AppNavigator.tsx` (envolver la app en `SafeAreaProvider`).
- **Navegación Inferior (Tabs):** `src/navigation/MainTabNavigator.tsx` (ajustar el `tabBarStyle` dinámicamente con `useSafeAreaInsets` o `safeAreaInsets` para evitar solapamientos con la barra de gestos inferior).
- **Pantallas Principales y Cabeceras:** 
  - `src/screens/HomeScreen.tsx` y componentes como `src/components/FeedHeader.tsx`.
  - Otras pantallas principales (`MarketplaceScreen.tsx`, `EventsScreen.tsx`, `IncidenciasScreen.tsx`, `ProfileScreen.tsx`, `AdminDashboardScreen.tsx`, etc.) que requieran espaciado superior o envoltorios limpios.

## 3. Plan de Implementación
- [ ] Paso 1: Envolver la raíz de la navegación en `src/navigation/AppNavigator.tsx` con `SafeAreaProvider` de `react-native-safe-area-context`.
- [ ] Paso 2: Actualizar `src/navigation/MainTabNavigator.tsx` para calcular la altura del tab bar y el padding inferior utilizando `useSafeAreaInsets()`, asegurando que la barra flotante o barra inferior de navegación no colisione con los botones físicos o la barra de gestos de Android/iOS.
- [ ] Paso 3: Revisar el contenedor principal de cada pantalla clave (`HomeScreen`, `MarketplaceScreen`, `EventsScreen`, `IncidenciasScreen`, `ProfileScreen`) para asegurar que aplican paddingTop/paddingBottom o usan `SafeAreaView` / `useSafeAreaInsets` evitando solapamientos con la barra de estado superior.
- [ ] Paso 4: Validar compilación con `npx tsc --noEmit` y comprobar la ausencia de errores.

## 4. Criterios de Aceptación
- [ ] Compilación limpia con `npx tsc --noEmit` (0 errores).
- [ ] El menú de navegación inferior no choca con los botones virtuales de Android ni con la barra de gestos inferior.
- [ ] La barra superior / headers de las pantallas no se superponen al notch ni a la barra de estado superior.
- [ ] Indexación incremental de los cambios en la memoria MCP.
