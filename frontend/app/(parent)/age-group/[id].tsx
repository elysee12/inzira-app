import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { FlatList, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { ContentCard } from "@/components/ContentCard";
import { useContent } from "@/context/ContentContext";
import { AGE_CATEGORIES } from "@/data/staticData";
import type { AgeGroup } from "@/data/staticData";
import { useColors } from "@/hooks/useColors";

export default function AgeGroupScreen() {
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
        title={`Amezi ${category.label}`}
        showBack
        backgroundColor={category.color}
      />

      <FlatList
        data={content}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContentCard
            item={item}
            onPress={() =>
              router.push({
                pathname: "/(parent)/content/[id]",
                params: { id: item.id },
              })
            }
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 12 },
});
