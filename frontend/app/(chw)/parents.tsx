import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";

import apiClient from "@/context/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface Parent {
  id: number;
  name: string;
  email: string;
  phone: string;
  village?: string;
  createdAt: string;
}

export default function CHWParentsScreen() {
  const colors = useColors();
  const { userId } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredParents(parents);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = parents.filter(
        (parent) =>
          parent.name.toLowerCase().includes(query) ||
          parent.email.toLowerCase().includes(query) ||
          parent.phone.includes(query),
      );
      setFilteredParents(filtered);
    }
  }, [searchQuery, parents]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/chw/${userId}/parents`);
      setParents(response.data);
      setFilteredParents(response.data);
    } catch (error) {
      Alert.alert("Ikosa", "Gufata ababyeyi byanze.");
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (parent: Parent) => {
    router.push({
      pathname: "/(chw)/chat-conversation/[userId]",
      params: { userId: parent.id, userName: parent.name }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Ababyeyi</Text>
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
        <Text style={[styles.title, { color: colors.foreground }]}>Ababyeyi</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {parents.length} {parents.length === 1 ? "umubyeyi" : "ababyeyi"}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={20} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Shakisha umubyeyi..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {filteredParents.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {searchQuery ? "Nta babyeyi babonetse" : "Nta babyeyi bahari"}
            </Text>
          </View>
        ) : (
          filteredParents.map((parent) => (
            <View key={parent.id} style={[styles.parentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.parentAvatar, { backgroundColor: "#DCFCE7" }]}>
                <Feather name="user" size={24} color="#16A34A" />
              </View>
              <View style={styles.parentInfo}>
                <Text style={[styles.parentName, { color: colors.foreground }]}>{parent.name}</Text>
                <Text style={[styles.parentDetail, { color: colors.mutedForeground }]}>
                  <Feather name="phone" size={12} /> {parent.phone}
                </Text>
                <Text style={[styles.parentDetail, { color: colors.mutedForeground }]}>
                  <Feather name="mail" size={12} /> {parent.email}
                </Text>
                {parent.village && (
                  <Text style={[styles.parentDetail, { color: colors.mutedForeground }]}>
                    <Feather name="map-pin" size={12} /> {parent.village}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleChatPress(parent)}
                style={[styles.chatButton, { backgroundColor: "#16A34A" }]}
              >
                <Feather name="message-circle" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
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
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  parentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  parentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  parentInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  parentDetail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
