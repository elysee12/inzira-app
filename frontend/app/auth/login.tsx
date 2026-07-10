import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, role } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Ikitonderwa", "Uzuza imeli cyangwa nimero ya telefoni n'ijambo ry'ibanga.");
      return;
    }
    
    setLoading(true);
    const result = await login(identifier.trim(), password);
    setLoading(false);

    if (result.success) {
      if (result.role === "admin" || result.role === "nurse") {
        router.replace("/(admin)/dashboard");
      } else if (result.role === "chw") {
        router.replace("/(chw)/home");
      } else {
        router.replace("/(parent)/home");
      }
    } else {
      Alert.alert("Ikibazo", result.error ?? "Injira ntibyashobotse. Gerageza nanone.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerSection, { paddingTop: topPad + 16, backgroundColor: colors.primary }]}>
        <View style={styles.logoWrap}>
          <View style={[styles.logoCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Feather name="heart" size={30} color="#fff" />
          </View>
        </View>
        <Text style={styles.appTitle}>Imirire</Text>
        <Text style={styles.appSubtitle}>Uburezi bw'Umwana</Text>
        <View style={styles.waveBottom} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: bottomPad + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Injira mu konti yawe</Text>
          <Text style={[styles.formSub, { color: colors.mutedForeground }]}>
            Injiza imeli cyangwa nimero ya telefoni n'ijambo ry'ibanga
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Imeli cyangwa Nimero ya telefoni</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="urugero@imirire.rw cyangwa 07X XXX XXXX"
                placeholderTextColor={colors.mutedForeground}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="default"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>Ijambo ry'ibanga</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Injiza ijambo ry'ibanga"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Feather name={showPass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <Text style={styles.loginBtnText}>Tegereza...</Text>
            ) : (
              <>
                <Text style={styles.loginBtnText}>Injira</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push("/auth/forgot-password")}
          >
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Wibagiwe ijambo ry'ibanga?
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>cyangwa</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, { borderColor: colors.primary }]}
            onPress={() => router.push("/auth/register")}
            activeOpacity={0.8}
          >
            <Feather name="user-plus" size={18} color={colors.primary} />
            <Text style={[styles.registerBtnText, { color: colors.primary }]}>
              Fungura konti nshya (Umubyeyi)
            </Text>
          </TouchableOpacity>

          <View style={[styles.adminHint, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="info" size={13} color={colors.mutedForeground} />
            <Text style={[styles.adminHintText, { color: colors.mutedForeground }]}>
              Abayobozi bakoresheje nomero n'ijambo ry'ibanga byabahereywe. Injira neza kugira ngo ugere ku imicungire y'umuyobozi.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoWrap: { marginBottom: 12 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  appSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 4, marginBottom: 20 },
  waveBottom: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: "#F5FBF6",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  form: { padding: 24, gap: 16 },
  formTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  formSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 4 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  errorText: { color: "#ef4444", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  loginBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  registerBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  adminHint: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  adminHintText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17 },
});
