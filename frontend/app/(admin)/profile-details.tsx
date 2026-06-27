import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const ADMIN_COLOR = "#2980B9";

export default function AdminMyProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, userPhone, updateUser } = useAuth();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState(userPhone);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(userName);
    setPhone(userPhone);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }, [userName, userPhone]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Ikitonderwa", "Izina rirabura.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Ikitonderwa", "Nimero ya telefoni irabura.");
      return;
    }
    if (password && password.length < 6) {
      Alert.alert("Ikitonderwa", "Ijambo ry'ibanga rigomba kuba ririho nibura inyuguti 6.");
      return;
    }
    if (password && password !== confirmPassword) {
      Alert.alert("Ikitonderwa", "Amagambo y'ibanga ntabwo ahura.");
      return;
    }

    setSaving(true);
    const updateData: any = {
      name: name.trim(),
      phone: phone.trim(),
    };
    if (email.trim()) {
      updateData.email = email.trim();
    }
    if (password.trim()) {
      updateData.password = password.trim();
    }

    const result = await updateUser(updateData);
    setSaving(false);

    if (result.success) {
      Alert.alert("Byagenze neza", "Amakuru yawe yahinduwe neza!");
      router.back();
    } else {
      Alert.alert("Ikibazo", result.error || "Guhindura amakuru ntibyashobotse.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <AppHeader title="Umwirondoro wanjye" backgroundColor={ADMIN_COLOR} showBack />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: ADMIN_COLOR + "15" }]}> 
          <View style={[styles.avatar, { backgroundColor: ADMIN_COLOR }]}> 
            <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : "A"}</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{name || "Umuyobozi"}</Text>
          <View style={[styles.rolePill, { backgroundColor: ADMIN_COLOR }]}> 
            <Feather name="shield" size={12} color="#fff" />
            <Text style={styles.rolePillText}>Umuyobozi</Text>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hindura amakuru yawe</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Izina ryuzuye</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}> 
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="Izina ryawe"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Nimero ya telefoni</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}> 
              <Feather name="phone" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="07X XXX XXXX"
                keyboardType="phone-pad"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Imeli (ishobora kuba isha)</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}> 
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={email}
                onChangeText={setEmail}
                placeholder="example@domain.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Ijambo ry'ibanga (bishyiraho niba ugiye guhindura)</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}> 
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Ijambo rishya ry'ibanga"
                secureTextEntry={!showPassword}
                placeholderTextColor={colors.mutedForeground}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>Emeza ijambo ry'ibanga</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}> 
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Emeza ijambo rishya"
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor={colors.mutedForeground}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)}>
                <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: ADMIN_COLOR, opacity: saving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? "Birimo kubikwa..." : "Bika impinduka"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  infoCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  name: { fontSize: 20, fontFamily: "Inter_700Bold" },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  rolePillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  field: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
