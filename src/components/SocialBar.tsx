import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SocialBarProps {
  likes?: string[];
  comentariosCount?: number;
  currentUserId?: string;
  onToggleLike?: () => void;
  onOpenComments?: () => void;
}

export const SocialBar: React.FC<SocialBarProps> = ({
  likes = [],
  comentariosCount = 0,
  currentUserId,
  onToggleLike,
  onOpenComments,
}) => {
  const isLiked = currentUserId ? likes.includes(currentUserId) : false;
  const numLikes = likes.length;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.actionBtn} onPress={onToggleLike}>
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={18}
          color={isLiked ? "#EF4444" : "#64748B"}
        />
        <Text style={[styles.actionText, isLiked && styles.actionTextLiked]}>
          {numLikes > 0 ? `${numLikes} Me gusta` : "Me gusta"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionBtn} onPress={onOpenComments}>
        <Ionicons name="chatbubble-outline" size={17} color="#64748B" />
        <Text style={styles.actionText}>
          {comentariosCount > 0 ? `${comentariosCount} Comentario${comentariosCount === 1 ? "" : "s"}` : "Comentar"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  actionTextLiked: {
    color: "#EF4444",
  },
});