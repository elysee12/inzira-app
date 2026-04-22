import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { AgeCategory } from "@/data/staticData";
import { useColors } from "@/hooks/useColors";
import { getImageUrl } from "@/context/apiClient";

const AGE_IMAGES: Record<string, any> = {
  "0-6": require("../assets/images/age_0_6.png"),
  "7-12": require("../assets/images/age_7_12.png"),
  "13-24": require("../assets/images/age_13_24.png"),
  "25-59": require("../assets/images/age_25_59.png"),
};

interface AgeCategoryCardProps {
  category: AgeCategory;
  contentCount: number;
  onPress: () => void;
}

export function AgeCategoryCard({ category, contentCount, onPress }: AgeCategoryCardProps) {
  const colors = useColors();

  const imageSource = category.imageUrl 
    ? { uri: getImageUrl(category.imageUrl) } 
    : AGE_IMAGES[category.id];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.imageContainer, { backgroundColor: category.bgColor }]}>
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="cover"
        />
        <View style={[styles.badge, { backgroundColor: category.color }]}>
          <Text style={styles.badgeCount}>{contentCount}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.agePill, { backgroundColor: category.bgColor }]}>
          <Text style={[styles.ageText, { color: category.color }]}>
            {category.label} {category.sublabel}
          </Text>
        </View>
        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
          {category.description}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.lessonCount, { color: colors.mutedForeground }]}>
            {contentCount} isomo
          </Text>
          <View style={[styles.arrowBtn, { backgroundColor: category.color }]}>
            <Feather name="arrow-right" size={14} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
    height: 130,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  imageContainer: {
    width: 110,
    position: "relative",
  },
  image: {
    width: 110,
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCount: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  agePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ageText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  description: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  lessonCount: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
