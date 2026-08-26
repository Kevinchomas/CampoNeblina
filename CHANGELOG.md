# Registro de Cambios (Changelog) - Campo Neblina App

## [1.1.0] - 2026-08-25
### Corregido
- **TASK-001:** Implementada la gestión global de Áreas Seguras (Safe Areas) en toda la aplicación mediante `SafeAreaProvider` en la raíz (`AppNavigator.tsx`), cálculo dinámico de `tabBarStyle` con `useSafeAreaInsets` en `MainTabNavigator.tsx` para evitar colisiones con la barra de gestos de iOS/Android y los botones de navegación tradicionales de Android, y alineación correcta de los headers y pantallas.

