import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { ContentItem } from "@/data/staticData";
import { useColors } from "@/hooks/useColors";

interface ContentCardProps {
  item: ContentItem;
  onPress: () => void;
}

const TYPE_ICONS: Record<ContentItem["type"], string> = {
  text: "file-text",
  audio: "headphones",
  video: "play-circle",
};

const TYPE_LABELS: Record<ContentItem["type"], string> = {
  text: "Inyandiko",
  audio: "Amajwi",
  video: "Filime",
};

const TYPE_COLORS: Record<ContentItem["type"], string> = {
  text: "#1A8A3A",
  audio: "#8E44AD",
  video: "#2980B9",
};

export function ContentCard({ item, onPress }: ContentCardProps) {
  const colors = useColors();
  const typeColor = TYPE_COLORS[item.type];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
          <Feather name={TYPE_ICONS[item.type] as any} size={12} color={typeColor} />
          <Text style={[styles.typeLabel, { color: typeColor }]}>
            {TYPE_LABELS[item.type]}
          </Text>
        </View>
        {item.isNew && (
          <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.newLabel}>BISHYA</Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.meta}>
          <Feather name="user" size={11} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {typeof item.postedBy === "object" ? (item.postedBy as any).name : item.postedBy}
          </Text>
        </View>
        {item.duration && (
          <View style={styles.meta}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {item.duration}
            </Text>
          </View>
        )}
        <View style={styles.readMore}>
          <Text style={[styles.readMoreText, { color: colors.primary }]}>Soma</Text>
          <Feather name="chevron-right" size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  newLabel: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  readMore: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  readMoreText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
