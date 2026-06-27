import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import apiClient from "@/context/apiClient";
import { useColors } from "@/hooks/useColors";
import LocationPicker from "@/components/LocationPicker";

interface CHW {
  id: number;
  name: string;
  email: string;
  phone: string;
  village?: string;
  createdAt: string;
  _count?: {
    assignedParents: number;
  };
}

export default function ManageCHWScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [chws, setCHWs] = useState<CHW[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCHW, setEditingCHW] = useState<CHW | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
  });

  useEffect(() => {
    fetchCHWs();
  }, []);

  const fetchCHWs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/chw");
      setCHWs(response.data);
    } catch (error) {
      Alert.alert("Ikosa", "Gufata CHW byanze.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCHW = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.village) {
      Alert.alert("Ikosa", "Uzuza ibisabwa byose.");
      return;
    }

    try {
      const response = await apiClient.post("/chw", formData);
      Alert.alert(
        "Byakozwe!",
        `CHW yashyizweho neza. Ijambo ry'ibanga ry'igihe gito: ${response.data.temporaryPassword}\n\nImeli yoherejwe kuri ${formData.email}`,
      );
      setModalVisible(false);
      resetForm();
      fetchCHWs();
    } catch (error: any) {
      Alert.alert("Ikosa", error.response?.data?.message || "Kurema CHW byanze.");
    }
  };

  const handleUpdateCHW = async () => {
    if (!editingCHW) return;

    try {
      await apiClient.put(`/chw/${editingCHW.id}`, formData);
      Alert.alert("Byakozwe!", "CHW yavuguruwe neza.");
      setModalVisible(false);
      setEditingCHW(null);
      resetForm();
      fetchCHWs();
    } catch (error: any) {
      Alert.alert("Ikosa", error.response?.data?.message || "Kuvugurura CHW byanze.");
    }
  };

  const handleDeleteCHW = (chw: CHW) => {
    Alert.alert(
      "Emeza Gusiba",
      `Uri gusiba ${chw.name}? Iyi ngingo ntishobora kugaruka.`,
      [
        { text: "Hagarika", style: "cancel" },
        {
          text: "Siba",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/chw/${chw.id}`);
              Alert.alert("Byakozwe!", "CHW yakuwemo neza.");
              fetchCHWs();
            } catch (error) {
              Alert.alert("Ikosa", "Gusiba CHW byanze.");
            }
          },
        },
      ],
    );
  };

  const openEditModal = (chw: CHW) => {
    setEditingCHW(chw);
    setFormData({
      name: chw.name,
      email: chw.email,
      phone: chw.phone,
      province: "",
      district: "",
      sector: "",
      cell: "",
      village: chw.village || "",
    });
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingCHW(null);
    resetForm();
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      province: "",
      district: "",
      sector: "",
      cell: "",
      village: "",
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Genzura CHW</Text>
        <TouchableOpacity onPress={openCreateModal} style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <Feather name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {chws.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nta bakozi b'ubuzima bahari
            </Text>
          </View>
        ) : (
          chws.map((chw) => (
            <View key={chw.id} style={[styles.chwCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.chwInfo}>
                <Text style={[styles.chwName, { color: colors.foreground }]}>{chw.name}</Text>
                <Text style={[styles.chwDetail, { color: colors.mutedForeground }]}>
                  <Feather name="mail" size={12} /> {chw.email}
                </Text>
                <Text style={[styles.chwDetail, { color: colors.mutedForeground }]}>
                  <Feather name="phone" size={12} /> {chw.phone}
                </Text>
                {chw.village && (
                  <Text style={[styles.chwDetail, { color: colors.mutedForeground }]}>
                    <Feather name="map-pin" size={12} /> {chw.village}
                  </Text>
                )}
                {chw._count && (
                  <Text style={[styles.chwDetail, { color: colors.primary }]}>
                    <Feather name="users" size={12} /> Ababyeyi: {chw._count.assignedParents}
                  </Text>
                )}
              </View>
              <View style={styles.chwActions}>
                <TouchableOpacity onPress={() => openEditModal(chw)} style={styles.actionButton}>
                  <Feather name="edit-2" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCHW(chw)} style={styles.actionButton}>
                  <Feather name="trash-2" size={20} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}> 
          <View style={[styles.modalContent, { backgroundColor: colors.background, maxHeight: "86%" }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingCHW ? "Hindura CHW" : "Ongeraho CHW"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={[styles.modalBodyContent, { paddingBottom: insets.bottom + 20 }]}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.label, { color: colors.foreground }]}>Izina *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Izina ryuzuye"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Imeli *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="imeli@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Telefoni *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="078XXXXXXX"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Aho akorera *</Text>
              <LocationPicker
                value={{
                  province: formData.province,
                  district: formData.district,
                  sector: formData.sector,
                  cell: formData.cell,
                  village: formData.village,
                }}
                onChange={(location) => setFormData({ ...formData, ...location })}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>Hagarika</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={editingCHW ? handleUpdateCHW : handleCreateCHW}
                  style={[styles.submitButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.submitButtonText}>{editingCHW ? "Bika" : "Ongeraho"}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    flex: 1,
    marginLeft: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  chwCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  chwInfo: {
    flex: 1,
  },
  chwName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  chwDetail: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  chwActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    paddingHorizontal: 0,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalBodyContent: {
    paddingTop: 4,
    paddingBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
