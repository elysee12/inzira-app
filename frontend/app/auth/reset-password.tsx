import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { resetPassword } = useAuth();
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const getStrength = (pw: string): { level: number; label: string; color: string } => {
    if (pw.length === 0) return { level: 0, label: "", color: "transparent" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: "Yoroheje cyane", color: "#ef4444" };
    if (score === 2) return { level: 2, label: "Yoroheje", color: "#f59e0b" };
    if (score === 3) return { level: 3, label: "Irangwa", color: "#3b82f6" };
    return { level: 4, label: "Ikomeye cyane", color: "#22c55e" };
  };

  const strength = getStrength(password);

  const handleReset = async () => {
    setError("");
    if (password.length < 6) {
      setError("Ijambo ry'ibanga rigomba kuba rifite inyuguti nibura 6.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Amagambo y'ibanga ntahura. Gerageza nanone.");
      return;
    }
    setLoading(true);
    const result = await resetPassword(email, otp, password);
    setLoading(false);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error ?? "Hari ikibazo cyabaye.");
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successWrap, { paddingTop: topPad + 60 }]}>
          <View style={[styles.successCircle, { backgroundColor: colors.primary }]}>
            <Feather name="check" size={44} color="#fff" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Byahinduwe neza!
          </Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            Ijambo ry'ibanga ryawe ryahinduwe neza. Ubu ushobora kwinjira ukoresheje ijambo ry'ibanga rishya.
          </Text>
          <TouchableOpacity
            style={[styles.successBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/auth/login")}
            activeOpacity={0.85}
          >
            <Feather name="log-in" size={18} color="#fff" />
            <Text style={styles.successBtnText}>Injira Ubu</Text>
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
        <Text style={styles.headerTitle}>Ijambo Rishya ry'Ibanga</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="lock" size={40} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Shyiraho Ijambo Rishya ry'Ibanga
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Shyiraho ijambo ry'ibanga rikomeye n'iryo kwibuka neza.
          </Text>

          {error !== "" && (
            <View style={[styles.errorBox, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}>
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Ijambo Rishya ry'Ibanga <Text style={{ color: "#ef4444" }}>*</Text>
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

            {password.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((n) => (
                    <View
                      key={n}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            n <= strength.level ? strength.color : colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Emeza Ijambo ry'Ibanga <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrap,
                {
                  borderColor:
                    confirmPassword && confirmPassword !== password
                      ? "#ef4444"
                      : confirmPassword && confirmPassword === password
                      ? "#22c55e"
                      : colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            >
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Subiramo ijambo ry'ibanga"
                placeholderTextColor={colors.mutedForeground}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Feather name={showConfirm ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && (
              <View style={styles.matchRow}>
                <Feather
                  name={confirmPassword === password ? "check-circle" : "x-circle"}
                  size={14}
                  color={confirmPassword === password ? "#22c55e" : "#ef4444"}
                />
                <Text
                  style={[
                    styles.matchText,
                    { color: confirmPassword === password ? "#22c55e" : "#ef4444" },
                  ]}
                >
                  {confirmPassword === password ? "Amagambo ahura" : "Amagambo ntahura"}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.tipBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.primary }]}>
              Ijambo ry'ibanga rikomeye: imibare, inyuguti nkuru, ibishushanyo by'ibyapa, nibura inyuguti 8.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor:
                  password.length >= 6 && password === confirmPassword
                    ? colors.primary
                    : colors.muted,
              },
            ]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <Text style={[styles.btnText, { color: "#fff" }]}>Birimo kubikwa...</Text>
            ) : (
              <>
                <Feather
                  name="check-circle"
                  size={18}
                  color={password.length >= 6 && password === confirmPassword ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.btnText,
                    {
                      color:
                        password.length >= 6 && password === confirmPassword
                          ? "#fff"
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  Bika Ijambo Rishya ry'Ibanga
                </Text>
              </>
            )}
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
  content: { padding: 24, gap: 16, alignItems: "center" },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    width: "100%",
  },
  errorText: { color: "#ef4444", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  fieldGroup: { gap: 8, width: "100%" },
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
  strengthWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  strengthBars: { flexDirection: "row", gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  matchRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  matchText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  tipBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    width: "100%",
  },
  tipText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    width: "100%",
    marginTop: 4,
  },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  successWrap: { flex: 1, alignItems: "center", paddingHorizontal: 32, gap: 20 },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
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
