import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { ContentCard } from "@/components/ContentCard";
import { useContent } from "@/context/ContentContext";
import { AGE_CATEGORIES } from "@/data/staticData";
import type { AgeGroup } from "@/data/staticData";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const ADMIN_COLOR = "#2980B9";

export default function AdminAgeContentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { id } = useLocalSearchParams<{ id: AgeGroup }>();
  const { getByAge } = useContent();

  const category = AGE_CATEGORIES.find((c) => c.id === id);
  const content = getByAge(id as AgeGroup);

  if (!category) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        title={`Amezi ${category.label} - Amasomo`}
        showBack
        backgroundColor={ADMIN_COLOR}
      />

      <FlatList
        data={content}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContentCard item={item} onPress={() => {}} />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nta masomo abonetse kuri iri tsinda
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium", textAlign: "center" },
});
