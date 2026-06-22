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
} from "react-native";

import apiClient from "@/context/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function CHWHomeScreen() {
  const colors = useColors();
  const { userName, userId } = useAuth();
  const [stats, setStats] = useState({ parentsCount: 0, unreadMessages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [parentsResponse, messagesResponse] = await Promise.all([
        apiClient.get(`/chw/${userId}/parents`),
        apiClient.get(`/messages/unread/${userId}`),
      ]);
      setStats({
        parentsCount: parentsResponse.data.length,
        unreadMessages: messagesResponse.data.unreadCount,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Muraho,</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{userName}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="users" size={32} color="#16A34A" />
              <Text style={[styles.statNumber, { color: colors.foreground }]}>{stats.parentsCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Ababyeyi</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="message-circle" size={32} color="#EF4444" />
              <Text style={[styles.statNumber, { color: colors.foreground }]}>{stats.unreadMessages}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Ubutumwa bushya</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={() => router.push("/(chw)/parents")}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#DCFCE7" }]}>
                <Feather name="users" size={24} color="#16A34A" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Reba Ababyeyi</Text>
              <Text style={[styles.actionDescription, { color: colors.mutedForeground }]}>
                Reba no gufata ababyeyi bose bo mu mudugudu wawe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(chw)/lessons")}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#DBEAFE" }]}>
                <Feather name="book-open" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Amasomo</Text>
              <Text style={[styles.actionDescription, { color: colors.mutedForeground }]}>
                Sura amasomo yo gufasha ababyeyi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(chw)/chat")}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: "#FEF3C7" }]}>
                <Feather name="message-circle" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Ganira n'Ababyeyi</Text>
              <Text style={[styles.actionDescription, { color: colors.mutedForeground }]}>
                Subiza ibibazo bya ababyeyi binyuze mu butumwa
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  actionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
