import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Alert } from "react-native";
import { theme } from "../constants/theme";
import { Publicacion } from "../constants/types";
import { SocialBar } from "./SocialBar";

interface ProductCardProps {
  item: Publicacion;
  currentUserId?: string;
  onReport: (publicacion: Publicacion) => void;
  onDelete?: (publicacionId: string) => void;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  currentUserId,
  onReport,
  onDelete,
  onToggleLike,
  onOpenComments,
}) => {
  const isOwner = currentUserId === item.vendedorUid;
  const isServicio = item.tipo === "servicio";

  const handleContactSeller = () => {
    if (!item.vendedorTelefono) {
      Alert.alert("Contacto", "El vendedor no registró un teléfono.");
      return;
    }
    const cleanPhone = item.vendedorTelefono.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Hola ${item.vendedorNombre}, vi tu publicación "${item.titulo}" en Campo Neblina.`
    )}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`tel:${item.vendedorTelefono}`);
      }
    });
  };

  return (
    <View style={styles.card}>
      {item.imagenUrl ? (
        <Image source={{ uri: item.imagenUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderIcon}>{isServicio ? "🛠️" : "📦"}</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.headerRow}>
          <View style={[styles.badge, isServicio ? styles.badgeServicio : styles.badgeProducto]}>
            <Text style={[styles.badgeText, isServicio ? styles.badgeTextServicio : styles.badgeTextProducto]}>
              {isServicio ? "SERVICIO" : "PRODUCTO"}
            </Text>
          </View>
          <Text style={styles.priceText}>${item.precio?.toFixed(2)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{item.titulo}</Text>
        <Text style={styles.description} numberOfLines={3}>{item.descripcion}</Text>

        <View style={styles.vendedorRow}>
          <Text style={styles.vendedorName}>👤 {item.vendedorNombre}</Text>
          <View style={styles.inmuebleTag}>
            <Text style={styles.inmuebleTagText}>
              Torre {item.vendedorInmueble?.torre} - Apto {item.vendedorInmueble?.codigo}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContactSeller}>
            <Text style={styles.contactBtnText}>💬 Contactar</Text>
          </TouchableOpacity>

          {isOwner && onDelete ? (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item.id)}>
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.reportBtn} onPress={() => onReport(item)}>
              <Text style={styles.reportBtnText}>🚩 Reportar</Text>
            </TouchableOpacity>
          )}
        </View>

        <SocialBar
          likes={item.likes}
          comentariosCount={item.comentarios?.length || (item as any).numComentarios || 0}
          currentUserId={currentUserId}
          onToggleLike={onToggleLike}
          onOpenComments={onOpenComments}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: theme.spacing.lg, overflow: "hidden" },
  image: { width: "100%", height: 160 },
  imagePlaceholder: { width: "100%", height: 100, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  placeholderIcon: { fontSize: 36 },
  cardBody: { padding: theme.spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.xs },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeProducto: { backgroundColor: "#E5EAE2" }, badgeServicio: { backgroundColor: "#FEF3C7" },
  badgeText: { fontSize: 11, fontWeight: "bold" },
  badgeTextProducto: { color: "#234919" }, badgeTextServicio: { color: "#D97706" },
  priceText: { fontSize: 18, fontWeight: "bold", color: "#5CA838" },
  title: { fontSize: 16, fontWeight: "bold", color: "#1A1D1A", marginBottom: 4 },
  description: { fontSize: 13, color: "#4B5563", lineHeight: 18, marginBottom: theme.spacing.sm },
  vendedorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: theme.spacing.xs, borderTopWidth: 1, borderTopColor: "#F3F4F6", marginBottom: theme.spacing.md },
  vendedorName: { fontSize: 13, fontWeight: "600", color: "#1A1D1A" },
  inmuebleTag: { backgroundColor: "#F5F8F4", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: "#E5EAE2" },
  inmuebleTagText: { fontSize: 11, fontWeight: "bold", color: "#234919" },
  actionsRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  contactBtn: { flex: 1, height: 38, backgroundColor: "#234919", borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center" },
  contactBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "bold" },
  reportBtn: { paddingHorizontal: 10, height: 38, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  reportBtnText: { fontSize: 12, color: "#6B7280" },
  deleteBtn: { paddingHorizontal: 12, height: 38, backgroundColor: "#FEE2E2", borderRadius: theme.borderRadius.md, alignItems: "center", justifyContent: "center" },
  deleteBtnText: { fontSize: 14 },
});
