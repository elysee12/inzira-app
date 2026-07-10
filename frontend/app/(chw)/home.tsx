import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import apiClient from "@/context/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface Stats {
  parentsCount: number;
  unreadMessages: number;
}

const ACTION_CARDS = [
  {
    route: "/(chw)/parents" as const,
    icon: "users" as const,
    label: "Ababyeyi",
    description: "Reba no gufata ababyeyi bose bo mu mudugudu wawe",
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
    accent: "#16A34A",
  },
  {
    route: "/(chw)/lessons" as const,
    icon: "book-open" as const,
    label: "Amasomo",
    description: "Sura amasomo yo gufasha ababyeyi",
    iconBg: "#DBEAFE",
    iconColor: "#3B82F6",
    accent: "#3B82F6",
  },
  {
    route: "/(chw)/chat" as const,
    icon: "message-circle" as const,
    label: "Ganira n'Ababyeyi",
    description: "Subiza ibibazo bya ababyeyi binyuze mu butumwa",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    accent: "#D97706",
  },
];

export default function CHWHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, userId, facilityId, facilityName: authFacilityName } = useAuth();
  const [stats, setStats] = useState<Stats>({ parentsCount: 0, unreadMessages: 0 });
  const [loading, setLoading] = useState(true);
  // Resolved facility name — prefer what's in auth, fall back to API fetch
  const [resolvedFacilityName, setResolvedFacilityName] = useState<string | null>(
    authFacilityName ?? null
  );

  const topPad = Platform.OS === "web" ? 20 : insets.top;

  useEffect(() => {
    fetchStats();
  }, []);

  // If authFacilityName is empty but we have a facilityId, fetch it from the API
  useEffect(() => {
    if (authFacilityName) {
      setResolvedFacilityName(authFacilityName);
      return;
    }
    if (!facilityId) return;
    apiClient
      .get(`/facilities/${facilityId}`)
      .then((r) => setResolvedFacilityName(r.data?.name ?? null))
      .catch(() => {});
  }, [facilityId, authFacilityName]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [parentsRes, messagesRes] = await Promise.all([
        apiClient.get(`/chw/${userId}/parents`).catch(() => ({ data: [] })),
        apiClient.get(`/messages/unread/${userId}`).catch(() => ({ data: { unreadCount: 0 } })),
      ]);
      setStats({
        parentsCount: Array.isArray(parentsRes.data) ? parentsRes.data.length : 0,
        unreadMessages: messagesRes.data?.unreadCount ?? 0,
      });
    } catch {
      setStats({ parentsCount: 0, unreadMessages: 0 });
    } finally {
      setLoading(false);
    }
  };

  // First name only for the greeting
  const firstName = userName?.split(" ")[0] ?? "CHW";

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header gradient ───────────────────────────────────── */}
      <View
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        {/* Facility badge */}
        {resolvedFacilityName && (
          <View style={styles.facilityBadge}>
            <Feather name="map-pin" size={11} color="rgba(255,255,255,0.85)" />
            <Text style={styles.facilityBadgeText}>{resolvedFacilityName}</Text>
          </View>
        )}

        {/* Greeting */}
        <View style={styles.headerGreeting}>
          <Text style={styles.greetingSmall}>Muraho,</Text>
          <Text style={styles.greetingName}>{userName}</Text>
          <Text style={styles.greetingSub}>Umukozi w'Ubuzima Bw'Amahoro</Text>
        </View>

        {/* Stat cards inside header */}
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Feather name="users" size={18} color="#fff" />
              <Text style={styles.statPillNum}>{stats.parentsCount}</Text>
              <Text style={styles.statPillLabel}>Ababyeyi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statPill}>
              <Feather name="message-circle" size={18} color="#fff" />
              <Text style={styles.statPillNum}>{stats.unreadMessages}</Text>
              <Text style={styles.statPillLabel}>Ubutumwa bushya</Text>
            </View>
          </View>
        )}

        {/* Decorative circle */}
        <View style={styles.headerCircle} />
        <View style={styles.headerCircle2} />
      </View>

      {/* ── Section title ─────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ibikorwa byihuse</Text>
      </View>

      {/* ── Action cards ──────────────────────────────────────── */}
      <View style={styles.actionsContainer}>
        {ACTION_CARDS.map((card) => (
          <TouchableOpacity
            key={card.route}
            onPress={() => router.push(card.route)}
            style={[
              styles.actionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            activeOpacity={0.75}
          >
            {/* Left accent strip */}
            <View style={[styles.cardAccent, { backgroundColor: card.accent }]} />

            <View style={[styles.actionIconWrap, { backgroundColor: card.iconBg }]}>
              <Feather name={card.icon} size={22} color={card.iconColor} />
            </View>

            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                {card.label}
              </Text>
              <Text style={[styles.actionDesc, { color: colors.mutedForeground }]}>
                {card.description}
              </Text>
            </View>

            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Quick tips footer card ─────────────────────────────── */}
      <View style={[styles.tipCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
        <Feather name="info" size={16} color="#16A34A" />
        <Text style={[styles.tipText, { color: "#166534" }]}>
          Menya ko ikibazo cya nzaza gikuye ku ababyeyi baguciriweho. Komeza gufasha!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#16A34A",
  },
  facilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  facilityBadgeText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  headerGreeting: { marginBottom: 20 },
  greetingSmall: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  greetingName: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  greetingSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },

  /* Stats inside header */
  loadingRow: { paddingVertical: 16, alignItems: "center" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  statPill: { flex: 1, alignItems: "center", gap: 4 },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 8,
  },
  statPillNum: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  statPillLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  /* Decorative circles */
  headerCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -60,
  },
  headerCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -50,
    right: 60,
  },

  /* Section */
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },

  /* Action cards */
  actionsContainer: { paddingHorizontal: 20, gap: 12 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextWrap: { flex: 1 },
  actionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  actionDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },

  /* Tip card */
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
