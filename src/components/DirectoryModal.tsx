import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useAuth } from "../context/AuthContext";
import { UserProfile } from "../constants/types";
import { subscribeUsuarios } from "../services/admin";

interface Props { visible: boolean; onClose: () => void; }
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export const DirectoryModal: React.FC<Props> = ({ visible, onClose }) => {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    const unsub = subscribeUsuarios((list) => { setUsuarios(list); setLoading(false); });
    return () => unsub();
  }, [visible]);

  const filtered = usuarios.filter((u) => {
    if (u.uid === user?.uid) return false;
    const q = query.toLowerCase();
    return (u.nombreCompleto || "").toLowerCase().includes(q) || (u.inmueble?.codigo || "").toLowerCase().includes(q);
  });

  const handleChat = (dest: UserProfile) => {
    onClose();
    navigation.navigate("ChatDetail", {
      destinatarioUid: dest.uid,
      destinatarioNombre: dest.nombreCompleto,
      destinatarioInmueble: dest.inmueble || { torre: "7", piso: 1, apartamento: 1, codigo: "7-1-1" },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <View>
              <Text style={s.title}>Directorio Comunitario</Text>
              <Text style={s.subtitle}>Residentes de Campo Neblina</Text>
            </View>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color="#64748B" /></TouchableOpacity>
          </View>
          <View style={s.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput style={s.searchInput} placeholder="Buscar por nombre o apto..." placeholderTextColor="#94A3B8" value={query} onChangeText={setQuery} />
          </View>
          {loading ? (
            <View style={s.loadingBox}><ActivityIndicator size="large" color="#234919" /></View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <View style={s.userCard}>
                  <View style={s.avatar}><Text style={s.avatarTxt}>{item.nombreCompleto?.charAt(0).toUpperCase() || "R"}</Text></View>
                  <View style={s.userInfo}>
                    <Text style={s.userName}>{item.nombreCompleto}</Text>
                    <Text style={s.userInmueble}>Torre {item.inmueble?.torre} - Apto {item.inmueble?.codigo}</Text>
                  </View>
                  <TouchableOpacity style={s.chatBtn} onPress={() => handleChat(item)}>
                    <Ionicons name="chatbubble-outline" size={15} color="#FFFFFF" />
                    <Text style={s.chatBtnTxt}>Chat</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<View style={s.empty}><Text style={s.emptyTxt}>No se encontraron residentes.</Text></View>}
            />
          )}
          <TouchableOpacity style={s.footerCloseBtn} onPress={onClose}><Text style={s.footerCloseTxt}>Cerrar</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", minHeight: 400, padding: 16, paddingBottom: Platform.OS === "ios" ? 32 : 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  title: { fontSize: 18, fontWeight: "bold", color: "#234919" },
  subtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 8, paddingHorizontal: 12, height: 42, marginVertical: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  searchInput: { flex: 1, fontSize: 13, color: "#0F172A" },
  loadingBox: { paddingVertical: 40, alignItems: "center" },
  userCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: "#E2E8F0", gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#234919", alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "bold", color: "#0F172A" },
  userInmueble: { fontSize: 12, color: "#475569", marginTop: 2 },
  chatBtn: { backgroundColor: "#234919", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6 },
  chatBtnTxt: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  empty: { alignItems: "center", paddingVertical: 30 },
  emptyTxt: { fontSize: 13, color: "#64748B" },
  footerCloseBtn: { height: 44, backgroundColor: "#E2E8F0", borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 8 },
  footerCloseTxt: { color: "#334155", fontWeight: "bold", fontSize: 14 },
});