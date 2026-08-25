import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserProfile, ReportePublicacion, Incidencia } from "../constants/types";
import {
  subscribeUsuarios,
  aprobarUsuario,
  suspenderUsuario,
  reactivarUsuario,
} from "../services/admin";
import {
  subscribeReportes,
  desestimarReporte,
  eliminarPublicacion,
} from "../services/marketplace";
import {
  subscribeIncidencias,
  cambiarEstadoIncidencia,
} from "../services/incidencias";
import { limpiarTodaLaApp } from "../services/cleanupService";
import { styles } from "./AdminDashboardScreen.styles";

type AdminTab = "usuarios" | "mercado" | "reclamos";

export const AdminDashboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("usuarios");
  const [loading, setLoading] = useState<boolean>(true);
  const [userSearchQuery, setUserSearchQuery] = useState<string>("");

  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [reportesMercado, setReportesMercado] = useState<ReportePublicacion[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);

  useEffect(() => {
    const unsubUsuarios = subscribeUsuarios((list) => setUsuarios(list));
    const unsubReportes = subscribeReportes((list) => setReportesMercado(list));
    const unsubIncidencias = subscribeIncidencias((list) => setIncidencias(list));

    setLoading(false);

    return () => {
      unsubUsuarios();
      unsubReportes();
      unsubIncidencias();
    };
  }, []);

  const handleAprobarUser = async (uid: string) => {
    try {
      await aprobarUsuario(uid);
      Alert.alert("Éxito", "Usuario aprobado.");
    } catch (err: any) {
      Alert.alert("Error", "No se pudo aprobar al usuario.");
    }
  };

  const handleSuspenderUser = async (uid: string) => {
    try {
      await suspenderUsuario(uid, "Suspensión administrativa por la Junta.");
      Alert.alert("Éxito", "Usuario suspendido.");
    } catch (err: any) {
      Alert.alert("Error", "No se pudo suspender al usuario.");
    }
  };

  const handleReactivarUser = async (uid: string) => {
    try {
      await reactivarUsuario(uid);
      Alert.alert("Éxito", "Usuario reactivado.");
    } catch (err: any) {
      Alert.alert("Error", "No se pudo reactivar al usuario.");
    }
  };

  const handleEliminarPublicacion = async (reporte: ReportePublicacion) => {
    try {
      await eliminarPublicacion(reporte.publicacionId);
      await desestimarReporte(reporte.id, reporte.publicacionId);
      Alert.alert("Éxito", "Publicación eliminada.");
    } catch (err: any) {
      Alert.alert("Error", "No se pudo eliminar la publicación.");
    }
  };

  const handleCambiarEstadoIncidencia = async (id: string, nuevoEstado: any) => {
    try {
      await cambiarEstadoIncidencia(id, nuevoEstado);
      Alert.alert("Éxito", "Estatus de reclamo actualizado.");
    } catch (err: any) {
      Alert.alert("Error", "No se pudo actualizar el estatus.");
    }
  };

  const handlePanicCleanup = () => {
    Alert.alert(
      "⚠️ Zona de Peligro - Limpieza General",
      "¿Estás seguro de eliminar todo el contenido de la app? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Limpiar Todo",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "⚠️ Confirmación Final",
              "¿Confirmas que deseas purgar todo el contenido multimedia y registros de las colecciones (posts, comunicados, publicaciones, eventos, incidencias, chats, comentarios)? Los usuarios registrados se mantendrán intactos.",
              [
                { text: "Abortar", style: "cancel" },
                {
                  text: "EJECUTAR LIMPIEZA",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      setLoading(true);
                      await limpiarTodaLaApp();
                      Alert.alert("Éxito", "La limpieza general de la aplicación se ha completado correctamente.");
                    } catch (error: any) {
                      Alert.alert("Error", error.message || "No se pudo completar la limpieza general.");
                    } finally {
                      setLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.nombreCompleto}</Text>
      <Text style={styles.cardSubtitle}>
        Torre {item.inmueble?.torre} - Apto {item.inmueble?.codigo} | DNI: {item.cedulaDni}
      </Text>
      <Text style={styles.cardSubtitle}>
        Estado: {item.status.toUpperCase()}
      </Text>

      <View style={styles.actionRow}>
        {item.status === "pendiente_aprobacion" && (
          <TouchableOpacity style={styles.btnApprove} onPress={() => handleAprobarUser(item.uid)}>
            <Text style={styles.btnText}>Aprobar</Text>
          </TouchableOpacity>
        )}
        {item.status === "activo" && (
          <TouchableOpacity style={styles.btnSuspend} onPress={() => handleSuspenderUser(item.uid)}>
            <Text style={styles.btnText}>Suspender</Text>
          </TouchableOpacity>
        )}
        {item.status === "suspendido" && (
          <TouchableOpacity style={styles.btnApprove} onPress={() => handleReactivarUser(item.uid)}>
            <Text style={styles.btnText}>Reactivar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderMercadoItem = ({ item }: { item: ReportePublicacion }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>"{item.publicacionTitulo}"</Text>
      <Text style={styles.cardSubtitle}>Reportado por: {item.reportadorNombre}</Text>
      <Text style={styles.cardSubtitle}>Motivo: {item.motivo}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.btnSuspend} onPress={() => handleEliminarPublicacion(item)}>
          <Text style={styles.btnText}>Eliminar Publicación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderIncidenciaItem = ({ item }: { item: Incidencia }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.cardSubtitle}>
        Vecino: {item.usuarioNombre} | Categoría: {item.categoria.toUpperCase()}
      </Text>
      <Text style={styles.cardSubtitle}>Estado: {item.estado.toUpperCase()}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.btnApprove}
          onPress={() => handleCambiarEstadoIncidencia(item.id, "en_proceso")}
        >
          <Text style={styles.btnText}>En Proceso</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnApprove, { backgroundColor: "#5CA838" }]}
          onPress={() => handleCambiarEstadoIncidencia(item.id, "resuelto")}
        >
          <Text style={styles.btnText}>Resuelto</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Control Administrativo</Text>
        <Text style={styles.subtitle}>Junta Directiva & Moderación Comunal</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {[
          { id: "usuarios", label: `Usuarios (${usuarios.length})` },
          { id: "mercado", label: `Moderación Mercado (${reportesMercado.length})` },
          { id: "reclamos", label: `Reclamos (${incidencias.length})` },
        ].map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabPill, activeTab === t.id && styles.tabPillActive]}
            onPress={() => setActiveTab(t.id as AdminTab)}
          >
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#EF4444",
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onPress={handlePanicCleanup}
        >
          <Ionicons name="warning-outline" size={18} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 13 }}>
            Limpieza General / Botón de Pánico
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#234919" style={{ marginTop: 40 }} />
      ) : activeTab === "usuarios" ? (
        <>
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 8, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: "#E2E8F0" }}>
              <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 13, color: "#0F172A" }}
                placeholder="Buscar por nombre, correo o inmueble..."
                placeholderTextColor="#94A3B8"
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
              />
              {!!userSearchQuery && (
                <TouchableOpacity onPress={() => setUserSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <FlatList
            data={usuarios.filter((u) => {
              const q = userSearchQuery.toLowerCase();
              const nombre = (u.nombreCompleto || "").toLowerCase();
              const email = (u.email || "").toLowerCase();
              const codigoApto = (u.inmueble?.codigo || "").toLowerCase();
              const torre = String(u.inmueble?.torre || "").toLowerCase();
              return nombre.includes(q) || email.includes(q) || codigoApto.includes(q) || torre.includes(q);
            })}
            keyExtractor={(i) => i.uid}
            renderItem={renderUserItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Sin usuarios registrados o coincidentes</Text>
              </View>
            }
          />
        </>
      ) : activeTab === "mercado" ? (
        <FlatList
          data={reportesMercado}
          keyExtractor={(i) => i.id}
          renderItem={renderMercadoItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="shield-checkmark-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Sin reportes de mercado</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={incidencias}
          keyExtractor={(i) => i.id}
          renderItem={renderIncidenciaItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="folder-open-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Sin reclamos registrados</Text>
            </View>
          }
        />
      )}
    </View>
  );
};