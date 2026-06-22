import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { ContentCard } from "@/components/ContentCard";
import { useContent } from "@/context/ContentContext";
import { AGE_CATEGORIES } from "@/data/staticData";
import type { AgeGroup } from "@/data/staticData";
import { useColors } from "@/hooks/useColors";

const ALL_FILTER = "all";
type Filter = AgeGroup | typeof ALL_FILTER;

export default function LessonsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { allContent } = useContent();
  const [activeFilter, setActiveFilter] = useState<Filter>(ALL_FILTER);

  const filters = [
    { id: ALL_FILTER, label: "Byose" },
    ...AGE_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ];

  const filtered =
    activeFilter === ALL_FILTER
      ? allContent
      : allContent.filter((c) => c.ageGroup === activeFilter);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Amasomo" />

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === f.id ? colors.primary : colors.card,
                borderColor: activeFilter === f.id ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveFilter(f.id as Filter)}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: activeFilter === f.id ? "#fff" : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContentCard
            item={item}
            onPress={() =>
              router.push({
                pathname: "/(chw)/content/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nta masomo abonetse
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium" },
});
