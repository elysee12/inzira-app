import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useContent } from "@/context/ContentContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { AGE_CATEGORIES } from "@/data/staticData";

const ADMIN_COLOR = "#2980B9";

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, logout } = useAuth();
  const { allContent, ageCategories, getByAge } = useContent();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const textCount = allContent.filter((c) => c.type === "text").length;
  const audioCount = allContent.filter((c) => c.type === "audio").length;
  const videoCount = allContent.filter((c) => c.type === "video").length;
  const totalContent = allContent.length;

  const displayCategories = ageCategories.length > 0 ? ageCategories : AGE_CATEGORIES;

  const stats = [
    { icon: "file-text", label: "Inyandiko", value: textCount, color: colors.primary },
    { icon: "headphones", label: "Audio", value: audioCount, color: "#8E44AD" },
    { icon: "play-circle", label: "Video", value: videoCount, color: ADMIN_COLOR },
    { icon: "layers", label: "Byose", value: totalContent, color: "#D35400" },
  ];

  const recentContent = allContent.slice(0, 5);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: ADMIN_COLOR }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Muraho, {userName || "Umuyobozi"}</Text>
            <Text style={styles.headerSub}>Imicungire ya System</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Feather name="log-out" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Feather name={stat.icon as any} size={20} color="#fff" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Ikiciro cy'umwana
            </Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/manage-categories")}>
              <Text style={[styles.seeAll, { color: ADMIN_COLOR }]}>Genzura</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ageGrid}>
            {displayCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.ageCard, { backgroundColor: cat.bgColor }]}
                onPress={() =>
                  router.push({
                    pathname: "/(admin)/age-content/[id]",
                    params: { id: cat.id },
                  })
                }
                activeOpacity={0.8}
              >
                <Text style={[styles.ageNum, { color: cat.color }]}>{cat.label}</Text>
                <Text style={[styles.ageSub, { color: cat.color }]}>{cat.sublabel}</Text>
                <Text style={[styles.ageCount, { color: cat.color + "99" }]}>
                  {getByAge(cat.id).length} isomo
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Inyigisho ziheruka
            </Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/manage")}>
              <Text style={[styles.seeAll, { color: ADMIN_COLOR }]}>Reba byose</Text>
            </TouchableOpacity>
          </View>

          {recentContent.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.recentItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({
                pathname: "/(admin)/content-viewer/[id]",
                params: { id: item.id },
              })}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.recentIcon,
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
                  size={18}
                  color={
                    item.type === "video"
                      ? ADMIN_COLOR
                      : item.type === "audio"
                      ? "#8E44AD"
                      : colors.primary
                  }
                />
              </View>
              <View style={styles.recentText}>
                <Text style={[styles.recentTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.recentMeta, { color: colors.mutedForeground }]}>
                  {item.ageGroup} amezi • {typeof item.postedBy === 'object' ? (item.postedBy as any).name : item.postedBy}
                </Text>
              </View>
              {item.isNew && (
                <View style={[styles.newDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.uploadCta, { backgroundColor: ADMIN_COLOR }]}
          onPress={() => router.push("/(admin)/upload")}
          activeOpacity={0.85}
        >
          <Feather name="plus-circle" size={20} color="#fff" />
          <Text style={styles.uploadCtaText}>Ongeraho isomo rishya</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)" },
  content: { padding: 20, gap: 24 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  ageCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 14,
    gap: 2,
  },
  ageNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  ageSub: { fontSize: 12, fontFamily: "Inter_500Medium" },
  ageCount: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  recentText: { flex: 1 },
  recentTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  recentMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  newDot: { width: 8, height: 8, borderRadius: 4 },
  uploadCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  uploadCtaText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
