import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function IndexScreen() {
  const { role, isLoaded } = useAuth();
  const colors = useColors();

  useEffect(() => {
    if (!isLoaded) return;
    if (role === "admin") {
      router.replace("/(admin)/dashboard");
    } else if (role === "parent") {
      router.replace("/(parent)/home");
    } else if (role === "chw") {
      router.replace("/(chw)/home");
    } else {
      router.replace("/onboarding");
    }
  }, [role, isLoaded]);

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
