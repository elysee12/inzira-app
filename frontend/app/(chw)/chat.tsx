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
  Alert,
} from "react-native";

import apiClient from "@/context/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface Conversation {
  partner: {
    id: number;
    name: string;
    role: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: number;
  };
  unreadCount: number;
}

export default function CHWChatScreen() {
  const colors = useColors();
  const { userId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/messages/conversations/${userId}`);
      setConversations(response.data);
    } catch (error) {
      Alert.alert("Ikosa", "Gufata ibiganiro byanze.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Vuba aha";
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString("rw-RW", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Ubutumwa</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Ubutumwa</Text>
        {conversations.length > 0 && (
          <TouchableOpacity onPress={fetchConversations}>
            <Feather name="refresh-cw" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
              <Feather name="message-square" size={48} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyText, { color: colors.foreground }]}>
              Nta butumwa buhari
            </Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              Tangira uganira n'ababyeyi ubashakishirize mu "Ababyeyi"
            </Text>
            <TouchableOpacity
              style={[styles.newChatBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(chw)/parents")}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.newChatBtnText}>Andika Ubutumwa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.partner.id}
              onPress={() => router.push({
                pathname: "/(chw)/chat-conversation/[userId]",
                params: { userId: conv.partner.id, userName: conv.partner.name }
              })}
              style={[styles.conversationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.avatar, { backgroundColor: "#E8F5EC" }]}>
                <Feather name="user" size={24} color="#16A34A" />
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={[styles.partnerName, { color: colors.foreground }]}>
                    {conv.partner.name}
                  </Text>
                  <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                    {formatTime(conv.lastMessage.createdAt)}
                  </Text>
                </View>
                <View style={styles.messagePreview}>
                  <Text
                    style={[
                      styles.lastMessage,
                      { color: conv.unreadCount > 0 ? colors.foreground : colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {conv.lastMessage.senderId === parseInt(userId || "0") ? "Wewe: " : ""}
                    {conv.lastMessage.content}
                  </Text>
                  {conv.unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: "#EF4444" }]}>
                      <Text style={styles.unreadCount}>{conv.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {conversations.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(chw)/parents")}
          activeOpacity={0.85}
        >
          <Feather name="edit-3" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    gap: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  newChatBtnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  timestamp: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  messagePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
