import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useContent } from "@/context/ContentContext";
import { useColors } from "@/hooks/useColors";
import apiClient from "@/context/apiClient";

const ADMIN_COLOR = "#2980B9";

type ModalType =
  | null
  | "profile"
  | "parents"
  | "report"
  | "settings"
  | "notifications"
  | "help";

type FilterPeriod = "all" | "week" | "month" | "custom";

export default function AdminProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userName, userPhone, logout } = useAuth();
  const { allContent } = useContent();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [filteredParents, setFilteredParents] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, byRole: { ADMIN: 0, PARENT: 0 }, byDate: 0 });

  // Parent Management State
  const [editingParent, setEditingParent] = useState<any>(null);
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [savingParent, setSavingParent] = useState(false);

  useEffect(() => {
    if (activeModal === "parents") {
      fetchParents();
    }
  }, [activeModal]);

  useEffect(() => {
    applyFilter();
  }, [parents, filterPeriod]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/by-role?role=PARENT').catch(() => ({ data: [] }));
      setParents(response.data || []);
      
      // Fetch stats
      const statsResponse = await apiClient.get('/users/stats?role=PARENT').catch(() => ({ 
        data: { total: 0, byRole: { ADMIN: 0, PARENT: 0 }, byDate: 0 } 
      }));
      setStats(statsResponse.data || { total: 0, byRole: { ADMIN: 0, PARENT: 0 }, byDate: 0 });
    } catch (error) {
      // Silently fail and keep default values
      setParents([]);
      setStats({ total: 0, byRole: { ADMIN: 0, PARENT: 0 }, byDate: 0 });
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = parents;

    if (filterPeriod === "week") {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = parents.filter(p => new Date(p.createdAt) >= sevenDaysAgo);
    } else if (filterPeriod === "month") {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = parents.filter(p => new Date(p.createdAt) >= thirtyDaysAgo);
    }

    setFilteredParents(filtered);
  };

  const handleDeleteParent = async (parent: any) => {
    Alert.alert(
      "Siba Umubyeyi",
      `Urifuza gusiba ${parent.name}? Ibi ntibishobora gusubirwamo.`,
      [
        { text: "Reka", style: "cancel" },
        {
          text: "Siba",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/users/${parent.id}`);
              Alert.alert("Byagenze neza", "Umubyeyi yasibwe neza!");
              fetchParents();
            } catch (error: any) {
              Alert.alert("Ikibazo", error.response?.data?.message || "Gusiba umubyeyi ntibyashobotse.");
            }
          },
        },
      ]
    );
  };

  const handleEditParent = (parent: any) => {
    setEditingParent(parent);
    setParentName(parent.name);
    setParentPhone(parent.phone);
    setParentEmail(parent.email);
  };

  const handleSaveParentEdit = async () => {
    if (!parentName.trim() || !parentPhone.trim() || !parentEmail.trim()) {
      Alert.alert("Ikitonderwa", "Uzuza amakuru yose.");
      return;
    }

    setSavingParent(true);
    try {
      await apiClient.patch(`/users/${editingParent.id}`, {
        name: parentName.trim(),
        phone: parentPhone.trim(),
        email: parentEmail.trim(),
      });
      Alert.alert("Byagenze neza", "Amakuru y'umubyeyi yahinduwe neza!");
      setEditingParent(null);
      fetchParents();
    } catch (error: any) {
      Alert.alert("Ikibazo", error.response?.data?.message || "Guhindura amakuru ntibyashobotse.");
    } finally {
      setSavingParent(false);
    }
  };

  const textCount = allContent.filter((c) => c.type === "text").length;
  const audioCount = allContent.filter((c) => c.type === "audio").length;
  const videoCount = allContent.filter((c) => c.type === "video").length;

  const menuItems = [
    {
      icon: "user",
      label: "Umwirondoro wanjye",
      sublabel: userPhone || "Reba amakuru yawe",
      action: () => router.push("/(admin)/profile-details"),
      modal: "profile" as ModalType,
    },
    { icon: "users", label: "Genzura Ababyeyi", sublabel: `${parents.length || "..."} ababyeyi`, modal: "parents" as ModalType },
    { icon: "bar-chart-2", label: "Raporo", sublabel: "Reba imikorere", modal: "report" as ModalType },
    { icon: "settings", label: "Igenamiterere", sublabel: "Hindura igenamiterere", modal: "settings" as ModalType },
    { icon: "bell", label: "Amatangazo", sublabel: notifEnabled ? "Byifunguye" : "Bifunzwe", modal: "notifications" as ModalType },
    { icon: "help-circle", label: "Ubufasha", sublabel: "Twandikire", modal: "help" as ModalType },
  ];

  const renderModalContent = () => {
    switch (activeModal) {
      case "profile":
        return (
          <>
            <View style={[styles.infoCard, { backgroundColor: ADMIN_COLOR + "15" }]}>
              <View style={[styles.bigAvatar, { backgroundColor: ADMIN_COLOR }]}>
                <Text style={styles.bigAvatarText}>{userName ? userName[0].toUpperCase() : "A"}</Text>
              </View>
              <Text style={[styles.infoName, { color: colors.foreground }]}>{userName || "Umuyobozi"}</Text>
              <View style={[styles.rolePill, { backgroundColor: ADMIN_COLOR }]}>
                <Feather name="shield" size={12} color="#fff" />
                <Text style={styles.rolePillText}>Umuyobozi</Text>
              </View>
            </View>
            <InfoRow icon="phone" label="Telefoni" value={userPhone || "N/A"} colors={colors} />
            <InfoRow icon="mail" label="Imeli" value="admin@imirire.rw" colors={colors} />
            <InfoRow icon="calendar" label="Yinjiye" value="Mutarama 2025" colors={colors} />
            <InfoRow icon="lock" label="Ingereka" value="Umuyobozi Mukuru" colors={colors} />
            <View
              style={[
                styles.infoBox,
                { backgroundColor: colors.secondary, borderColor: colors.border, marginTop: 12 },
              ]}
            >
              <Feather name="info" size="14" color={colors.primary} />
              <Text style={[styles.infoBoxText, { color: colors.primary }]}>
                Kugira ngo uhindure amakuru yawe, tuhuze na support@imirire.rw.
              </Text>
            </View>
          </>
        );

      case "parents":
        return (
          <>
            {/* Overview Section */}
            <View style={[styles.overviewCard, { backgroundColor: ADMIN_COLOR + "10", borderColor: ADMIN_COLOR + "30" }]}>
              <Text style={[styles.overviewTitle, { color: ADMIN_COLOR }]}>Ikiciro cy'Ababyeyi</Text>
              <View style={styles.overviewStats}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: ADMIN_COLOR }]}>{stats.total}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Byose</Text>
                </View>
                <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: ADMIN_COLOR + "30" }]}>
                  <Text style={[styles.statValue, { color: ADMIN_COLOR }]}>{filteredParents.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Igice kinini</Text>
                </View>
              </View>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              {(["all", "week", "month"] as FilterPeriod[]).map((period) => (
                <TouchableOpacity
                  key={period}
                  onPress={() => setFilterPeriod(period)}
                  style={[
                    styles.filterBtn,
                    filterPeriod === period
                      ? { backgroundColor: ADMIN_COLOR }
                      : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      filterPeriod === period
                        ? { color: "#fff" }
                        : { color: colors.foreground },
                    ]}
                  >
                    {period === "all" ? "Byose" : period === "week" ? "Icyumweru" : "Ukwezi"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Parents List */}
            {loading ? (
              <View style={styles.loadingView}>
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Birimo gushaka...
                </Text>
              </View>
            ) : filteredParents.length === 0 ? (
              <View style={styles.emptyModal}>
                <Feather name="users" size={40} color={colors.mutedForeground} />
                <Text
                  style={[styles.emptyModalText, { color: colors.mutedForeground }]}
                >
                  Nta mubyeyi wiyandikishije
                </Text>
              </View>
            ) : (
              <>
                <View style={[styles.statPill, { backgroundColor: ADMIN_COLOR + "15" }]}>
                  <Text style={[styles.statPillNum, { color: ADMIN_COLOR }]}>
                    {filteredParents.length}
                  </Text>
                  <Text style={[styles.statPillLabel, { color: ADMIN_COLOR }]}>
                    Ababyeyi mu gice kinini
                  </Text>
                </View>
                {filteredParents.map((p, i) => (
                  <View
                    key={i}
                    style={[
                      styles.parentRow,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.parentAvatar,
                        { backgroundColor: ADMIN_COLOR + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.parentAvatarText,
                          { color: ADMIN_COLOR },
                        ]}
                      >
                        {p.name[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.parentName, { color: colors.foreground }]}
                      >
                        {p.name}
                      </Text>
                      <Text
                        style={[
                          styles.parentMeta,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {p.phone} • {p.email}
                      </Text>
                      <Text
                        style={[
                          styles.parentDate,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {new Date(p.createdAt).toLocaleDateString("rw-RW")}
                      </Text>
                    </View>
                    <View style={styles.parentActions}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                        onPress={() => handleEditParent(p)}
                      >
                        <Feather name="edit-2" size={14} color={ADMIN_COLOR} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: "#FEE2E2" }]}
                        onPress={() => handleDeleteParent(p)}
                      >
                        <Feather name="trash-2" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        );

      case "report":
        return (
          <>
            <Text style={[styles.reportSub, { color: colors.mutedForeground }]}>
              Imikorere y'ikoranabuhanga kuri uyu munsi
            </Text>
            <View style={styles.reportGrid}>
              {[
                {
                  label: "Inyandiko",
                  value: textCount,
                  color: "#1A8A3A",
                  icon: "file-text",
                },
                {
                  label: "Audio",
                  value: audioCount,
                  color: "#8E44AD",
                  icon: "headphones",
                },
                {
                  label: "Video",
                  value: videoCount,
                  color: ADMIN_COLOR,
                  icon: "play-circle",
                },
                {
                  label: "Byose",
                  value: allContent.length,
                  color: "#D35400",
                  icon: "layers",
                },
                {
                  label: "Ababyeyi",
                  value: parents.length || 0,
                  color: "#16A085",
                  icon: "users",
                },
              ].map((s) => (
                <View
                  key={s.label}
                  style={[styles.reportCard, { backgroundColor: s.color + "15" }]}
                >
                  <Feather name={s.icon as any} size={22} color={s.color} />
                  <Text style={[styles.reportNum, { color: s.color }]}>
                    {s.value}
                  </Text>
                  <Text style={[styles.reportLabel, { color: s.color }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
            <View
              style={[
                styles.infoBox,
                { backgroundColor: colors.secondary, borderColor: colors.border },
              ]}
            >
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.infoBoxText, { color: colors.primary }]}>
                Raporo yuzuye izatangwa mu verisiyo ikurikiraho. Ubu reba
                imibare y'ibanze.
              </Text>
            </View>
          </>
        );

      case "settings":
        return (
          <>
            <SettingToggle
              label="Ijambo rya sisitemu"
              value={true}
              colors={colors}
              accentColor={ADMIN_COLOR}
            />
            <SettingToggle
              label="Imiterere y'ijoro"
              value={false}
              colors={colors}
              accentColor={ADMIN_COLOR}
            />
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Ururimi
              </Text>
              <View style={[styles.langPill, { backgroundColor: ADMIN_COLOR + "20" }]}>
                <Text style={[styles.langPillText, { color: ADMIN_COLOR }]}>
                  Ikinyarwanda
                </Text>
              </View>
            </View>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Verisiyo ya App
              </Text>
              <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>
                1.0.0
              </Text>
            </View>
          </>
        );

      case "notifications":
        return (
          <>
            <SettingToggle
              label="Amatangazo y'amasomo mashya"
              value={notifEnabled}
              onChange={setNotifEnabled}
              colors={colors}
              accentColor={ADMIN_COLOR}
            />
            <SettingToggle
              label="Amatangazo y'ababyeyi bashya"
              value={true}
              colors={colors}
              accentColor={ADMIN_COLOR}
            />
            <SettingToggle
              label="Amatangazo y'ibyuma"
              value={false}
              colors={colors}
              accentColor={ADMIN_COLOR}
            />
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  marginTop: 8,
                },
              ]}
            >
              <Feather name="bell" size={14} color={colors.primary} />
              <Text style={[styles.infoBoxText, { color: colors.primary }]}>
                Ohereza amatangazo ababyeyi byihuse binyuze mu koranabuhanga
                kuri ubu.
              </Text>
            </View>
          </>
        );

      case "help":
        return (
          <>
            <FaqItem
              q="Nshobora ute gutunga ikibazo?"
              a="Twandikire kuri support@imirire.rw cyangwa uturuhe ubutumwa."
              colors={colors}
            />
            <FaqItem
              q="Nshobora ute kongeraho umuyobozi mushya?"
              a="Abayobozi bashya bashyirwaho n'ubuyobozi bw'ikigo gusa."
              colors={colors}
            />
            <FaqItem
              q="Amasomo ashyirwa ryari?"
              a="Amasomo yashyirwa iyo umuyobozi ashyize inyigisho nshya. Ababyeyi babona vuba."
              colors={colors}
            />
            <View
              style={[
                styles.contactBox,
                {
                  backgroundColor: ADMIN_COLOR + "10",
                  borderColor: ADMIN_COLOR + "30",
                },
              ]}
            >
              <Feather name="mail" size={18} color={ADMIN_COLOR} />
              <View>
                <Text style={[styles.contactLabel, { color: ADMIN_COLOR }]}>
                  Imeli y'ubufasha
                </Text>
                <Text style={[styles.contactValue, { color: colors.foreground }]}>
                  support@imirire.rw
                </Text>
              </View>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  const modalTitles: Record<NonNullable<ModalType>, string> = {
    profile: "Umwirondoro wanjye",
    parents: "Genzura Ababyeyi",
    report: "Raporo",
    settings: "Igenamiterere",
    notifications: "Amatangazo",
    help: "Ubufasha",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Umwirondoro" backgroundColor={ADMIN_COLOR} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.profileCard,
            { backgroundColor: ADMIN_COLOR + "15", borderColor: ADMIN_COLOR + "30" },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: ADMIN_COLOR }]}>
            <Text style={styles.avatarText}>
              {userName ? userName[0].toUpperCase() : "A"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {userName || "Umuyobozi"}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: ADMIN_COLOR }]}>
              <Feather name="shield" size={11} color="#fff" />
              <Text style={styles.roleLabel}>Umuyobozi</Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.menuCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {menuItems.map((item, index) => (
            <React.Fragment key={item.icon}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.modal === "profile") {
                    router.push("/(admin)/profile-details");
                    return;
                  }
                  setActiveModal(item.modal);
                }}
              >
                <View style={[styles.menuIcon, { backgroundColor: ADMIN_COLOR + "15" }]}>
                  <Feather name={item.icon as any} size={18} color={ADMIN_COLOR} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>
                    {item.sublabel}
                  </Text>
                </View>
                <Feather
                  name="chevron-right"
                  size={16}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
              {index < menuItems.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: "#FEE2E2" }]}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Sohoka</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Verisiyo 1.0.0 • Imirire App - Icyiciro cy'Umuyobozi
        </Text>
      </ScrollView>

      <Modal
        visible={activeModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {activeModal ? modalTitles[activeModal] : ""}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {renderModalContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Parent Modal */}
      <Modal
        visible={!!editingParent}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingParent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Hindura Amakuru y'Umubyeyi
              </Text>
              <TouchableOpacity onPress={() => setEditingParent(null)}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.foreground }]}>Izina ryuzuye</Text>
                <View style={[styles.editInputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                  <TextInput
                    style={[styles.editInput, { color: colors.foreground }]}
                    value={parentName}
                    onChangeText={setParentName}
                    placeholder="Izina"
                  />
                </View>
              </View>

              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.foreground }]}>Telefoni</Text>
                <View style={[styles.editInputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                  <TextInput
                    style={[styles.editInput, { color: colors.foreground }]}
                    value={parentPhone}
                    onChangeText={setParentPhone}
                    placeholder="Nimero"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.editField}>
                <Text style={[styles.editLabel, { color: colors.foreground }]}>Imeli</Text>
                <View style={[styles.editInputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                  <TextInput
                    style={[styles.editInput, { color: colors.foreground }]}
                    value={parentEmail}
                    onChangeText={setParentEmail}
                    placeholder="Imeli"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: ADMIN_COLOR, marginTop: 12, opacity: savingParent ? 0.7 : 1 }]} 
                onPress={handleSaveParentEdit}
                disabled={savingParent}
              >
                <Text style={styles.saveBtnText}>{savingParent ? "Biri kubikwa..." : "Bika Impinduka"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: any) {
  return (
    <View style={[infoStyles.row, { borderBottomColor: colors.border }]}>
      <Feather name={icon} size={16} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text style={[infoStyles.value, { color: colors.foreground }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SettingToggle({ label, value, onChange, colors, accentColor }: any) {
  return (
    <View style={[settingStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[settingStyles.label, { color: colors.foreground }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: accentColor + "60" }}
        thumbColor={value ? accentColor : colors.mutedForeground}
      />
    </View>
  );
}

function FaqItem({ q, a, colors }: any) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[faqStyles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setOpen(!open)}
      activeOpacity={0.8}
    >
      <View style={faqStyles.qRow}>
        <Text style={[faqStyles.q, { color: colors.foreground }]}>{q}</Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
        />
      </View>
      {open && (
        <Text style={[faqStyles.a, { color: colors.mutedForeground }]}>
          {a}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: { fontSize: 11, fontFamily: "Inter_400Regular" },
  value: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 2 },
});

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  label: { fontSize: 15, fontFamily: "Inter_500Medium", flex: 1 },
});

const faqStyles = StyleSheet.create({
  item: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  qRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  q: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  a: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 8 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  profileInfo: { gap: 6 },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    alignSelf: "flex-start",
  },
  roleLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#fff" },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginHorizontal: 16 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  version: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalContent: { padding: 20, gap: 12, paddingBottom: 40 },
  // Info card
  infoCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    gap: 10,
    marginBottom: 8,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bigAvatarText: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  infoName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  rolePillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  // Parents
  statPill: {
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  statPillNum: { fontSize: 36, fontFamily: "Inter_700Bold" },
  statPillLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  parentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  parentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  parentAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  parentName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  parentMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  parentDate: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  // Report
  reportSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  reportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  reportCard: {
    width: "47%",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    gap: 6,
  },
  reportNum: { fontSize: 28, fontFamily: "Inter_700Bold" },
  reportLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  // Settings
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  settingValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  langPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  langPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  // Info / help
  infoBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  contactBox: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  contactLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  contactValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  // Empty
  emptyModal: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyModalText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  // Overview & Filter
  overviewCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  overviewTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  overviewStats: { flexDirection: "row", gap: 16 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 8 },
  statValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  filterBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  loadingView: { alignItems: "center", paddingVertical: 32 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  parentActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editField: { gap: 8, marginBottom: 16 },
  editLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  editInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
