import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { SocialBar } from "./SocialBar";
import { Evento, EventoCategoria } from "../constants/types";

interface EventCardProps {
  item: Evento;
  currentUserId?: string;
  isAdminOrModerator?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (item: Evento) => void;
  onToggleAttendance?: (item: Evento) => void;
  onShowAttendeesList?: (item: Evento) => void;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
}

const CATEGORIA_CONFIG: Record<
  EventoCategoria,
  { label: string; badgeBg: string; textCol: string }
> = {
  asamblea: { label: "ASAMBLEA", badgeBg: "#FEE2E2", textCol: "#991B1B" },
  corte_programado: { label: "CORTE PROGRAMADO", badgeBg: "#FEF3C7", textCol: "#D97706" },
  mantenimiento: { label: "MANTENIMIENTO", badgeBg: "#DBEAFE", textCol: "#1D4ED8" },
  social: { label: "EVENTO SOCIAL", badgeBg: "#D1FAE5", textCol: "#065F46" },
};

export const EventCard: React.FC<EventCardProps> = ({
  item,
  currentUserId,
  isAdminOrModerator,
  onDelete,
  onEdit,
  onToggleAttendance,
  onShowAttendeesList,
  onToggleLike,
  onOpenComments,
}) => {
  const config = CATEGORIA_CONFIG[item.categoria] || CATEGORIA_CONFIG.social;
  const asistentesList = item.asistentes || [];
  const yaAsiste = currentUserId ? asistentesList.includes(currentUserId) : false;
  const cantidadAsistentes = asistentesList.length;

  return (
    <View style={styles.card}>
      {item.editado && (
        <View style={styles.updatedBanner}>
          <View style={styles.updatedBadgeRow}>
            <Ionicons name="notifications-outline" size={14} color="#D97706" />
            <Text style={styles.updatedBadgeText}>Evento Actualizado</Text>
          </View>
          {!!item.notaActualizacion && (
            <Text style={styles.updatedNoteText}>"{item.notaActualizacion}"</Text>
          )}
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
          <Text style={[styles.badgeText, { color: config.textCol }]}>
            {config.label}
          </Text>
        </View>

        {isAdminOrModerator && (
          <View style={styles.adminActionsRow}>
            {onEdit && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(item)}>
                <Ionicons name="create-outline" size={18} color="#234919" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {!!item.imagenUrl && (
        <Image
          source={{ uri: item.imagenUrl }}
          style={styles.flyerImage}
          resizeMode="cover"
        />
      )}

      <Text style={styles.title}>{item.titulo}</Text>
      <Text style={styles.description}>{item.descripcion}</Text>

      <View style={styles.detailsBox}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color="#234919" />
          <Text style={styles.detailText}>{item.fecha}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color="#234919" />
          <Text style={styles.detailText}>{item.hora}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color="#234919" />
          <Text style={styles.detailText}>{item.ubicacion}</Text>
        </View>
      </View>

      <View style={styles.attendanceFooter}>
        <TouchableOpacity
          onPress={() => onShowAttendeesList && onShowAttendeesList(item)}
        >
          <Text style={styles.attendeesCountText}>
            {cantidadAsistentes} residente{cantidadAsistentes === 1 ? "" : "s"} asistirá{cantidadAsistentes === 1 ? "" : "n"}
          </Text>
        </TouchableOpacity>

        {onToggleAttendance && (
          <TouchableOpacity
            style={[styles.attendBtn, yaAsiste ? styles.attendBtnActive : styles.attendBtnInactive]}
            onPress={() => onToggleAttendance(item)}
          >
            <Text style={[styles.attendBtnText, yaAsiste ? styles.attendBtnTextActive : styles.attendBtnTextInactive]}>
              {yaAsiste ? "✓ Confirmado" : "Asistiré"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <SocialBar
        likes={(item as any).likes}
        comentariosCount={(item as any).numComentarios || 0}
        currentUserId={currentUserId}
        onToggleLike={onToggleLike}
        onOpenComments={onOpenComments}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  updatedBanner: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  updatedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  updatedBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B45309",
  },
  updatedNoteText: {
    fontSize: 12,
    color: "#92400E",
    fontStyle: "italic",
    marginTop: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  adminActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionBtn: {
    padding: 2,
  },
  flyerImage: {
    width: "100%",
    height: 160,
    borderRadius: theme.borderRadius.md,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1D1A",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  detailsBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#234919",
  },
  attendanceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  attendeesCountText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  attendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  attendBtnActive: {
    backgroundColor: "#5CA838",
    borderColor: "#5CA838",
  },
  attendBtnInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#234919",
  },
  attendBtnText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  attendBtnTextActive: {
    color: "#FFFFFF",
  },
  attendBtnTextInactive: {
    color: "#234919",
  },
});

