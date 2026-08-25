import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../constants/theme";
import { ChatConversacion, UserProfile } from "../constants/types";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "../navigation/AppNavigator";
import { subscribeUsuarios } from "../services/admin";
import { subscribeMisChats, getChatId } from "../services/chat";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ChatList">;
type FiltroTab = "Todos" | "No leídos" | "Leídos";

interface ChatItemVM extends UserProfile {
  noLeidosCount: number;
  ultimoMensaje: string;
}

export const ChatListScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [vecinos, setVecinos] = useState<UserProfile[]>([]);
  const [chatsMap, setChatsMap] = useState<{ [otroUid: string]: ChatConversacion }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filtro, setFiltro] = useState<'Todos' | 'No leídos' | 'Leídos'>('Todos');

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribeUsuarios = subscribeUsuarios((list) => {
      const activos = list.filter(
        (u) => u.status === "activo" && u.uid !== user?.uid,
      );
      setVecinos(activos);
      setLoading(false);
    });

    const unsubscribeChats = subscribeMisChats(user.uid, (chats) => {
      const map: { [otroUid: string]: ChatConversacion } = {};
      chats.forEach((chat) => {
        const otroUid = chat.participantes.find((p) => p !== user.uid);
        if (otroUid) {
          map[otroUid] = chat;
        }
      });
      setChatsMap(map);
    });

    return () => {
      unsubscribeUsuarios();
      unsubscribeChats();
    };
  }, [user?.uid]);

  const vecinosConChat: ChatItemVM[] = vecinos.map((vecino) => {
    const chat = chatsMap[vecino.uid];
    const noLeidosCount = chat && chat.noLeidos ? (chat.noLeidos[user?.uid || ""] || 0) : 0;
    return {
      ...vecino,
      noLeidosCount,
      ultimoMensaje: chat?.ultimoMensaje || "Inicia una conversación",
    };
  });

  const filteredVecinos = vecinosConChat.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      v.nombreCompleto?.toLowerCase().includes(q) ||
      v.inmueble?.codigo?.toLowerCase().includes(q) ||
      `torre ${v.inmueble?.torre}`.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filtro === "No leídos") {
      return v.noLeidosCount > 0;
    }
    if (filtro === "Leídos") {
      return v.noLeidosCount === 0;
    }
    return true;
  });

  const handleOpenChat = (vecino: UserProfile) => {
    navigation.navigate("ChatDetail", {
      destinatarioUid: vecino.uid,
      destinatarioNombre: vecino.nombreCompleto,
      destinatarioInmueble: vecino.inmueble,
    });
  };

  const renderVecinoItem = ({ item }: { item: ChatItemVM }) => (
    <TouchableOpacity
      style={styles.vecinoCard}
      onPress={() => handleOpenChat(item)}
    >
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>
          {item.nombreCompleto
            ? item.nombreCompleto.charAt(0).toUpperCase()
            : "👤"}
        </Text>
      </View>

      <View style={styles.vecinoInfo}>
        <Text style={styles.vecinoName}>{item.nombreCompleto}</Text>
        <Text style={styles.inmuebleText}>
          Torre {item.inmueble?.torre} - Apto {item.inmueble?.codigo}
        </Text>
      </View>

      {item.noLeidosCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{item.noLeidosCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Mensajería Vecinal</Text>
        </View>
        <Text style={styles.subtitle}>
          Comunícate de forma directa con tus vecinos
        </Text>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {(["Todos", "No leídos", "Leídos"] as FiltroTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterChip,
              filtro === tab && styles.filterChipSelected,
            ]}
            onPress={() => setFiltro(tab)}
          >
            <Text
              style={[
                styles.filterChipText,
                filtro === tab && styles.filterChipTextSelected,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              <Text style={styles.emptyTitle}>No se encontraron vecinos</Text>
              <Text style={styles.emptySubtitle}>
                Intenta con otro término de búsqueda o filtro.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F8F4" },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#234919" },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  searchBox: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  searchInput: {
    height: 44,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: 14,
    color: "#1A1D1A",
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: theme.spacing.sm,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  filterChipSelected: {
    backgroundColor: "#234919",
    borderColor: "#234919",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  filterChipTextSelected: {
    color: "#FFFFFF",
  },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: theme.spacing.lg, paddingTop: 0 },
  vecinoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#234919",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  vecinoInfo: { flex: 1 },
  vecinoName: { fontSize: 15, fontWeight: "bold", color: "#1A1D1A" },
  inmuebleText: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  badgeContainer: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: theme.spacing.sm,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  emptyBox: { alignItems: "center", paddingVertical: theme.spacing.xl },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1D1A" },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
});
