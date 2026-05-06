import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useContent } from "@/context/ContentContext";
import { useColors } from "@/hooks/useColors";
import type { AgeCategory } from "@/data/staticData";
import { getImageUrl } from "@/context/apiClient";

const ADMIN_COLOR = "#2980B9";

export default function ManageCategoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { ageCategories, editAgeCategory, isLoaded } = useContent();
  
  const [editingCategory, setEditingCategory] = useState<AgeCategory | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newImage, setNewImage] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const openEdit = (category: AgeCategory) => {
    setEditingCategory(category);
    setEditLabel(category.label);
    setEditDescription(category.description);
    setNewImage(null);
    setEditError("");
  };

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setNewImage(result.assets[0]);
      }
    } catch (err) {
      setEditError("Guhitamo ifoto ntibyashobotse.");
    }
  };

  const handleSave = async () => {
    if (!editLabel.trim()) {
      setEditError("Izina ry'ikiciro rirasabwa.");
      return;
    }
    if (!editingCategory) return;

    setSaving(true);
    const result = await editAgeCategory(editingCategory.id, {
      label: editLabel.trim(),
      description: editDescription.trim(),
    }, newImage);
    
    setSaving(false);
    if (result.success) {
      Alert.alert("Byagenze neza", "Ikiciro cy'umwana ryahinduwe neza!");
      setEditingCategory(null);
    } else {
      setEditError(result.error || "Hari ikibazo cyabaye.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Genzura Imyaka" showBack backgroundColor={ADMIN_COLOR} />

      {!isLoaded ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ADMIN_COLOR} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Biri gufunguka...</Text>
        </View>
      ) : (
        <FlatList
          data={ageCategories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 80 }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openEdit(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={[styles.imageContainer, { backgroundColor: item.bgColor }]}>
                  {item.imageUrl ? (
                    <Image 
                      source={{ uri: getImageUrl(item.imageUrl) }} 
                      style={styles.cardImage} 
                    />
                  ) : (
                    <Feather name="image" size={24} color={item.color} />
                  )}
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {item.label} {item.sublabel}
                  </Text>
                  <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <Feather name="edit-2" size={18} color={ADMIN_COLOR} />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="info" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Nta byiciro by'imyaka byabonetse.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!editingCategory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingCategory(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Hindura Ikiciro
              </Text>
              <TouchableOpacity onPress={() => setEditingCategory(null)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Izina (Ikiciro)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  value={editLabel}
                  onChangeText={setEditLabel}
                  placeholder="E.g. 0 - 6"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Ibisobanuro (Imirire)</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border },
                  ]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Andika ibisobanuro hano..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Ifoto</Text>
                <TouchableOpacity
                  style={[styles.imagePicker, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={pickImage}
                >
                  {newImage ? (
                    <Image source={{ uri: newImage.uri }} style={styles.previewImage} />
                  ) : editingCategory?.imageUrl ? (
                    <Image source={{ uri: getImageUrl(editingCategory.imageUrl) }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Feather name="camera" size={32} color={colors.mutedForeground} />
                      <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>Hitamo ifoto</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: ADMIN_COLOR, opacity: saving ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? "Biri kubikwa..." : "Bika Impinduka"}</Text>
              </TouchableOpacity>
              
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: "100%" },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalForm: { gap: 20 },
  inputGroup: { gap: 8, marginBottom: 16 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  imagePicker: {
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#E74C3C", fontSize: 14, marginBottom: 16, textAlign: "center" },
  saveBtn: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
