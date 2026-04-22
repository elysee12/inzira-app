import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
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
import WebView from "react-native-webview";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { AppHeader } from "@/components/AppHeader";
import { useContent } from "@/context/ContentContext";
import { getImageUrl, BASE_URL } from "@/context/apiClient";
import { useColors } from "@/hooks/useColors";
import type { ContentItem } from "@/data/staticData";

const ADMIN_COLOR = "#2980B9";

export default function AdminContentViewerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { allContent } = useContent();
  const [contentItem, setContentItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && allContent.length > 0) {
      // Use loose equality or convert both to strings since item.id might be a number
      const foundContent = allContent.find((item) => String(item.id) === String(id));
      setContentItem(foundContent || null);
      setLoading(false);
    } else if (id && allContent.length === 0) {
      // If content is not loaded yet, wait for it or fetch individually
      // For now, we assume allContent will eventually load
      setLoading(false); // Or handle a loading state more robustly
    }
  }, [id, allContent]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={ADMIN_COLOR} />
      </View>
    );
  }

  if (!contentItem) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader title="Isomo" showBack backgroundColor={ADMIN_COLOR} />
        <View style={styles.empty}>
          <Feather name="alert-triangle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Isomo ntiryabonetse.
          </Text>
        </View>
      </View>
    );
  }

  const fileUrl = contentItem.fileUrl ? getImageUrl(contentItem.fileUrl) : null;
  const isLocalUrl = fileUrl?.includes('localhost') || fileUrl?.includes('127.0.0.1') || fileUrl?.includes('10.') || fileUrl?.includes('192.168.');

  const openDocument = async () => {
    if (!fileUrl) return;
    try {
      setLoading(true);
      const filename = fileUrl.split('/').pop() || 'document.pdf';
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      const downloadResumable = FileSystem.createDownloadResumable(fileUrl, fileUri);
      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        await Sharing.shareAsync(result.uri);
      }
    } catch (error) {
      console.error(error);
      alert("Ntibyashobotse gufungura inyandiko.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (contentItem.type) {
      case "text":
        if (fileUrl) {
          // iOS can render PDFs directly in WebView
          if (Platform.OS === 'ios' && fileUrl.toLowerCase().endsWith('.pdf')) {
            return (
              <WebView
                style={styles.webview}
                source={{ uri: fileUrl }}
                startInLoadingState={true}
              />
            );
          }

          // For Android or other cases, use Google Docs Viewer if NOT a local URL
          if (!isLocalUrl) {
            return (
              <WebView
                style={styles.webview}
                source={{ uri: `https://docs.google.com/gview?embedded=true&url=${fileUrl}` }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={ADMIN_COLOR} />
                    <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>
                      Birimo gupakira inyandiko...
                    </Text>
                  </View>
                )}
              />
            );
          }

          // Local URL Fallback for Android (since Google Docs Viewer can't see local IPs)
          return (
            <View style={styles.localFallback}>
              <Feather name="file-text" size={60} color={ADMIN_COLOR} />
              <Text style={[styles.localFallbackText, { color: colors.foreground }]}>
                Inyandiko iri kuri network yawe (Local).
              </Text>
              <Text style={[styles.localFallbackSub, { color: colors.mutedForeground }]}>
                Kanda hano kugira ngo uyifungure neza:
              </Text>
              <TouchableOpacity style={[styles.openBtn, { backgroundColor: ADMIN_COLOR }]} onPress={openDocument}>
                <Feather name="external-link" size={20} color="#fff" />
                <Text style={styles.openBtnText}>Fungura Inyandiko</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return <Text style={[styles.contentBody, { color: colors.foreground }]}>{contentItem.description}</Text>;
      case "audio":
        return (
          <View style={styles.mediaContainer}>
            <Feather name="headphones" size={60} color={ADMIN_COLOR} />
            <Text style={[styles.mediaText, { color: colors.foreground }]}>Audio Player (Not Implemented)</Text>
            {fileUrl && <Text style={[styles.fileLink, { color: colors.primary }]}>{fileUrl}</Text>}
          </View>
        );
      case "video":
        return (
          <View style={styles.mediaContainer}>
            <Feather name="play-circle" size={60} color={ADMIN_COLOR} />
            <Text style={[styles.mediaText, { color: colors.foreground }]}>Video Player (Not Implemented)</Text>
            {fileUrl && <Text style={[styles.fileLink, { color: colors.primary }]}>{fileUrl}</Text>}
          </View>
        );
      default:
        return (
          <Text style={[styles.contentBody, { color: colors.foreground }]}>
            Ubwoko bw'isomo ntibuzwi.
          </Text>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={contentItem.title} showBack backgroundColor={ADMIN_COLOR} />

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.contentHeader}>
          <Text style={[styles.contentTitle, { color: colors.foreground }]}>{contentItem.title}</Text>
          <Text style={[styles.contentMeta, { color: colors.mutedForeground }]}>
            {contentItem.ageGroup} amezi • {typeof contentItem.postedBy === 'object' ? (contentItem.postedBy as any).name : contentItem.postedBy}
          </Text>
        </View>

        {renderContent()}

        {contentItem.type !== "text" && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionTitle, { color: colors.foreground }]}>Ibisobanuro:</Text>
            <Text style={[styles.contentBody, { color: colors.foreground }]}>{contentItem.description}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium", textAlign: "center" },
  contentHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: "#eee" },
  contentTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  contentMeta: { fontSize: 13, fontFamily: "Inter_500Medium" },
  contentBody: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24, padding: 20 },
  mediaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
    padding: 20,
    gap: 10,
  },
  mediaText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  fileLink: { fontSize: 12, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
  webview: { flex: 1, height: 500 }, // Adjust height as needed
  localFallback: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  localFallbackText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  localFallbackSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  openBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  descriptionContainer: {
    padding: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  descriptionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
  },
});
