import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import { theme } from "../constants/theme";
import { UserProfile } from "../constants/types";
import { subscribeUsuarios } from "../services/admin";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ChatList">;

export const ChatListScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [vecinos, setVecinos] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const unsubscribe = subscribeUsuarios((list) => {
      const activos = list.filter((u) => u.status === "activo" && u.uid !== user?.uid);
      setVecinos(activos);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const filteredVecinos = vecinos.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.nombreCompleto?.toLowerCase().includes(q) ||
      v.inmueble?.codigo?.toLowerCase().includes(q) ||
      `torre ${v.inmueble?.torre}`.toLowerCase().includes(q)
    );
  });

  const handleOpenChat = (vecino: UserProfile) => {
    navigation.navigate("ChatDetail", {
      destinatarioUid: vecino.uid,
      destinatarioNombre: vecino.nombreCompleto,
      destinatarioInmueble: vecino.inmueble,
    });
  };

  const renderVecinoItem = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity style={styles.vecinoCard} onPress={() => handleOpenChat(item)}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>
          {item.nombreCompleto ? item.nombreCompleto.charAt(0).toUpperCase() : "👤"}
        </Text>
      </View>

      <View style={styles.vecinoInfo}>
        <Text style={styles.vecinoName}>{item.nombreCompleto}</Text>
        <Text style={styles.inmuebleText}>
          Torre {item.inmueble?.torre} - Apto {item.inmueble?.codigo}
        </Text>
      </View>

      <Text style={styles.chatIcon}>💬</Text>
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Mensajería Vecinal</Text>
          <TouchableOpacity
            style={styles.incidenciaBtn}
            onPress={() => navigation.navigate("Incidencias")}
          >
            <Text style={styles.incidenciaBtnText}>📢 Reclamos</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Comunícate de forma directa con tus vecinos</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar vecino por Nombre o Apto..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#5CA838" />
        </View>
      ) : (
        <FlatList
          data={filteredVecinos}
          keyExtractor={(item) => item.uid}
          renderItem={renderVecinoItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No se encontraron vecinos</Text>
              <Text style={styles.emptySubtitle}>Intenta con otro término de búsqueda.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F8F4" },
  header: { padding: theme.spacing.lg, paddingTop: theme.spacing.xl, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#234919" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  incidenciaBtn: { backgroundColor: "#E5EAE2", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  incidenciaBtnText: { fontSize: 12, fontWeight: "bold", color: "#234919" },
  searchBox: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm },
  searchInput: { height: 44, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, fontSize: 14, color: "#1A1D1A" },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: theme.spacing.lg, paddingTop: 0 },
  vecinoCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: "#E5E7EB" },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#234919", alignItems: "center", justifyContent: "center", marginRight: theme.spacing.md },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  vecinoInfo: { flex: 1 },
  vecinoName: { fontSize: 15, fontWeight: "bold", color: "#1A1D1A" },
  inmuebleText: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  chatIcon: { fontSize: 20 },
  emptyBox: { alignItems: "center", paddingVertical: theme.spacing.xl },
  emptyIcon: { fontSize: 44, marginBottom: theme.spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1D1A" },
  emptySubtitle: { fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 4 },
});
