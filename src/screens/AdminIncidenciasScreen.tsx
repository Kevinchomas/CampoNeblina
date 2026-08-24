import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Incidencia, IncidenciaEstado } from "../constants/types";
import {
  subscribeIncidencias,
  cambiarEstadoIncidencia,
} from "../services/incidencias";
import { styles } from "./AdminIncidenciasScreen.styles";

export const AdminIncidenciasScreen: React.FC = () => {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<"todos" | IncidenciaEstado>("todos");

  const [selectedIncidencia, setSelectedIncidencia] = useState<Incidencia | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<IncidenciaEstado>("en_proceso");
  const [respuestaText, setRespuestaText] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeIncidencias((lista) => {
      setIncidencias(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenManage = (item: Incidencia) => {
    setSelectedIncidencia(item);
    setNuevoEstado(item.estado);
    setRespuestaText(item.respuestaJunta || "");
  };

  const handleConfirmChange = async () => {
    if (!selectedIncidencia) return;

    setActionLoading(true);
    try {
      await cambiarEstadoIncidencia(
        selectedIncidencia.id,
        nuevoEstado,
        respuestaText
      );
      Alert.alert("Estatus Actualizado", "El reclamo ha sido actualizado correctamente.");
      setSelectedIncidencia(null);
    } catch (error: any) {
      Alert.alert("Error", "No se pudo actualizar el estatus.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredIncidencias = incidencias.filter((i) => {
    return statusFilter === "todos" || i.estado === statusFilter;
  });

  const renderItem = ({ item }: { item: Incidencia }) => {
    const isPendiente = item.estado === "pendiente";
    const isEnProceso = item.estado === "en_proceso";
    const isResuelto = item.estado === "resuelto";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.titulo}</Text>
          <View style={[styles.statusBadge, isPendiente && styles.bgYellow, isEnProceso && styles.bgBlue, isResuelto && styles.bgGreen]}>
            <Text style={[styles.statusText, isPendiente && styles.textYellow, isEnProceso && styles.textBlue, isResuelto && styles.textGreen]}>
              {isPendiente ? "Pendiente" : isEnProceso ? "En Proceso" : "Resuelto"}
            </Text>
          </View>
        </View>

        <Text style={styles.userText}>
          Reportado por: <Text style={styles.bold}>{item.usuarioNombre}</Text> (Torre {item.usuarioInmueble?.torre} - Apto {item.usuarioInmueble?.codigo})
        </Text>

        <Text style={styles.catTag}>Categoría: {item.categoria.toUpperCase()}</Text>
        <Text style={styles.cardDesc}>{item.descripcion}</Text>

        {item.respuestaJunta ? (
          <View style={styles.respuestaBox}>
            <Text style={styles.respuestaTitle}>Respuesta Junta:</Text>
            <Text style={styles.respuestaText}>{item.respuestaJunta}</Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <Text style={styles.dateText}>
            {item.fechaCreacion ? new Date(item.fechaCreacion).toLocaleDateString() : ""}
          </Text>
          <TouchableOpacity style={styles.manageBtn} onPress={() => handleOpenManage(item)}>
            <Text style={styles.manageBtnText}>⚙️ Gestionar Estatus</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bandeja de Reclamos Junta</Text>
        <Text style={styles.subtitle}>Gestión de incidencias reportadas por los vecinos</Text>
      </View>

      <View style={styles.filterRow}>
        {[
          { label: "Todos", value: "todos" },
          { label: "Pendientes", value: "pendiente" },
          { label: "En Proceso", value: "en_proceso" },
          { label: "Resueltos", value: "resuelto" },
        ].map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, statusFilter === f.value && styles.filterChipSelected]}
            onPress={() => setStatusFilter(f.value as any)}
          >
            <Text style={[styles.filterChipText, statusFilter === f.value && styles.filterChipTextSelected]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#5CA838" />
        </View>
      ) : (
        <FlatList
          data={filteredIncidencias}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>Sin reclamos en esta categoría</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!selectedIncidencia}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIncidencia(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gestionar Incidencia</Text>
            <Text style={styles.modalSubtitle}>"{selectedIncidencia?.titulo}"</Text>

            <Text style={styles.modalLabel}>Cambiar Estado:</Text>
            <View style={styles.statusOptionsRow}>
              {[
                { label: "Pendiente", value: "pendiente" },
                { label: "En Proceso", value: "en_proceso" },
                { label: "Resuelto", value: "resuelto" },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.statusOptBtn, nuevoEstado === opt.value && styles.statusOptBtnSelected]}
                  onPress={() => setNuevoEstado(opt.value as IncidenciaEstado)}
                >
                  <Text style={[styles.statusOptText, nuevoEstado === opt.value && styles.statusOptTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Respuesta de la Junta (Opcional):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. El técnico acudirá mañana..."
              placeholderTextColor="#9CA3AF"
              value={respuestaText}
              onChangeText={setRespuestaText}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedIncidencia(null)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmChange} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.confirmBtnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};