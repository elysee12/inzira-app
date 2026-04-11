import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

interface Slide {
  id: string;
  image: any;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    id: "1",
    image: require("../assets/images/age_0_6.png"),
    title: "Murakaza neza kuri Inzira",
    subtitle:
      "Iyi porogaramu ifasha ababyeyi kumenya imirire myiza kuri abana babo kuva ku kuvuka kugeza ku myaka 5.",
  },
  {
    id: "2",
    image: require("../assets/images/age_13_24.png"),
    title: "Inyigisho z'imirire zogezwa kuri ubundi",
    subtitle:
      "Abaganga n'inzobere mu buzima bw'umwana baratwinjiramo inyigisho z'imirire zerekeye urugendo rw'umwana wawe.",
  },
  {
    id: "3",
    image: require("../assets/images/age_25_59.png"),
    title: "Umwana wawe akura neza",
    subtitle:
      "Gukurikirana imikurire y'umwana wawe no kumufasha gutera imbere mu buryo bwiza binyuze ku inyigisho zihuje n'imyaka ye.",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace("/auth/login");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Feather name="heart" size={18} color="#fff" />
        </View>
        <Text style={[styles.appName, { color: colors.primary }]}>Inzira</Text>
        <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace("/auth/login")}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Reka</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.imageWrap, { backgroundColor: colors.secondary }]}>
              <Image source={item.image} style={styles.slideImage} contentFit="contain" />
            </View>
            <View style={styles.slideText}>
              <Text style={[styles.slideTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.slideSubtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.bottom, { paddingBottom: bottomPad + 24 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentIndex ? colors.primary : colors.border, width: i === currentIndex ? 24 : 8 },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          onPress={goNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {currentIndex === SLIDES.length - 1 ? "Tangira" : "Komeza"}
          </Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  logo: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 20, fontFamily: "Inter_700Bold", flex: 1 },
  skipBtn: { padding: 8 },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  slide: { alignItems: "center", paddingHorizontal: 24 },
  imageWrap: { width: width - 48, height: 280, borderRadius: 24, overflow: "hidden", marginBottom: 32, alignItems: "center", justifyContent: "center" },
  slideImage: { width: "100%", height: "100%" },
  slideText: { alignItems: "center", gap: 12 },
  slideTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center", lineHeight: 32 },
  slideSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24, paddingHorizontal: 8 },
  bottom: { paddingHorizontal: 24, gap: 24, alignItems: "center" },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 8, width: "100%", justifyContent: "center", paddingVertical: 16, borderRadius: 14 },
  nextBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
