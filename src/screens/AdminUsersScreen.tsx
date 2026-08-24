import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { UserProfile, UserStatus } from "../constants/types";
import {
  subscribeUsuarios,
  aprobarUsuario,
  suspenderUsuario,
  reactivarUsuario,
} from "../services/admin";
import { styles } from "./AdminUsersScreen.styles";

export const AdminUsersScreen: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"todos" | UserStatus>("todos");

  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<UserProfile | null>(null);
  const [motivo, setMotivo] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeUsuarios((list) => {
      setUsuarios(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAprobar = async (uid: string) => {
    try {
      await aprobarUsuario(uid);
      Alert.alert("Éxito", "Usuario aprobado correctamente.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo aprobar al usuario.");
    }
  };

  const handleReactivar = async (uid: string) => {
    try {
      await reactivarUsuario(uid);
      Alert.alert("Éxito", "Usuario reactivado correctamente.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo reactivar al usuario.");
    }
  };

  const handleConfirmSuspender = async () => {
    if (!selectedUserForSuspend) return;
    if (!motivo.trim()) {
      Alert.alert("Motivo Requerido", "Ingresa una razón para suspender a este usuario.");
      return;
    }

    setActionLoading(true);
    try {
      await suspenderUsuario(selectedUserForSuspend.uid, motivo.trim());
      Alert.alert("Usuario Suspendido", "El estado de la cuenta ha sido actualizado a suspendido.");
      setSelectedUserForSuspend(null);
      setMotivo("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo suspender la cuenta.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const matchesSearch =
      u.nombreCompleto?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.cedulaDni?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.inmueble?.codigo?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      statusFilter === "todos" || u.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const renderUserCard = ({ item }: { item: UserProfile }) => {
    const isPendiente = item.status === "pendiente_aprobacion";
    const isActivo = item.status === "activo";
    const isSuspendido = item.status === "suspendido";

    return (
      <View style={styles.userCard}>
        <View style={styles.userCardHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.nombreCompleto}</Text>
            <Text style={styles.userSubtext}>C.I. / DNI: {item.cedulaDni}</Text>
          </View>
          <View style={[styles.statusBadge, isActivo && styles.bgGreen, isPendiente && styles.bgYellow, isSuspendido && styles.bgRed]}>
            <Text style={[styles.statusBadgeText, isActivo && styles.textGreen, isPendiente && styles.textYellow, isSuspendido && styles.textRed]}>
              {isActivo ? "Activo" : isPendiente ? "Pendiente" : "Suspendido"}
            </Text>
          </View>
        </View>

        <View style={styles.userDetailsRow}>
          <View style={styles.inmuebleBadgeBox}>
            <Text style={styles.inmuebleBadgeText}>🏢 Torre {item.inmueble?.torre} - Apto {item.inmueble?.codigo}</Text>
          </View>
          <Text style={styles.roleText}>{item.tipoResidente === "inquilino" ? "Inquilino" : "Propietario"}</Text>
        </View>

        {isSuspendido && item.motivoSuspension ? (
          <View style={styles.motivoBox}>
            <Text style={styles.motivoTitle}>Motivo Suspensión:</Text>
            <Text style={styles.motivoContent}>{item.motivoSuspension}</Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          {isPendiente && (
            <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleAprobar(item.uid)}>
              <Text style={styles.actionBtnText}>Aprobar</Text>
            </TouchableOpacity>
          )}

          {isActivo && (
            <TouchableOpacity style={[styles.actionBtn, styles.suspendBtn]} onPress={() => { setSelectedUserForSuspend(item); setMotivo(""); }}>
              <Text style={styles.actionBtnText}>Suspender</Text>
            </TouchableOpacity>
          )}

          {isSuspendido && (
            <TouchableOpacity style={[styles.actionBtn, styles.reactivateBtn]} onPress={() => handleReactivar(item.uid)}>
              <Text style={styles.actionBtnText}>Reactivar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Usuarios</Text>
        <Text style={styles.subtitle}>Directorio comunal - Campo Neblina</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por Nombre, Cédula o Apto..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        {[
          { label: "Todos", value: "todos" },
          { label: "Pendientes", value: "pendiente_aprobacion" },
          { label: "Activos", value: "activo" },
          { label: "Suspendidos", value: "suspendido" },
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
          data={filteredUsuarios}
          keyExtractor={(item) => item.uid}
          renderItem={renderUserCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!selectedUserForSuspend}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUserForSuspend(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Suspender Cuenta</Text>
            <Text style={styles.modalSubtitle}>
              Usuario: {selectedUserForSuspend?.nombreCompleto} ({selectedUserForSuspend?.inmueble?.codigo})
            </Text>
            <Text style={styles.modalInputLabel}>Motivo de Suspensión:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Mora en pago de condominio"
              placeholderTextColor="#9CA3AF"
              value={motivo}
              onChangeText={setMotivo}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSelectedUserForSuspend(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmSuspender}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
