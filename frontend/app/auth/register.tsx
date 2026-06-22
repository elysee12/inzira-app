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
import LocationPicker from "@/components/LocationPicker";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState({
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
  });

  const handleRegister = async () => {
    setError("");
    if (!name.trim()) { Alert.alert("Ikitonderwa", "Injiza izina ryawe ryuzuye."); return; }
    if (!phone.trim() || phone.trim().length < 10) { Alert.alert("Ikitonderwa", "Injiza nimero ya telefoni yuzuye."); return; }
    if (!email.trim() || !email.includes("@")) { Alert.alert("Ikitonderwa", "Injiza imeli yuzuye kandi igenga neza."); return; }
    if (!location.village) { Alert.alert("Ikitonderwa", "Hitamo aho utuye (Intara → Umudugudu)."); return; }
    if (password.length < 6) { Alert.alert("Ikitonderwa", "Ijambo ry'ibanga rigomba kuba rifite inyuguti nibura 6."); return; }
    if (password !== confirmPassword) { Alert.alert("Ikitonderwa", "Amagambo y'ibanga ntahura. Gerageza nanone."); return; }

    setLoading(true);
    const result = await register(name.trim(), phone.trim(), email.trim(), password, location);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error ?? "Kwiyandikisha ntibyashobotse. Gerageza nanone.");
      Alert.alert("Ikibazo", result.error ?? "Kwiyandikisha ntibyashobotse. Gerageza nanone.");
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successWrap, { paddingTop: topPad + 60 }]}>
          <View style={[styles.successCircle, { backgroundColor: colors.primary }]}>
            <Feather name="check" size={40} color="#fff" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Konti yafunguwe!</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            Konti yawe nk'umubyeyi yafunguwe neza. Ubu ushobora kwinjira.
          </Text>
          <TouchableOpacity
            style={[styles.successBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/auth/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.successBtnText}>Injira Ubu</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fungura Konti</Text>
        <View style={{ width: 36 }} />
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
          <View style={[styles.infoBanner, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="users" size={16} color={colors.primary} />
            <Text style={[styles.infoBannerText, { color: colors.primary }]}>
              Iyandikisha rifunguriwe ababyeyi gusa. Abayobozi bahabwa konti n'ubuyobozi.
            </Text>
          </View>

          {error !== "" && (
            <View style={[styles.errorBox, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}>
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Izina ryuzuye <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Izina ry'umubyeyi"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Nimero ya telefoni <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="phone" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="07X XXX XXXX"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Imeli <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="urugero@gmail.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
              Imeli ikoreshwa gusa nk'aho ushobora gutura ijambo ry'ibanga wibagiwe.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Aho utuye <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View style={[styles.locationBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LocationPicker value={location} onChange={setLocation} />
            </View>
            <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
              Hitamo intara, akarere, umurenge, akagari n'umudugudu aho utuye.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Ijambo ry'ibanga <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Nibura inyuguti 6"
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

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Emeza ijambo ry'ibanga <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Subiramo ijambo ry'ibanga"
                placeholderTextColor={colors.mutedForeground}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPass}
              />
              <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
                <Feather name={showConfirmPass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <Text style={styles.registerBtnText}>Tegereza...</Text>
            ) : (
              <>
                <Feather name="user-plus" size={18} color="#fff" />
                <Text style={styles.registerBtnText}>Fungura Konti</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.replace("/auth/login")}>
            <Text style={[styles.loginLinkText, { color: colors.mutedForeground }]}>
              Usanzwe ufite konti?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Injira</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  form: { padding: 24, gap: 16 },
  infoBanner: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoBannerText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },
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
  fieldHint: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
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
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  registerBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  loginLink: { alignSelf: "center" },
  loginLinkText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  locationBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
  },
  successWrap: { flex: 1, alignItems: "center", paddingHorizontal: 32, gap: 20 },
  successCircle: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 23 },
  successBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 14,
    marginTop: 12,
  },
  successBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
