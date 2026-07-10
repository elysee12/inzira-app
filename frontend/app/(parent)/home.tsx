import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AGE_CATEGORIES } from "@/data/staticData";
import { useAuth } from "@/context/AuthContext";
import { useContent } from "@/context/ContentContext";
import { useColors } from "@/hooks/useColors";
import { AgeCategoryCard } from "@/components/AgeCategoryCard";
import apiClient from "@/context/apiClient";

export default function ParentHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, userId, facilityId, facilityName: authFacilityName } = useAuth();
  const { allContent, ageCategories, getByAge, isLoaded } = useContent();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  
  const [chw, setChw] = useState<any>(null);
  const [chwLoading, setChwLoading] = useState(true);
  const [resolvedFacilityName, setResolvedFacilityName] = useState<string | null>(
    authFacilityName ?? null
  );

  // Fetch facility name if not already in auth state
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

  const recentContent = allContent.filter((c) => c.isNew).slice(0, 4);
  const displayCategories = ageCategories.length > 0 ? ageCategories : AGE_CATEGORIES;
  
  useEffect(() => {
    // Fetch assigned CHW
    const fetchCHW = async () => {
      try {
        const response = await apiClient.get(`/users/${userId}/chw`);
        if (response.data) {
          setChw(response.data);
        }
      } catch (error) {
        console.log('No CHW assigned or error fetching CHW');
      } finally {
        setChwLoading(false);
      }
    };
    
    if (userId) {
      fetchCHW();
    }
  }, [userId]);

  if (!isLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Biri gufunguka...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Muraho, {userName || "Umubyeyi"} 👋</Text>
            <Text style={styles.headerSub}>Uburezi bw'umwana wawe</Text>
          </View>
        </View>

        {resolvedFacilityName && (
          <View style={styles.facilityBadge}>
            <Feather name="map-pin" size={11} color="rgba(255,255,255,0.85)" />
            <Text style={styles.facilityBadgeText}>{resolvedFacilityName}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push("/(parent)/lessons")}
          activeOpacity={0.8}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
            Shakisha amasomo...
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {!chwLoading && chw && (
          <TouchableOpacity
            style={[styles.chwCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/(parent)/chat-conversation/[userId]", params: { userId: chw.id } })}
            activeOpacity={0.85}
          >
            <View style={[styles.chwIconWrap, { backgroundColor: '#E8F5EC' }]}>
              <Feather name="message-circle" size={24} color={colors.primary} />
            </View>
            <View style={styles.chwInfo}>
              <Text style={[styles.chwTitle, { color: colors.foreground }]}>
                Ganira n'Umukozi w'Ubuzima
              </Text>
              <Text style={[styles.chwName, { color: colors.primary }]}>
                {chw.name}
              </Text>
              <Text style={[styles.chwVillage, { color: colors.mutedForeground }]}>
                {chw.village}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {recentContent.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                🆕 Bishya
              </Text>
              <TouchableOpacity onPress={() => router.push("/(parent)/lessons")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>Reba byose</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.horizontalList}>
                {recentContent.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.newCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() =>
                      router.push({
                        pathname: "/(parent)/content/[id]",
                        params: { id: item.id },
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.newCardIcon,
                        {
                          backgroundColor:
                            item.type === "video"
                              ? "#EBF5FB"
                              : item.type === "audio"
                              ? "#F4ECF7"
                              : "#E8F5EC",
                        },
                      ]}
                    >
                      <Feather
                        name={
                          item.type === "video"
                            ? "play-circle"
                            : item.type === "audio"
                            ? "headphones"
                            : "file-text"
                        }
                        size={24}
                        color={
                          item.type === "video"
                            ? "#2980B9"
                            : item.type === "audio"
                            ? "#8E44AD"
                            : colors.primary
                        }
                      />
                    </View>
                    <Text style={[styles.newCardTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={[styles.newCardAge, { color: colors.primary }]}>
                      {item.ageGroup} amezi
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Hitamo ikiciro cy'umwana
            </Text>
          </View>

          {displayCategories.map((category) => (
            <AgeCategoryCard
              key={category.id}
              category={category}
              contentCount={getByAge(category.id).length}
              onPress={() =>
                router.push({
                  pathname: "/(parent)/age-group/[id]",
                  params: { id: category.id },
                })
              }
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: { fontSize: 14, fontFamily: "Inter_400Regular" },
  content: { padding: 20, gap: 24 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  horizontalList: { flexDirection: "row", gap: 12, paddingRight: 20 },
  newCard: {
    width: 160,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  newCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  newCardTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  newCardAge: { fontSize: 11, fontFamily: "Inter_500Medium" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  chwCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 8,
  },
  chwIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chwInfo: { flex: 1, gap: 4 },
  chwTitle: { fontSize: 12, fontFamily: "Inter_500Medium" },
  chwName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  chwVillage: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
