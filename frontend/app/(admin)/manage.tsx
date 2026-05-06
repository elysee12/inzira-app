import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import {
  Alert,
  FlatList,
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
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { useContent } from "@/context/ContentContext";
import { AGE_CATEGORIES, CONTENT_DATA } from "@/data/staticData";
import type { AgeGroup, ContentItem } from "@/data/staticData";
import { useColors } from "@/hooks/useColors";
import { getImageUrl } from "@/context/apiClient";

const ADMIN_COLOR = "#2980B9";
const ALL_FILTER = "all";
type Filter = AgeGroup | typeof ALL_FILTER;

const TYPE_ICONS: Record<ContentItem["type"], string> = {
  text: "file-text",
  audio: "headphones",
  video: "play-circle",
};
const TYPE_COLORS: Record<ContentItem["type"], string> = {
  text: "#1A8A3A",
  audio: "#8E44AD",
  video: "#2980B9",
};

export default function ManageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { allContent, deleteContent, editContent } = useContent();
  const [activeFilter, setActiveFilter] = useState<Filter>(ALL_FILTER);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAge, setEditAge] = useState<AgeGroup>("0-6");
  const [editType, setEditType] = useState<ContentItem["type"]>("text");
  const [newFile, setNewFile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewText, setPreviewText] = useState<string | undefined>(undefined);

  const filters = [
    { id: ALL_FILTER, label: "Byose" },
    ...AGE_CATEGORIES.map((c) => ({
      id: c.id,
      label: (c as any).sublabel ? `${c.label} ${(c as any).sublabel}` : c.label,
    })),
  ];

  const filtered =
    activeFilter === ALL_FILTER
      ? allContent
      : allContent.filter((c) => c.ageGroup === activeFilter);

  const isStatic = (id: string) => !!CONTENT_DATA.find((c) => c.id === id);

  const openEdit = (item: ContentItem) => {
    if (isStatic(item.id)) {
      Alert.alert("Ntishoboka", "Amasomo ya sisitemu ntashobora guhindurwa.");
      return;
    }
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDesc(item.description);
    setEditAge(item.ageGroup);
    setEditType(item.type);
    setNewFile(null);
    setEditError("");
  };

  const pickNewFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: editType === "text" ? ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] : 
              editType === "audio" ? "audio/*" : "video/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setNewFile(result.assets[0]);
      }
    } catch (err) {
      setEditError("Guhitamo dosiye ntibyashobotse.");
    }
  };

  const handleDeleteFile = () => {
    Alert.alert(
      "Siba Dosiye",
      "Dosiye nzira yabitswe ntishobora guhindurwa. Urifuza gusiba?",
      [
        { text: "Oya", style: "cancel" },
        { text: "Siba", style: "destructive", onPress: () => setNewFile(null) },
      ]
    );
  };

  const handlePreview = (url: string, title: string, text?: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setPreviewText(text);
    setPreviewVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) { setEditError("Umutwe w'isomo usabwa."); return; }
    if (!editingItem) return;
    setSaving(true);
    const result = await editContent(editingItem.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || editTitle.trim(),
      ageGroup: editAge,
      type: editType,
    }, newFile);
    setSaving(false);
    if (result.success) {
      Alert.alert("Byagenze neza", "Isomo ryahindurwa neza!");
      setEditingItem(null);
      setNewFile(null);
    } else {
      setEditError(result.error ?? "Hari ikibazo cyabaye.");
    }
  };

  const handleDelete = (item: ContentItem) => {
    if (isStatic(item.id)) {
      Alert.alert("Ntishoboka", "Amasomo ya sisitemu ntashobora gusibwa.");
      return;
    }
    Alert.alert(
      "Siba isomo",
      `Urifuza gusiba "${item.title}"?`,
      [
        { text: "Oya", style: "cancel" },
        {
          text: "Siba",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContent(item.id);
              Alert.alert("Byagenze neza", "Isomo ryasibwe neza!");
            } catch (error: any) {
              Alert.alert("Ikibazo", error.message || "Nti byashobotse gusiba isomo.");
            }
          }
        },
      ]
    );
  };

  const typeOptions: { type: ContentItem["type"]; icon: string; label: string }[] = [
    { type: "text", icon: "file-text", label: "Inyandiko" },
    { type: "audio", icon: "headphones", label: "Audio" },
    { type: "video", icon: "play-circle", label: "Video" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Genzura Amasomo" backgroundColor={ADMIN_COLOR} />

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              styles.filterChip,
              {
                backgroundColor: activeFilter === f.id ? ADMIN_COLOR : colors.card,
                borderColor: activeFilter === f.id ? ADMIN_COLOR : colors.border,
              },
            ]}
            onPress={() => setActiveFilter(f.id as Filter)}
          >
            <Text style={[styles.filterLabel, { color: activeFilter === f.id ? "#fff" : colors.mutedForeground }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nta masomo abonetse</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: TYPE_COLORS[item.type] + "20" }]}>
              <Feather name={TYPE_ICONS[item.type] as any} size={18} color={TYPE_COLORS[item.type]} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                {item.ageGroup} amezi • {typeof item.postedBy === 'object' ? item.postedBy.name : item.postedBy}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <TouchableOpacity onPress={() => router.push({
                pathname: "/(admin)/content-viewer/[id]",
                params: { id: item.id },
              })} style={styles.actionButton}>
                <Feather name="eye" size={18} color={ADMIN_COLOR} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionButton}>
                <Feather name="edit-2" size={18} color={ADMIN_COLOR} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
                <Feather name="trash-2" size={18} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Edit Modal */}
      <Modal visible={!!editingItem} animationType="slide" transparent onRequestClose={() => setEditingItem(null)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKav}
          >
            <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Hindura Isomo</Text>
                <TouchableOpacity onPress={() => setEditingItem(null)}>
                  <Feather name="x" size={22} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.modalContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {editError !== "" && (
                  <View style={[styles.errorBox, { backgroundColor: "#FEE2E2", borderColor: "#FECACA" }]}>
                    <Feather name="alert-circle" size={13} color="#ef4444" />
                    <Text style={styles.errorText}>{editError}</Text>
                  </View>
                )}

                <View style={styles.modalField}>
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Ubwoko bw'isomo</Text>
                  <View style={styles.typeRow}>
                    {typeOptions.map((t) => (
                      <TouchableOpacity
                        key={t.type}
                        style={[
                          styles.typeBtn,
                          {
                            backgroundColor: editType === t.type ? ADMIN_COLOR : colors.card,
                            borderColor: editType === t.type ? ADMIN_COLOR : colors.border,
                          },
                        ]}
                        onPress={() => setEditType(t.type)}
                      >
                        <Feather name={t.icon as any} size={16} color={editType === t.type ? "#fff" : colors.mutedForeground} />
                        <Text style={[styles.typeBtnText, { color: editType === t.type ? "#fff" : colors.foreground }]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalField}>
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>
                    Umutwe w'isomo <Text style={{ color: "#ef4444" }}>*</Text>
                  </Text>
                  <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      value={editTitle}
                      onChangeText={setEditTitle}
                      placeholder="Umutwe w'isomo"
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                </View>

                <View style={styles.modalField}>
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Ibisobanuro</Text>
                  <View style={[styles.inputWrap, styles.textareaWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <TextInput
                      style={[styles.input, styles.textarea, { color: colors.foreground }]}
                      value={editDesc}
                      onChangeText={setEditDesc}
                      placeholder="Ibisobanuro by'isomo"
                      placeholderTextColor={colors.mutedForeground}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                <View style={styles.modalField}>
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>Ikiciro cy'umwana</Text>
                  <View style={styles.ageRow}>
                    {AGE_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.ageBtn,
                          {
                            backgroundColor: editAge === cat.id ? cat.color : cat.bgColor,
                            borderColor: cat.color,
                          },
                        ]}
                        onPress={() => setEditAge(cat.id)}
                      >
                        <Text style={[styles.ageBtnText, { color: editAge === cat.id ? "#fff" : cat.color }]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Current File Display */}
                {editingItem?.fileUrl && (
                  <View style={[styles.modalField, { backgroundColor: colors.card, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }]}>
                    <Text style={[styles.modalLabel, { color: colors.foreground, marginBottom: 8 }]}>Dosiye Nzira</Text>
                    <View style={styles.fileDisplayRow}>
                      <Feather name={editType === "text" ? "file-text" : editType === "audio" ? "headphones" : "play-circle"} size={20} color={ADMIN_COLOR} />
                      <View style={styles.fileInfo}>
                        <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>
                          {editingItem.fileUrl.split('/').pop() || 'Dosiye'}
                        </Text>
                        <Text style={[styles.fileType, { color: colors.mutedForeground }]}>{editType}</Text>
                      </View>
                      {editType === "text" && (
                        <TouchableOpacity 
                          onPress={() => handlePreview(getImageUrl(editingItem.fileUrl), editingItem.title, editingItem.textContent)}
                          style={[styles.previewBadge, { backgroundColor: ADMIN_COLOR + "20" }]}
                        >
                          <Feather name="eye" size={14} color={ADMIN_COLOR} />
                          <Text style={[styles.previewBadgeText, { color: ADMIN_COLOR }]}>Soma</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* New File Selection */}
                <View style={styles.modalField}>
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>
                    {editingItem?.fileUrl ? "Hindura Dosiye" : "Ongeraho Dosiye"}
                  </Text>
                  {newFile ? (
                    <View style={[styles.selectedFileBox, { backgroundColor: "#EBF5FB", borderColor: ADMIN_COLOR }]}>
                      <Feather name="check-circle" size={18} color={ADMIN_COLOR} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={[styles.selectedFileName, { color: ADMIN_COLOR }]} numberOfLines={1}>
                          {newFile.name}
                        </Text>
                        {editType === "text" && (
                          <TouchableOpacity onPress={() => handlePreview(newFile.uri, newFile.name)}>
                            <Text style={{ fontSize: 11, color: ADMIN_COLOR, textDecorationLine: 'underline' }}>
                              Kureba mbere yo kubika
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <TouchableOpacity onPress={handleDeleteFile}>
                        <Feather name="x" size={18} color={ADMIN_COLOR} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.pickFileBtn, { borderColor: ADMIN_COLOR, backgroundColor: ADMIN_COLOR + "10" }]}
                      onPress={pickNewFile}
                    >
                      <Feather name="upload" size={18} color={ADMIN_COLOR} />
                      <Text style={[styles.pickFileBtnText, { color: ADMIN_COLOR }]}>
                        {editingItem?.fileUrl ? "Guhitamo Dosiye Nshya" : "Guhitamo Dosiye"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setEditingItem(null)}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Reka</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: ADMIN_COLOR }]}
                    onPress={handleSaveEdit}
                    disabled={saving}
                  >
                    {saving ? (
                      <Text style={styles.saveBtnText}>Birimo...</Text>
                    ) : (
                      <>
                        <Feather name="check" size={16} color="#fff" />
                        <Text style={styles.saveBtnText}>Bika</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <DocumentPreviewModal
          visible={previewVisible}
          onClose={() => setPreviewVisible(false)}
          fileUrl={previewUrl}
          title={previewTitle}
          textContent={previewText}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexWrap: "wrap" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  empty: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  rowIcon: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, gap: 3 },
  rowTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  newBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  newBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  rowMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  rowActions: { flexDirection: "row", gap: 6 },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#EBF5FB"
  },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalKav: { justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalContent: { padding: 20, gap: 16, paddingBottom: 32 },
  errorBox: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, gap: 8 },
  errorText: { color: "#ef4444", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  modalField: { gap: 8 },
  modalLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, gap: 6 },
  typeBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  inputWrap: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  textareaWrap: { paddingVertical: 10 },
  input: { fontSize: 14, fontFamily: "Inter_400Regular" },
  textarea: { minHeight: 80, lineHeight: 20 },
  ageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ageBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  ageBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, alignItems: "center" },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  saveBtn: { flex: 1, flexDirection: "row", paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 6 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  // File Management
  fileDisplayRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  fileInfo: { flex: 1, gap: 2 },
  fileName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fileType: { fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  previewBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  previewBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  selectedFileBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  selectedFileName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  pickFileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  pickFileBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
