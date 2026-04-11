import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Audio, Video } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { useContent } from "@/context/ContentContext";
import { AGE_CATEGORIES } from "@/data/staticData";
import { useColors } from "@/hooks/useColors";
import { API_URL } from "@/context/apiClient";

const TYPE_ICONS: Record<string, string> = {
  text: "file-text",
  audio: "headphones",
  video: "play-circle",
};

const TYPE_LABELS: Record<string, string> = {
  text: "Inyandiko",
  audio: "Amajwi",
  video: "Filime",
};

const TYPE_COLORS: Record<string, string> = {
  text: "#1A8A3A",
  audio: "#8E44AD",
  video: "#2980B9",
};

export default function ContentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { allContent } = useContent();

  const item = allContent.find((c) => String(c.id) === String(id));
  const category = item ? AGE_CATEGORIES.find((a) => a.id === item.ageGroup) : null;
  
  const audioRef = useRef<Audio.Sound | null>(null);
  const videoRef = useRef<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, marginTop: 12, fontFamily: "Inter_500Medium" }}>
          Isomo ntariboneka
        </Text>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Garuka</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeColor = TYPE_COLORS[item.type] ?? colors.primary;
  
  // Construct full file URL (remove /api suffix from API_URL)
  const BASE_HOST = API_URL.replace("/api", "");
  const rawFileUrl = item.fileUrl ? `${BASE_HOST}${item.fileUrl}` : null;

  const handleDownload = async () => {
    if (!rawFileUrl) {
      Alert.alert("Makosa", "Nta dosiye ihari yo gushyira kuri telefoni.");
      return;
    }

    setDownloading(true);
    try {
      const filename = item.fileUrl?.split("/").pop() || "lesson_file";
      const fileUri = FileSystem.documentDirectory + filename;
      
      const downloadRes = await FileSystem.downloadAsync(rawFileUrl, fileUri);
      
      if (downloadRes.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri);
        } else {
          Alert.alert("Byagenze!", "Dosiye yabitswe neza kuri telefoni yawe.");
        }
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      Alert.alert("Makosa", "Gushyira dosiye kuri telefoni ntibyashobotse.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!rawFileUrl) {
      Alert.alert("Makosa", "Dosiye ntiboneka");
      return;
    }

    try {
      setIsLoading(true);
      if (item.type === "audio") {
        if (audioRef.current) {
          if (isPlaying) {
            await audioRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await audioRef.current.playAsync();
            setIsPlaying(true);
          }
        } else {
          const { sound } = await Audio.Sound.createAsync(
            { uri: rawFileUrl },
            { progressUpdateIntervalMillis: 100 }
          );
          audioRef.current = sound;
          
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded) {
              setCurrentPosition(status.positionMillis);
              setDuration(status.durationMillis);
              setIsPlaying(status.isPlaying);
            }
          });
          
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      Alert.alert("Makosa", "Ongera ngo uige dosiye ntibyashobotse");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.unloadAsync();
      }
    };
  }, []);

  const handleShare = async () => {
    try {
      const message = `${item.title}\n\n${item.description}\n\nIsomo riri mu kategori: Amezi ${item.ageGroup}`;
      
      if (Platform.OS === 'web') {
        // For web, show options
        Alert.alert("Sangira", message);
      } else {
        // For mobile (iOS and Android), use React Native Share API
        await Share.share({
          message: message,
          title: item.title,
          url: rawFileUrl || undefined, // Include file URL if available
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'User did not share') {
        Alert.alert("Makosa", "Sangira ntibyashobotse.");
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: typeColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <View style={styles.typePill}>
            <Feather name={TYPE_ICONS[item.type] as any} size={13} color="#fff" />
            <Text style={styles.typePillText}>{TYPE_LABELS[item.type]}</Text>
          </View>
          {item.duration && (
            <Text style={styles.duration}>{item.duration}</Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {(item.type === "audio" || item.type === "video") && rawFileUrl && (
          <View style={[styles.playerWrap, { backgroundColor: typeColor + "15", borderColor: typeColor + "30" }]}>
            <TouchableOpacity
              style={[styles.playBtn, { backgroundColor: typeColor }]}
              onPress={handlePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Feather name={isPlaying ? "pause" : "play"} size={28} color="#fff" />
              )}
            </TouchableOpacity>
            <View style={styles.playerInfo}>
              <Text style={[styles.playerLabel, { color: typeColor }]}>
                {isLoading
                  ? "Irimo gukonjesha..."
                  : isPlaying
                  ? item.type === "audio"
                    ? "Amajwi arimo gutubirizwa..."
                    : "Filime irimo kugaragazwa..."
                  : `Kanda kugira ngo ${item.type === "audio" ? "utege amajwi" : "urebe filime"}`}
              </Text>
              {duration > 0 && (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: typeColor, width: `${(currentPosition / duration) * 100}%` },
                    ]}
                  />
                </View>
              )}
              {duration > 0 && (
                <Text style={[styles.timeText, { color: typeColor }]}>
                  {Math.floor(currentPosition / 1000)}s / {Math.floor(duration / 1000)}s
                </Text>
              )}
            </View>
          </View>
        )}

        {item.type === "video" && rawFileUrl && (
          <View style={[styles.videoContainer, { backgroundColor: typeColor + "20" }]}>
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: rawFileUrl }}
              useNativeControls
              resizeMode="contain"
              onError={() => Alert.alert("Makosa", "Filime ntishobora kurangizwa")}
            />
          </View>
        )}

        <View style={[styles.ageBadge, { backgroundColor: category?.bgColor ?? colors.secondary }]}>
          <Text style={[styles.ageBadgeText, { color: category?.color ?? colors.primary }]}>
            Amezi {item.ageGroup}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>

        <View style={styles.metaRow}>
          <Feather name="user" size={13} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {typeof item.postedBy === "object" ? (item.postedBy as any).name : item.postedBy}
          </Text>
          <Text style={[styles.dot, { color: colors.mutedForeground }]}>•</Text>
          <Feather name="calendar" size={13} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {new Date(item.postedAt).toLocaleDateString("rw-RW", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {rawFileUrl && item.type === "text" && (
          <View style={styles.webViewContainer}>
            {rawFileUrl.toLowerCase().endsWith('.pdf') ? (
              <View style={[styles.pdfContainer, { backgroundColor: colors.secondary }]}>
                <Feather name="file-text" size={50} color={colors.primary} />
                <Text style={[styles.pdfTitle, { color: colors.foreground }]}>
                  {item.title}
                </Text>
                <Text style={[styles.pdfText, { color: colors.mutedForeground }]}>
                  PDF Document - Kanda "Bika" kugira ngo usome kuri telefoni yawe.
                </Text>
                <TouchableOpacity 
                  style={[styles.openPdfBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (Platform.OS === 'android' || Platform.OS === 'ios') {
                      Linking.openURL(rawFileUrl).catch(() => {
                        Alert.alert("Makosa", "Dosiye ntishobora kugabuka. Kanda 'Bika' kugira ngo uyishyire kuri telefoni.");
                      });
                    }
                  }}
                >
                  <Feather name="eye" size={18} color="#fff" />
                  <Text style={styles.openPdfBtnText}>Reba Dosiye</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <WebView 
                source={{ uri: rawFileUrl }} 
                style={styles.webView}
                startInLoadingState
                renderLoading={() => <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}
                onError={() => (
                  <View style={[styles.pdfContainer, { backgroundColor: colors.secondary }]}>
                    <Feather name="alert-circle" size={40} color={colors.primary} />
                    <Text style={[styles.pdfText, { color: colors.foreground }]}>
                      Dosiye ntishobora kurangizwa. Kanda "Bika" kugira ngo uyishyire kuri telefoni.
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        )}

        <Text style={[styles.bodyText, { color: colors.foreground }]}>{item.description}</Text>

        <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderColor: colors.primary + "30" }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Ibi bisobanuro ni ibisigisho by'abaganga bo mu Rwanda mu buryo bwo kwitabira imirire myiza y'umwana.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Feather name="download" size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Bika</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.border }]} onPress={handleShare}>
            <Feather name="share-2" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Sangira</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "column",
    gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 12 },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  typePillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  duration: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)" },
  content: { padding: 20, gap: 16 },
  playerWrap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
  },
  playerInfo: { flex: 1, gap: 8 },
  playerLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  progressBar: { height: 4, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  timeText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  videoContainer: { height: 300, borderRadius: 12, overflow: "hidden", marginVertical: 8 },
  video: { width: "100%", height: "100%" },
  ageBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  ageBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  dot: { fontSize: 12 },
  divider: { height: 1 },
  webViewContainer: {
    height: 400,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginVertical: 8,
  },
  webView: { flex: 1 },
  pdfContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20, 
    borderRadius: 12 
  },
  pdfTitle: { 
    marginTop: 12, 
    fontSize: 16, 
    fontFamily: 'Inter_600SemiBold', 
    textAlign: 'center' 
  },
  pdfText: { 
    marginTop: 8, 
    textAlign: 'center', 
    fontSize: 14, 
    fontFamily: 'Inter_500Medium', 
    lineHeight: 22 
  },
  openPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 12
  },
  openPdfBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold'
  },
   androidPdfPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 12 },
   androidPdfText: { marginTop: 12, textAlign: 'center', fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 22 },
   loader: { position: "absolute", top: "50%", left: "50%", marginLeft: -15, marginTop: -15 },
  bodyText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24 },
  infoBox: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  actionText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
