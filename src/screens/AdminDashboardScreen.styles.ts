import { StyleSheet } from "react-native";
import { theme } from "../constants/theme";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#234919" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  tabScroll: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  tabPillActive: {
    backgroundColor: "#234919",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  btnApprove: {
    flex: 1,
    height: 38,
    backgroundColor: "#234919",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSuspend: {
    flex: 1,
    height: 38,
    backgroundColor: "#EF4444",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 8,
  },
});
