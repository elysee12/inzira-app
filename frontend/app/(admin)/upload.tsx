import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
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

import { AppHeader } from "@/components/AppHeader";
import { useContent } from "@/context/ContentContext";
import { AGE_CATEGORIES } from "@/data/staticData";
import type { AgeGroup } from "@/data/staticData";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

type ContentType = "text" | "audio" | "video";

const ADMIN_COLOR = "#2980B9";

export default function UploadScreen() {
  const colors = useColors();
  const { userName, userId } = useAuth();
  const { addContent, ageCategories } = useContent();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<ContentType>("text");
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [duration, setDuration] = useState("");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const displayCategories = ageCategories.length > 0 ? ageCategories : AGE_CATEGORIES;

  const types: { type: ContentType; icon: string; label: string }[] = [
    { type: "text", icon: "file-text", label: "Inyandiko" },
    { type: "audio", icon: "headphones", label: "Audio" },
    { type: "video", icon: "play-circle", label: "Video" },
  ];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: selectedType === "text" ? ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] : 
              selectedType === "audio" ? "audio/*" : "video/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Ikibazo", "Guhitamo dosiye ntibyashobotse.");
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !selectedAge || !selectedFile) {
      Alert.alert("Ikibazo", "Uzuza amakuru yose asabwa: umutwe, ikiciro cy'umwana n'idosiye.");
      return;
    }
    
    setUploading(true);
    try {
      await addContent({
        title: title.trim(),
        description: description.trim() || title.trim(),
        type: selectedType,
        ageGroup: selectedAge,
        postedBy: userName || "Umuyobozi",
        postedById: userId || "1",
        duration: duration.trim() ? `${duration.trim()} ${selectedType === "text" ? "Amezi" : "Iminota"}` : "",
      }, selectedFile);

      setUploading(false);
      setTitle("");
      setDescription("");
      setSelectedAge(null);
      setDuration("");
      setSelectedFile(null);
      Alert.alert("Byagenze!", "Isomo ryongewe neza kandi ababyeyi barashobora kurireba.");
    } catch (error) {
      setUploading(false);
      Alert.alert("Ikibazo", "Isomo ntibyashobotse kuribika. Gerageza nanone.");
    }
  };

  const isReady = title.trim().length > 0 && selectedAge !== null && selectedFile !== null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Ongeraho Isomo" backgroundColor={ADMIN_COLOR} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Ubwoko bw'isomo <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View style={styles.typeRow}>
              {types.map((t) => (
                <TouchableOpacity
                  key={t.type}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: selectedType === t.type ? ADMIN_COLOR : colors.card,
                      borderColor: selectedType === t.type ? ADMIN_COLOR : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedType(t.type)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={t.icon as any}
                    size={20}
                    color={selectedType === t.type ? "#fff" : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: selectedType === t.type ? "#fff" : colors.foreground },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Umutwe w'isomo <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Injiza umutwe w'isomo"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>Ibisobanuro</Text>
            <View style={[styles.inputWrap, styles.textareaWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, styles.textarea, { color: colors.foreground }]}
                placeholder="Injiza ibisobanuro by'isomo (byihariwe)"
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Igihe isomo rimara (Amezi)
            </Text>
            <View style={[styles.inputWrap, { flexDirection: "row", alignItems: "center", borderColor: colors.border, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { flex: 1, color: colors.foreground }]}
                placeholder="Injiza umubare w'amezi"
                placeholderTextColor={colors.mutedForeground}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
              <Text style={{ color: colors.mutedForeground, marginLeft: 8 }}>Amezi</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Ikiciro cy'umwana <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <View style={styles.ageRow}>
              {displayCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.ageBtn,
                    {
                      backgroundColor: selectedAge === cat.id ? cat.color : cat.bgColor,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setSelectedAge(cat.id as AgeGroup)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.ageBtnText,
                      { color: selectedAge === cat.id ? "#fff" : cat.color },
                    ]}
                  >
                    {cat.label}{cat.sublabel ? ` ${cat.sublabel}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            onPress={pickDocument}
            activeOpacity={0.7}
            style={[styles.uploadBox, { borderColor: ADMIN_COLOR + "50", backgroundColor: "#EBF5FB" }]}
          >
            <Feather name={selectedFile ? "check-circle" : "upload-cloud"} size={36} color={selectedFile ? "#1A8A3A" : ADMIN_COLOR} />
            <Text style={[styles.uploadBoxText, { color: selectedFile ? "#1A8A3A" : ADMIN_COLOR }]}>
              {selectedFile ? selectedFile.name : (
                selectedType === "text"
                ? "Dosiye ya PDF / Word"
                : selectedType === "audio"
                ? "Dosiye ya MP3 / WAV"
                : "Dosiye ya MP4 / MOV"
              )}
            </Text>
            <Text style={[styles.uploadBoxSub, { color: colors.mutedForeground }]}>
              Porogaramu ibika dosiye zibitswe ku rubuga. Kanda kugira ngo uhitemo.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitBtn, 
              { 
                backgroundColor: isReady ? ADMIN_COLOR : colors.muted,
                opacity: uploading ? 0.7 : 1 
              }
            ]}
            onPress={handleUpload}
            disabled={uploading || !isReady}
            activeOpacity={0.85}
          >
            {uploading ? (
              <Text style={[styles.submitText, { color: "#fff" }]}>Birimo kubikwa...</Text>
            ) : (
              <>
                <Feather 
                  name="check-circle" 
                  size={18} 
                  color={isReady ? "#fff" : colors.mutedForeground} 
                />
                <Text style={[
                  styles.submitText, 
                  { color: isReady ? "#fff" : colors.mutedForeground }
                ]}>
                  Bika Isomo
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          {!isReady && !uploading && (
            <Text style={{ 
              color: "#ef4444", 
              fontSize: 12, 
              textAlign: "center", 
              marginTop: 8,
              fontFamily: "Inter_400Regular"
            }}>
              Uzuza insobe zose zisabwa (*) kugira ngo ubike.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 20, gap: 20 },
  section: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  typeBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  uploadBoxText: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  uploadBoxSub: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textareaWrap: { paddingVertical: 12 },
  input: { fontSize: 15, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 100, lineHeight: 22 },
  ageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  ageBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
