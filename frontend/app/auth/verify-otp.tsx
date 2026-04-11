import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { verifyOtp, sendOtp } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { email } = useLocalSearchParams<{
    email: string;
  }>();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const enteredOtp = digits.join("");

  const handleDigitChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    setError("");

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (enteredOtp.length < OTP_LENGTH) {
      setError("Injiza imibare yose 6 y'ikimenyetso.");
      return;
    }
    
    setLoading(true);
    const result = await verifyOtp(email, enteredOtp);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Ikimenyetso ntabwo ari cyo. Gerageza nanone.");
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return;
    }

    router.push({
      pathname: "/auth/reset-password",
      params: { email, otp: enteredOtp },
    });
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setError("");
    setLoading(true);
    const result = await sendOtp(email);
    setLoading(false);

    if (result.success) {
      setResendCooldown(60);
      setDigits(Array(OTP_LENGTH).fill(""));
      Alert.alert("Byagenze!", "Kode OTP nshya yoherejwe kuri imeli yawe.");
    } else {
      setError(result.error || "Gohereza kode OTP nshya ntibyashobotse.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emeza Kode OTP</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.iconWrap, { backgroundColor: "#E8F5EC" }]}>
            <Feather name="shield" size={40} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Injiza Kode OTP
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Kode OTP yoherejwe kuri:
          </Text>
          <Text style={[styles.emailText, { color: colors.primary }]}>
            {email}
          </Text>

          <View style={[styles.otpRow, shake && styles.shake]}>
            {Array(OTP_LENGTH).fill(0).map((_, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[
                  styles.otpBox,
                  {
                    borderColor: digits[i]
                      ? colors.primary
                      : error
                      ? "#ef4444"
                      : colors.border,
                    backgroundColor: digits[i] ? colors.secondary : colors.card,
                    color: colors.foreground,
                  },
                ]}
                maxLength={1}
                keyboardType="number-pad"
                value={digits[i]}
                onChangeText={(text) => handleDigitChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                selectTextOnFocus
              />
            ))}
          </View>

          {error !== "" && (
            <View style={[styles.errorBox, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}>
              <Feather name="x-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor: enteredOtp.length === OTP_LENGTH ? colors.primary : colors.muted,
              },
            ]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <Text style={styles.btnText}>Biragenzurwa...</Text>
            ) : (
              <>
                <Feather
                  name="check-circle"
                  size={18}
                  color={enteredOtp.length === OTP_LENGTH ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.btnText,
                    { color: enteredOtp.length === OTP_LENGTH ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  Emeza Kode
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: colors.mutedForeground }]}>
              Ntabwo wabuye kode?{" "}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || loading}>
              <Text
                style={[
                  styles.resendLink,
                  { color: resendCooldown > 0 ? colors.mutedForeground : colors.primary },
                ]}
              >
                {resendCooldown > 0 ? `Ohereza nanone (${resendCooldown}s)` : "Ohereza nanone"}
              </Text>
            </TouchableOpacity>
          </View>
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
  title: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emailText: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "center" },
  simulationBox: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    alignItems: "center",
  },
  simulationHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  simulationLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  simulationOtp: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: 8 },
  simulationNote: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 16 },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 4,
  },
  shake: {
    transform: [{ translateX: 4 }],
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    width: "100%",
  },
  errorText: { color: "#ef4444", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
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
  resendRow: { flexDirection: "row", alignItems: "center" },
  resendLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  resendLink: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
